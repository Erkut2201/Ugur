import { config } from "dotenv";
import { existsSync } from "fs";
import pg from "pg";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const localPostgresUrl = process.env.POSTGRES_URL;
const neonPostgresUrl = process.env.NEON_POSTGRES_URL;

if (!localPostgresUrl) {
  console.error("POSTGRES_URL fehlt in .env.development");
  process.exit(1);
}

if (!neonPostgresUrl) {
  console.error("NEON_POSTGRES_URL fehlt. Lege die Neon-Ziel-URL als eigene Umgebungsvariable an.");
  process.exit(1);
}

const localSsl = localPostgresUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false };
const neonSsl = neonPostgresUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false };

const source = new pg.Client({ connectionString: localPostgresUrl, ssl: localSsl });
const target = new pg.Client({ connectionString: neonPostgresUrl, ssl: neonSsl });

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
    columns: [
      "id",
      "quote_id",
      "position",
      "description",
      "manufacturer",
      "product_category_id",
      "product_info_title",
      "product_info_text",
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
    columns: [
      "id",
      "invoice_id",
      "position",
      "description",
      "manufacturer",
      "product_category_id",
      "product_info_title",
      "product_info_text",
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
    orderBy: "id",
  },
  {
    table: "manufacturers",
    columns: [
      "id",
      "name",
      "description",
      "website",
      "contact_info",
      "markup_percent",
      "sort_order",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "product_categories",
    columns: [
      "id",
      "manufacturer_id",
      "name",
      "description",
      "product_info_text",
      "parent_id",
      "sort_order",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "catalog_items",
    columns: [
      "id",
      "category_id",
      "article_number",
      "name",
      "description",
      "unit",
      "unit_price",
      "notes",
      "sort_order",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "configurator_products",
    columns: [
      "id",
      "manufacturer_id",
      "name",
      "description",
      "has_width",
      "has_depth",
      "glass_variant_category_id",
      "sort_order",
      "created_at",
      "updated_at",
    ],
    orderBy: "id",
  },
  {
    table: "configurator_prices",
    columns: ["id", "product_id", "width", "depth", "price_net", "source"],
    orderBy: "id",
  },
  {
    table: "configurator_accessories",
    columns: ["id", "manufacturer_id", "category", "name", "price_net", "unit", "sort_order"],
    orderBy: "id",
  },
  {
    table: "manufacturer_colors",
    columns: ["id", "manufacturer_id", "ral", "name", "hex", "sort_order"],
    orderBy: "id",
  },
];

async function getExistingTables(client) {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  return new Set(rows.map((row) => row.table_name));
}

async function getExistingColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((row) => row.column_name);
}

async function loadRows(table, columns, orderBy) {
  const existingColumns = new Set(await getExistingColumns(source, table));
  const selectedColumns = columns.filter((column) => existingColumns.has(column));
  const sql = `SELECT ${selectedColumns.join(", ")} FROM ${table}${orderBy ? ` ORDER BY ${orderBy}` : ""}`;
  const { rows } = await source.query(sql);

  return rows.map((row) => {
    const normalizedRow = {};
    for (const column of columns) {
      normalizedRow[column] = Object.prototype.hasOwnProperty.call(row, column) ? row[column] : null;
    }
    return normalizedRow;
  });
}

async function insertRows(table, columns, rows) {
  if (rows.length === 0) return;

  const existingColumns = new Set(await getExistingColumns(target, table));
  const targetColumns = columns.filter((column) => existingColumns.has(column));
  const placeholders = targetColumns.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${targetColumns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = targetColumns.map((column) => row[column] ?? null);
    await target.query(sql, values);
  }
}

async function resetSequence(table) {
  await target.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
    [table]
  );
}

try {
  await source.connect();
  await target.connect();
  await target.query("BEGIN");

  const sourceTables = await getExistingTables(source);
  const targetTables = await getExistingTables(target);
  const importableConfigs = tableConfigs.filter(
    (config) => sourceTables.has(config.table) && targetTables.has(config.table)
  );

  if (importableConfigs.length === 0) {
    throw new Error("Keine gemeinsamen Tabellen zwischen Quell- und Zieldatenbank gefunden");
  }

  const truncateTables = [...importableConfigs].reverse().map((config) => config.table);
  await target.query(`TRUNCATE TABLE ${truncateTables.join(", ")} RESTART IDENTITY CASCADE`);

  for (const config of importableConfigs) {
    const rows = await loadRows(config.table, config.columns, config.orderBy);
    await insertRows(config.table, config.columns, rows);
    await resetSequence(config.table);
    console.log(`✓ ${config.table}: ${rows.length}`);
  }

  await target.query("COMMIT");
  console.log("\n✓ Lokale Postgres-Daten nach Neon importiert");
} catch (error) {
  await target.query("ROLLBACK").catch(() => {});
  console.error("Import fehlgeschlagen:", error);
  process.exitCode = 1;
} finally {
  await source.end().catch(() => {});
  await target.end().catch(() => {});
}
