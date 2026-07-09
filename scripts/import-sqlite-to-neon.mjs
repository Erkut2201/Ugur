import { config } from "dotenv";
import { existsSync } from "fs";
import Database from "better-sqlite3";
import pg from "pg";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const sqlitePath = process.env.SQLITE_PATH || "./data/local.db";
const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.error("POSTGRES_URL fehlt");
  process.exit(1);
}

const ssl = postgresUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false };
const sqlite = new Database(sqlitePath, { readonly: true });
const client = new pg.Client({ connectionString: postgresUrl, ssl });

const tableConfigs = [
  {
    table: "users",
    columns: ["id", "email", "password_hash", "created_at"],
    orderBy: "id",
  },
  {
    table: "customers",
    columns: [
      "id",
      "salutation",
      "first_name",
      "name",
      "company",
      "street",
      "zip",
      "city",
      "email",
      "phone",
      "notes",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "document_counters",
    columns: ["id", "type", "year", "last_number"],
    orderBy: "id",
  },
  {
    table: "quotes",
    columns: [
      "id",
      "quote_number",
      "customer_id",
      "date",
      "valid_until",
      "project_description",
      "notes",
      "payment_terms",
      "status",
      "vat_rate",
      "subtotal",
      "vat_amount",
      "total",
      "billing_name",
      "billing_street",
      "billing_zip",
      "billing_city",
      "pdf_s3_key",
      "created_at",
      "updated_at",
    ],
    extra: (row) => ({ ...row, down_payment_percent: row.down_payment_percent ?? 50 }),
    targetColumns: [
      "id",
      "quote_number",
      "customer_id",
      "date",
      "valid_until",
      "project_description",
      "notes",
      "payment_terms",
      "down_payment_percent",
      "status",
      "vat_rate",
      "subtotal",
      "vat_amount",
      "total",
      "billing_name",
      "billing_street",
      "billing_zip",
      "billing_city",
      "pdf_s3_key",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "quote_items",
    columns: ["id", "quote_id", "position", "description", "quantity", "unit", "unit_price", "total"],
    extra: (row) => ({
      ...row,
      manufacturer: null,
      product_category_id: null,
      product_info_title: null,
      product_info_text: null,
      product_description: null,
    }),
    filter: (row, context) => context.quoteIds.has(row.quote_id),
    targetColumns: [
      "id",
      "quote_id",
      "position",
      "description",
      "manufacturer",
      "product_category_id",
      "product_info_title",
      "product_info_text",
      "product_description",
      "quantity",
      "unit",
      "unit_price",
      "total",
    ],
    orderBy: "id",
  },
  {
    table: "invoices",
    columns: [
      "id",
      "invoice_number",
      "quote_id",
      "customer_id",
      "date",
      "due_date",
      "payment_terms",
      "project_description",
      "notes",
      "status",
      "vat_rate",
      "subtotal",
      "vat_amount",
      "total",
      "billing_name",
      "billing_street",
      "billing_zip",
      "billing_city",
      "pdf_s3_key",
      "created_at",
      "updated_at",
    ],
    extra: (row) => ({
      ...row,
      invoice_type: row.invoice_type ?? "standard",
      invoice_group_number: row.invoice_group_number ?? row.invoice_number,
      installment_index: row.installment_index ?? null,
      credited_invoice_id: row.credited_invoice_id ?? null,
    }),
    targetColumns: [
      "id",
      "invoice_number",
      "quote_id",
      "customer_id",
      "invoice_type",
      "invoice_group_number",
      "installment_index",
      "credited_invoice_id",
      "date",
      "due_date",
      "payment_terms",
      "project_description",
      "notes",
      "status",
      "vat_rate",
      "subtotal",
      "vat_amount",
      "total",
      "billing_name",
      "billing_street",
      "billing_zip",
      "billing_city",
      "pdf_s3_key",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "invoice_items",
    columns: ["id", "invoice_id", "position", "description", "quantity", "unit", "unit_price", "total"],
    extra: (row) => ({
      ...row,
      manufacturer: null,
      product_category_id: null,
      product_info_title: null,
      product_info_text: null,
      product_description: null,
    }),
    targetColumns: [
      "id",
      "invoice_id",
      "position",
      "description",
      "manufacturer",
      "product_category_id",
      "product_info_title",
      "product_info_text",
      "product_description",
      "quantity",
      "unit",
      "unit_price",
      "total",
    ],
    orderBy: "id",
  },
  {
    table: "protocols",
    columns: [
      "id",
      "protocol_number",
      "invoice_id",
      "quote_id",
      "customer_id",
      "date",
      "project_description",
      "location",
      "notes",
      "defects",
      "status",
      "pdf_s3_key",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "protocol_items",
    columns: ["id", "protocol_id", "position", "description", "completed", "notes"],
    orderBy: "id",
  },
  {
    table: "services",
    columns: [
      "id",
      "name",
      "description",
      "unit",
      "unit_price",
      "category",
      "notes",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "units_catalog",
    columns: ["id", "name", "sort_order"],
    orderBy: "id",
  },
  {
    table: "public_inquiries",
    columns: [
      "id",
      "type",
      "product",
      "name",
      "email",
      "phone",
      "address",
      "message",
      "consent_accepted",
      "file_count",
      "uploaded_files_json",
      "created_at",
    ],
    extra: (row) => ({
      ...row,
      consent_accepted: row.consent_accepted === null ? true : Boolean(row.consent_accepted),
    }),
    targetColumns: [
      "id",
      "type",
      "product",
      "name",
      "email",
      "phone",
      "address",
      "message",
      "consent_accepted",
      "file_count",
      "uploaded_files_json",
      "created_at",
    ],
    orderBy: "id",
  },
];

function getExistingColumns(table) {
  return sqlite.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all().map((column) => column.name);
}

function loadRows(table, columns, orderBy) {
  const existingColumns = new Set(getExistingColumns(table));
  const selectedColumns = columns.filter((column) => existingColumns.has(column));
  const sql = `SELECT ${selectedColumns.join(", ")} FROM ${table}${orderBy ? ` ORDER BY ${orderBy}` : ""}`;
  const rows = sqlite.prepare(sql).all();

  return rows.map((row) => {
    const normalizedRow = {};
    for (const column of columns) {
      normalizedRow[column] = Object.prototype.hasOwnProperty.call(row, column) ? row[column] : null;
    }
    return normalizedRow;
  });
}

function buildContext(importedRowsByTable) {
  return {
    quoteIds: new Set((importedRowsByTable.quotes || []).map((row) => row.id)),
  };
}

async function insertRows(table, columns, rows) {
  if (rows.length === 0) return;

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = columns.map((column) => row[column] ?? null);
    await client.query(sql, values);
  }
}

async function resetSequence(table) {
  await client.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
    [table]
  );
}

try {
  await client.connect();
  await client.query("BEGIN");

  await client.query(`
    TRUNCATE TABLE
      public_inquiries,
      protocol_items,
      protocols,
      invoice_items,
      invoices,
      quote_items,
      quotes,
      document_counters,
      services,
      units_catalog,
      customers,
      users
    RESTART IDENTITY CASCADE
  `);

  const importedRowsByTable = {};

  for (const config of tableConfigs) {
    const baseRows = loadRows(config.table, config.columns, config.orderBy);
    const enrichedRows = config.extra ? baseRows.map(config.extra) : baseRows;
    const context = buildContext(importedRowsByTable);
    const rows = config.filter ? enrichedRows.filter((row) => config.filter(row, context)) : enrichedRows;
    const targetColumns = config.targetColumns ?? config.columns;
    await insertRows(config.table, targetColumns, rows);
    importedRowsByTable[config.table] = rows;
    await resetSequence(config.table);
    console.log(`✓ ${config.table}: ${rows.length}`);
  }

  await client.query("COMMIT");
  console.log("\n✓ SQLite-Daten nach Neon importiert");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Import fehlgeschlagen:", error);
  process.exitCode = 1;
} finally {
  sqlite.close();
  await client.end().catch(() => {});
}
