import { config } from "dotenv";
import { existsSync } from "fs";
import pg from "pg";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const { Pool } = pg;
const connStr = process.env.POSTGRES_URL ||
  `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`;

const pool = new Pool({ connectionString: connStr });
await pool.query("ALTER TABLE configurator_products ADD COLUMN IF NOT EXISTS glass_variant_category_id integer");
console.log("✓ Spalte glass_variant_category_id hinzugefügt (oder bereits vorhanden)");
await pool.end();
