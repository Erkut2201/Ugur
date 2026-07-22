// server/utils/documentNumber.ts
// Generates sequential document numbers with year-based reset.
// Format: {PREFIX}{YY}-{NNN}  e.g. ANG26-001
// Prefix comes from env vars: QUOTE_PREFIX, INVOICE_PREFIX, PROTOCOL_PREFIX

import { eq, and, desc, like } from "drizzle-orm";
import { getDb } from "../db.js";
import {
  USE_POSTGRES,
  documentCountersTable,
  documentCountersTableSQLite,
  quotesTable,
  quotesTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  protocolsTable,
  protocolsTableSQLite,
} from "../../shared/schema.js";

type DocType = "quote" | "invoice" | "protocol";

const prefixMap: Record<DocType, string> = {
  quote: process.env.QUOTE_PREFIX ?? "ANG",
  invoice: process.env.INVOICE_PREFIX ?? "RNG",
  protocol: process.env.PROTOCOL_PREFIX ?? "ABN",
};

const countersTable = () =>
  USE_POSTGRES ? documentCountersTable : documentCountersTableSQLite;

const documentTables = {
  quote: () => USE_POSTGRES ? quotesTable : quotesTableSQLite,
  invoice: () => USE_POSTGRES ? invoicesTable : invoicesTableSQLite,
  protocol: () => USE_POSTGRES ? protocolsTable : protocolsTableSQLite,
};

const documentNumberColumns = {
  quote: "quoteNumber",
  invoice: "invoiceNumber",
  protocol: "protocolNumber",
} as const;

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
  const prefix = prefixMap[type];
  const shortYear = String(year).slice(-2);

  // 1. Prüfe die letzte Dokumentnummer aus der Datenbank
  const docTable = documentTables[type]();
  const docNumberCol = documentNumberColumns[type];
  const pattern = `${prefix}${shortYear}-%`;

  const lastDocRows = await (db as any)
    .select()
    .from(docTable)
    .where(like((docTable as any)[docNumberCol], pattern))
    .orderBy(desc((docTable as any)[docNumberCol]))
    .limit(1);

  let maxSequenceFromDb = 0;
  if (lastDocRows.length > 0) {
    const lastNumber = lastDocRows[0][docNumberCol];
    const parsed = parseDocumentNumber(lastNumber);
    if (parsed && parsed.year === year) {
      maxSequenceFromDb = parsed.sequence;
    }
  }

  // 2. Prüfe den Counter
  let counterRows = await (db as any)
    .select()
    .from(tbl)
    .where(and(eq(tbl.type, type), eq(tbl.year, year)))
    .limit(1);

  let maxSequenceFromCounter = 0;
  if (counterRows.length > 0) {
    maxSequenceFromCounter = counterRows[0].lastNumber;
  }

  // 3. Nimm das Maximum aus beiden Quellen
  const nextNum = Math.max(maxSequenceFromDb, maxSequenceFromCounter) + 1;

  // 4. Aktualisiere oder erstelle den Counter
  if (counterRows.length === 0) {
    await (db as any)
      .insert(tbl)
      .values({ type, year, lastNumber: nextNum });
  } else {
    await (db as any)
      .update(tbl)
      .set({ lastNumber: nextNum })
      .where(and(eq(tbl.type, type), eq(tbl.year, year)));
  }

  return formatDocumentNumber(type, year, nextNum);
}

export async function reserveDocumentNumber(type: DocType, documentNumber: string): Promise<void> {
  const parsed = parseDocumentNumber(documentNumber);
  if (!parsed) {
    throw new Error(`Ungültige Dokumentnummer: ${documentNumber}`);
  }

  const { db } = getDb();
  const { year, sequence } = parsed;
  const tbl = countersTable();

  const rows = await (db as any)
    .select()
    .from(tbl)
    .where(and(eq(tbl.type, type), eq(tbl.year, year)))
    .limit(1);

  if (rows.length === 0) {
    await (db as any)
      .insert(tbl)
      .values({ type, year, lastNumber: sequence });
  } else {
    const currentLastNumber = rows[0].lastNumber;
    if (sequence > currentLastNumber) {
      await (db as any)
        .update(tbl)
        .set({ lastNumber: sequence })
        .where(and(eq(tbl.type, type), eq(tbl.year, year)));
    }
  }
}
