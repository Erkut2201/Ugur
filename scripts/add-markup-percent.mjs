// scripts/add-markup-percent.mjs
import { config } from "dotenv";
import { existsSync } from "fs";
import pg from "pg";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const { Pool } = pg;
const connStr =
  process.env.POSTGRES_URL ||
  `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`;

const pool = new Pool({ connectionString: connStr });
await pool.query(
  "ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS markup_percent NUMERIC(6,2) NOT NULL DEFAULT 0"
);
console.log("✓ Spalte markup_percent hinzugefügt (oder bereits vorhanden)");
await pool.end();
