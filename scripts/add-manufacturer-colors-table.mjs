import { config } from "dotenv";
import { existsSync } from "fs";
import pg from "pg";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL ||
    `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS manufacturer_colors (
    id serial PRIMARY KEY,
    manufacturer_id integer NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    ral text NOT NULL,
    name text NOT NULL,
    hex text NOT NULL DEFAULT '#cccccc',
    sort_order integer NOT NULL DEFAULT 0
  )
`);
console.log("✓ Tabelle manufacturer_colors angelegt (oder bereits vorhanden)");

// APT-Standardfarben eintragen falls noch keine vorhanden
const { rows: aptRows } = await pool.query(`SELECT id FROM manufacturers WHERE name = 'APT' LIMIT 1`);
if (aptRows.length > 0) {
  const mfrId = aptRows[0].id;
  const { rows: existing } = await pool.query(
    `SELECT id FROM manufacturer_colors WHERE manufacturer_id = $1 LIMIT 1`, [mfrId]
  );
  if (existing.length === 0) {
    const colors = [
      { ral: "7016ST", name: "Anthrazit",     hex: "#383E42", sort: 0 },
      { ral: "8014ST", name: "Sepiabraun",    hex: "#4A3728", sort: 1 },
      { ral: "9006ST", name: "Weißaluminium", hex: "#A5A5A5", sort: 2 },
      { ral: "9007ST", name: "Graualuminium", hex: "#8A8D8F", sort: 3 },
      { ral: "9010",   name: "Weiß",          hex: "#F4F4F4", sort: 4 },
    ];
    for (const c of colors) {
      await pool.query(
        `INSERT INTO manufacturer_colors (manufacturer_id, ral, name, hex, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [mfrId, c.ral, c.name, c.hex, c.sort]
      );
    }
    console.log(`✓ ${colors.length} APT-Standardfarben eingetragen`);
  } else {
    console.log("ℹ APT-Farben bereits vorhanden, nichts eingefügt");
  }
}

await pool.end();
