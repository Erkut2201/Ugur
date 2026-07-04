// server/migrate.ts
// Runs schema migrations (push) and seeds the admin user on first start.
// Works for both PostgreSQL and SQLite — dialect detected from env vars.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { USE_POSTGRES } from "../shared/schema.js";
import {
  usersTable,
  usersTableSQLite,
  customersTable,
  customersTableSQLite,
  documentCountersTable,
  documentCountersTableSQLite,
  quotesTable,
  quotesTableSQLite,
  quoteItemsTable,
  quoteItemsTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  invoiceItemsTable,
  invoiceItemsTableSQLite,
  protocolsTable,
  protocolsTableSQLite,
  protocolItemsTable,
  protocolItemsTableSQLite,
  publicInquiriesTable,
  publicInquiriesTableSQLite,
} from "../shared/schema.js";

async function migratePostgres(db: any) {
  // Use drizzle-kit push programmatically via raw SQL DDL
  // We create tables if not exists to keep it simple and safe
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  // Add new columns if they don't exist yet (safe on re-runs)
  await db.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name TEXT`);
  await db.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS salutation TEXT`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS document_counters (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      year INTEGER NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      UNIQUE(type, year)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      quote_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id),
      date TEXT NOT NULL,
      valid_until TEXT,
      project_description TEXT,
      notes TEXT,
      payment_terms TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      vat_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      pdf_s3_key TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      quote_id INTEGER REFERENCES quotes(id),
      customer_id INTEGER REFERENCES customers(id),
      date TEXT NOT NULL,
      due_date TEXT,
      payment_terms TEXT,
      project_description TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      vat_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      pdf_s3_key TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS protocols (
      id SERIAL PRIMARY KEY,
      protocol_number TEXT NOT NULL UNIQUE,
      invoice_id INTEGER REFERENCES invoices(id),
      quote_id INTEGER REFERENCES quotes(id),
      customer_id INTEGER REFERENCES customers(id),
      date TEXT NOT NULL,
      project_description TEXT,
      location TEXT,
      notes TEXT,
      defects TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      pdf_s3_key TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS protocol_items (
      id SERIAL PRIMARY KEY,
      protocol_id INTEGER NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      notes TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      category TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS units_catalog (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS public_inquiries (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      product TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      message TEXT NOT NULL,
      consent_accepted BOOLEAN NOT NULL DEFAULT true,
      file_count INTEGER NOT NULL DEFAULT 0,
      uploaded_files_json TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  // Remove pre-seeded default units (no longer desired)
  const oldDefaults = ["Stk", "Std", "Pauschal", "m\u00B2", "lfd. m", "m", "kg", "Set"];
  const placeholders = oldDefaults.map((_, i) => `$${i + 1}`).join(", ");
  await db.execute(`DELETE FROM units_catalog WHERE name IN (${placeholders})`, oldDefaults).catch(() => {});

  console.log("[migrate] PostgreSQL tables ensured");
}

function migrateSQLite(db: any) {
  // node:sqlite uses db.exec() for DDL (not db.run())
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  try { db.exec(`ALTER TABLE customers ADD COLUMN first_name TEXT`); } catch {}
  try { db.exec(`ALTER TABLE customers ADD COLUMN salutation TEXT`); } catch {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      year INTEGER NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      UNIQUE(type, year)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      date TEXT NOT NULL,
      valid_until TEXT,
      project_description TEXT,
      notes TEXT,
      payment_terms TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      vat_rate REAL NOT NULL DEFAULT 19,
      subtotal REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      pdf_s3_key TEXT,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      quote_id INTEGER,
      customer_id INTEGER,
      date TEXT NOT NULL,
      due_date TEXT,
      payment_terms TEXT,
      project_description TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      vat_rate REAL NOT NULL DEFAULT 19,
      subtotal REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      pdf_s3_key TEXT,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_number TEXT NOT NULL UNIQUE,
      invoice_id INTEGER,
      quote_id INTEGER,
      customer_id INTEGER,
      date TEXT NOT NULL,
      project_description TEXT,
      location TEXT,
      notes TEXT,
      defects TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      pdf_s3_key TEXT,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS protocol_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'Stk',
      unit_price REAL NOT NULL DEFAULT 0,
      category TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS units_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS public_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      product TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      message TEXT NOT NULL,
      consent_accepted INTEGER NOT NULL DEFAULT 1,
      file_count INTEGER NOT NULL DEFAULT 0,
      uploaded_files_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')) NOT NULL
    )
  `);
  // Remove pre-seeded default units (no longer desired)
  const oldDefaults = ["Stk", "Std", "Pauschal", "m\u00B2", "lfd. m", "m", "kg", "Set"];
  const quoted = oldDefaults.map(u => `'${u.replace(/'/g, "''")}'`).join(", ");
  try { db.exec(`DELETE FROM units_catalog WHERE name IN (${quoted})`); } catch {}
  console.log("[migrate] SQLite tables ensured");
}

export async function runMigrations() {
  const { db, pool, dialect } = getDb();

  if (dialect === "postgres") {
    await migratePostgres(db);
  } else {
    // node:sqlite is synchronous — call sync methods on the raw pool
    migrateSQLite(pool);
  }
}

export async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@planungsbuero-dietzel.de";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("[seed] ADMIN_PASSWORD not set — skipping admin seed");
    return;
  }

  const { db, dialect } = getDb();
  const table = USE_POSTGRES ? usersTable : usersTableSQLite;

  const existing = await (db as any)
    .select()
    .from(table)
    .where(eq(table.email, adminEmail))
    .limit(1);

  if (existing.length > 0) {
    // Always sync password from env so Render env changes take effect immediately
    const hash = await bcrypt.hash(adminPassword, 10);
    await (db as any).update(table).set({ passwordHash: hash }).where(eq(table.email, adminEmail));
    console.log(`[seed] Admin password synced: ${adminEmail}`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  await (db as any).insert(table).values({ email: adminEmail, passwordHash: hash });
  console.log(`[seed] Admin user created: ${adminEmail}`);
}
