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

// Hersteller APT ermitteln
const { rows: [mfr] } = await pool.query(`SELECT id FROM manufacturers WHERE name = 'APT' LIMIT 1`);
if (!mfr) { console.error("Hersteller APT nicht gefunden"); process.exit(1); }

// ESG-Glas Kategorie anlegen (unter "Zubehör & Profile" → id 36)
const { rows: existing } = await pool.query(
  `SELECT id FROM product_categories WHERE name = 'ESG Glas (GGS/SlideCold)' LIMIT 1`
);
let esgCatId;
if (existing.length > 0) {
  esgCatId = existing[0].id;
  console.log(`ℹ Kategorie "ESG Glas (GGS/SlideCold)" bereits vorhanden (id=${esgCatId})`);
} else {
  const { rows: [cat] } = await pool.query(
    `INSERT INTO product_categories (manufacturer_id, name, description, parent_id, sort_order, created_at, updated_at)
     VALUES ($1, 'ESG Glas (GGS/SlideCold)', 'ESG-Glasvarianten für Glasschiebeanlagen und SlideCold', NULL, 45, NOW(), NOW())
     RETURNING id`,
    [mfr.id]
  );
  esgCatId = cat.id;
  console.log(`✓ Kategorie "ESG Glas (GGS/SlideCold)" angelegt (id=${esgCatId})`);

  // ESG-Artikel anlegen
  const esgItems = [
    { name: "ESG 10mm klar",      unit: "m²", price: 55.03, sort: 0 },
    { name: "ESG 10mm satiniert", unit: "m²", price: 98.77, sort: 1 },
    { name: "ESG 10mm grau",      unit: "m²", price: 75.03, sort: 2 },
  ];
  for (const item of esgItems) {
    await pool.query(
      `INSERT INTO catalog_items (category_id, name, unit, unit_price, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [esgCatId, item.name, item.unit, item.price, item.sort]
    );
    console.log(`  ✓ Artikel "${item.name}" angelegt`);
  }
}

// GGS und SlideCold Produkte verknüpfen
const { rowCount } = await pool.query(
  `UPDATE configurator_products SET glass_variant_category_id = $1
   WHERE (name LIKE '%GGS%' OR name LIKE '%SlideCold%') AND glass_variant_category_id IS NULL`,
  [esgCatId]
);
console.log(`\n✓ ${rowCount} GGS/SlideCold-Produkte mit ESG-Glas verknüpft`);

await pool.end();
