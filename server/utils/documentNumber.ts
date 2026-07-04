// server/utils/documentNumber.ts
// Generates sequential document numbers with year-based reset.
// Format: {PREFIX}-{YEAR}-{NNNN}  e.g. ANG-2026-0001
// Prefix comes from env vars: QUOTE_PREFIX, INVOICE_PREFIX, PROTOCOL_PREFIX

import { eq, and } from "drizzle-orm";
import { getDb } from "../db.js";
import {
  USE_POSTGRES,
  documentCountersTable,
  documentCountersTableSQLite,
} from "../../shared/schema.js";

type DocType = "quote" | "invoice" | "protocol";

const prefixMap: Record<DocType, string> = {
  quote: process.env.QUOTE_PREFIX ?? "ANG",
  invoice: process.env.INVOICE_PREFIX ?? "RNG",
  protocol: process.env.PROTOCOL_PREFIX ?? "ABN",
};

const countersTable = () =>
  USE_POSTGRES ? documentCountersTable : documentCountersTableSQLite;

export async function nextDocumentNumber(type: DocType): Promise<string> {
  const { db } = getDb();
  const year = new Date().getFullYear();
  const tbl = countersTable();

  // Find or create the counter row for this type+year
  let rows = await (db as any)
    .select()
    .from(tbl)
    .where(and(eq(tbl.type, type), eq(tbl.year, year)))
    .limit(1);

  let nextNum: number;

  if (rows.length === 0) {
    // First document of this type for this year
    const inserted = await (db as any)
      .insert(tbl)
      .values({ type, year, lastNumber: 1 })
      .returning();
    nextNum = inserted[0]?.lastNumber ?? 1;
  } else {
    nextNum = rows[0].lastNumber + 1;
    await (db as any)
      .update(tbl)
      .set({ lastNumber: nextNum })
      .where(and(eq(tbl.type, type), eq(tbl.year, year)));
  }

  const prefix = prefixMap[type];
  const padded = String(nextNum).padStart(4, "0");
  return `${prefix}-${year}-${padded}`;
}
