// scripts/create-catalog-tables.mjs
// Creates product_categories and catalog_items tables directly via SQL.
// Run with: node scripts/create-catalog-tables.mjs

import "dotenv/config";
import pg from "pg";
import { existsSync, readFileSync } from "fs";
import { config } from "dotenv";

// Load .env.development if present
if (existsSync(".env.development")) {
  config({ path: ".env.development", override: true });
}

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Kein POSTGRES_URL gefunden");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS product_categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    parent_id   INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )
`);
console.log("✓ product_categories");

await client.query(`
  CREATE TABLE IF NOT EXISTS catalog_items (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    article_number  TEXT,
    name            TEXT NOT NULL,
    description     TEXT,
    unit            TEXT NOT NULL DEFAULT 'Stk',
    unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes           TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )
`);
console.log("✓ catalog_items");

await client.end();
console.log("Done.");
