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

// Alle Konfigurator-Produkte laden
const { rows: products } = await pool.query(
  `SELECT id, name, glass_variant_category_id FROM configurator_products ORDER BY id`
);
console.log("\nKonfigurator-Produkte:");
products.forEach(p => console.log(`  [${p.id}] ${p.name} → glass_variant_category_id: ${p.glass_variant_category_id ?? "NULL"}`));

// Alle Katalog-Kategorien laden
const { rows: cats } = await pool.query(
  `SELECT id, name FROM product_categories ORDER BY id`
);
console.log("\nKatalog-Kategorien:");
cats.forEach(c => console.log(`  [${c.id}] ${c.name}`));

// Mapping: Konfigurator-Produktname-Substring → Katalogkategorie-Substring
const mappings = [
  { productMatch: "Glas",       categoryMatch: "VSG Glas" },
  { productMatch: "Steg",       categoryMatch: "Sechsfachsteg" },
  { productMatch: "GGS",        categoryMatch: "ESG" },
  { productMatch: "SlideCold",  categoryMatch: "ESG" },
  { productMatch: "SLZ",        categoryMatch: "VSG Glas" },
];

console.log("\nVerknüpfungen:");
let updated = 0;
for (const product of products) {
  if (product.glass_variant_category_id) {
    console.log(`  [${product.id}] ${product.name} → bereits gesetzt (${product.glass_variant_category_id}), übersprungen`);
    continue;
  }

  const mapping = mappings.find(m => product.name.includes(m.productMatch));
  if (!mapping) {
    console.log(`  [${product.id}] ${product.name} → kein Mapping gefunden`);
    continue;
  }

  const cat = cats.find(c => c.name.toLowerCase().includes(mapping.categoryMatch.toLowerCase()));
  if (!cat) {
    console.log(`  [${product.id}] ${product.name} → Kategorie "${mapping.categoryMatch}" nicht gefunden`);
    continue;
  }

  await pool.query(
    `UPDATE configurator_products SET glass_variant_category_id = $1 WHERE id = $2`,
    [cat.id, product.id]
  );
  console.log(`  ✓ [${product.id}] ${product.name} → Kategorie [${cat.id}] "${cat.name}"`);
  updated++;
}

console.log(`\n${updated} Produkte aktualisiert.`);
await pool.end();
