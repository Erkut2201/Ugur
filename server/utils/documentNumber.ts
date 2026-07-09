// server/utils/documentNumber.ts
// Generates sequential document numbers with year-based reset.
// Format: {PREFIX}{YY}-{NNN}  e.g. ANG26-001
// Prefix comes from env vars: QUOTE_PREFIX, INVOICE_PREFIX, PROTOCOL_PREFIX

import { eq, and } from "drizzle-orm";
import { getDb } from "../db.js";
import {
  USE_POSTGRES,
  documentCountersTable,
  documentCountersTableSQLite,
} from "../../shared/schema.js";

type DocType = "quote" | "invoice" | "protocol";

const GLOBAL_COUNTER_TYPE = "global";

const prefixMap: Record<DocType, string> = {
  quote: process.env.QUOTE_PREFIX ?? "ANG",
  invoice: process.env.INVOICE_PREFIX ?? "RNG",
  protocol: process.env.PROTOCOL_PREFIX ?? "ABN",
};

const countersTable = () =>
  USE_POSTGRES ? documentCountersTable : documentCountersTableSQLite;

function formatDocumentNumber(type: DocType, year: number, sequence: number): string {
  const prefix = prefixMap[type];
  const shortYear = String(year).slice(-2);
  const padded = String(sequence).padStart(3, "0");
  return `${prefix}${shortYear}-${padded}`;
}

function parseDocumentNumber(documentNumber: string): { year: number; sequence: number } | null {
  const compactMatch = documentNumber.match(/^[A-Z]+(\d{2})-(\d+)$/i);
  if (compactMatch) {
    return {
      year: 2000 + Number(compactMatch[1]),
      sequence: Number(compactMatch[2]),
    };
  }

  const legacyMatch = documentNumber.match(/^[A-Z]+-(\d{4})-(\d+)$/i);
  if (legacyMatch) {
    return {
      year: Number(legacyMatch[1]),
      sequence: Number(legacyMatch[2]),
    };
  }

  return null;
}

export function convertDocumentNumber(type: DocType, sourceNumber: string): string {
  const parsed = parseDocumentNumber(sourceNumber);
  if (!parsed) {
    throw new Error(`Ungültige Dokumentnummer: ${sourceNumber}`);
  }

  return formatDocumentNumber(type, parsed.year, parsed.sequence);
}

export function getInvoiceGroupNumberFromQuoteNumber(sourceNumber: string): string {
  return convertDocumentNumber("invoice", sourceNumber);
}

export function formatInstallmentInvoiceNumber(groupNumber: string, installmentIndex: number): string {
  const normalizedIndex = Math.trunc(installmentIndex);
  if (normalizedIndex <= 0) {
    throw new Error(`Ungültiger Teilrechnungsindex: ${installmentIndex}`);
  }

  return `${groupNumber}-${String(normalizedIndex).padStart(2, "0")}`;
}

export async function nextDocumentNumber(type: DocType): Promise<string> {
  const { db } = getDb();
  const year = new Date().getFullYear();
  const tbl = countersTable();

  // Find or create the global counter row for this year
  let rows = await (db as any)
    .select()
    .from(tbl)
    .where(and(eq(tbl.type, GLOBAL_COUNTER_TYPE), eq(tbl.year, year)))
    .limit(1);

  let nextNum: number;

  if (rows.length === 0) {
    const inserted = await (db as any)
      .insert(tbl)
      .values({ type: GLOBAL_COUNTER_TYPE, year, lastNumber: 1 })
      .returning();
    nextNum = inserted[0]?.lastNumber ?? 1;
  } else {
    nextNum = rows[0].lastNumber + 1;
    await (db as any)
      .update(tbl)
      .set({ lastNumber: nextNum })
      .where(and(eq(tbl.type, GLOBAL_COUNTER_TYPE), eq(tbl.year, year)));
  }

  return formatDocumentNumber(type, year, nextNum);
}
