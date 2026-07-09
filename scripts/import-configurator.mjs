// scripts/import-configurator.mjs
// Importiert Preisdaten + Zubehör aus APT_KubiQ_Preiskalkulator.xlsx
// in die Konfigurator-Tabellen (configurator_products, configurator_prices, configurator_accessories).
// Idempotent: TRUNCATE + INSERT bei jedem Lauf.
// Run: node scripts/import-configurator.mjs

import { existsSync } from "fs";
import { config } from "dotenv";
import pg from "pg";
import XLSX from "xlsx";

// ── Env laden ────────────────────────────────────────────────────────────────
if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) { console.error("❌ Kein POSTGRES_URL gefunden"); process.exit(1); }

const ssl = connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });
await client.connect();
console.log("✓ DB verbunden\n");

// ── Excel laden ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile("./client/example/APT_KubiQ_Preiskalkulator.xlsx");

// ── APT-Hersteller ID holen (muss bereits existieren) ───────────────────────
const mfrResult = await client.query(`SELECT id FROM manufacturers WHERE name = 'APT' LIMIT 1`);
if (!mfrResult.rows.length) {
  console.error("❌ Hersteller 'APT' nicht in der DB gefunden. Erst Server starten (Migration läuft dadurch).");
  await client.end();
  process.exit(1);
}
const aptId = mfrResult.rows[0].id;
console.log(`✓ APT Hersteller ID: ${aptId}\n`);

// ── Tabellen leeren ──────────────────────────────────────────────────────────
console.log("Leere bestehende Konfigurator-Daten…");

// Spalten-Typen anpassen falls Tabelle mit alter Precision erstellt wurde
await client.query(`ALTER TABLE configurator_prices ALTER COLUMN width TYPE NUMERIC(10,2)`).catch(() => {});
await client.query(`ALTER TABLE configurator_prices ALTER COLUMN depth TYPE NUMERIC(10,2)`).catch(() => {});

await client.query(`
  TRUNCATE configurator_prices, configurator_accessories, configurator_products
  RESTART IDENTITY CASCADE
`);
console.log("✓ Tabellen geleert\n");

// ── Helper ────────────────────────────────────────────────────────────────────
async function insertProduct(name, description, sortOrder) {
  const res = await client.query(
    `INSERT INTO configurator_products (manufacturer_id, name, description, has_width, has_depth, sort_order)
     VALUES ($1, $2, $3, true, true, $4) RETURNING id`,
    [aptId, name, description || null, sortOrder ?? 0]
  );
  return res.rows[0].id;
}

async function insertPrice(productId, width, depth, priceNet, source) {
  await client.query(
    `INSERT INTO configurator_prices (product_id, width, depth, price_net, source)
     VALUES ($1, $2, $3, $4, $5)`,
    [productId, width, depth, priceNet, source || null]
  );
}

async function insertAccessory(category, name, priceNet, unit, sortOrder) {
  await client.query(
    `INSERT INTO configurator_accessories (manufacturer_id, category, name, price_net, unit, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [aptId, category, name, priceNet, unit || "Stk", sortOrder ?? 0]
  );
}

function normalizeUnit(raw) {
  if (!raw) return "Stk";
  const r = String(raw).toLowerCase();
  if (r.includes("meter")) return "m";
  if (r.includes("m²") || r.includes("m2")) return "m²";
  if (r.includes("lfm")) return "lfm";
  if (r.includes("pausch")) return "Pauschal";
  return "Stk";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PRODUKTE & PREISRASTER (Sheet "Preisdaten")
//    Spalten: Produkt | Breite | Tiefe_Hoehe | Preis_netto | Sonderfarbe_Hinweis | Quelle
// ═══════════════════════════════════════════════════════════════════════════════
console.log("=== 1. Produkte & Preisraster ===");

const preisRows = XLSX.utils.sheet_to_json(wb.Sheets["Preisdaten"], { header: 1, defval: "" });
const dataRows = preisRows.slice(1).filter(r => r[0] && r[3]);

// Produkte gruppieren: name → [{breite, tiefe, preis, quelle}]
const produktMap = new Map();
for (const row of dataRows) {
  const name   = String(row[0]).trim();
  const breite = Number(row[1]);
  const tiefe  = Number(row[2]);
  const preis  = Number(row[3]);
  const quelle = String(row[5] || "").trim();
  if (!produktMap.has(name)) produktMap.set(name, []);
  produktMap.get(name).push({ breite, tiefe, preis, quelle });
}

let prodSort = 0;
let totalPreise = 0;
for (const [name, preise] of produktMap) {
  const prodId = await insertProduct(name, null, prodSort++);
  for (const { breite, tiefe, preis, quelle } of preise) {
    await insertPrice(prodId, breite, tiefe, preis, quelle || null);
    totalPreise++;
  }
  console.log(`  ✓ ${name}: ${preise.length} Größenkombinationen`);
}

console.log(`\n→ ${produktMap.size} Produkte, ${totalPreise} Preiszeilen importiert\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ZUBEHÖR (Sheet "Zubehör_Referenz")
//    Spalten: Kategorie | Artikel | Preis | Einheit
// ═══════════════════════════════════════════════════════════════════════════════
console.log("=== 2. Zubehör & Profile ===");

const zubehoerRows = XLSX.utils.sheet_to_json(wb.Sheets["Zubehör_Referenz"], { header: 1, defval: "" });
const zubehoerData = zubehoerRows.slice(2).filter(r => r[1] && r[2] !== "");

const katSort = new Map();
let totalZubehoer = 0;

for (const row of zubehoerData) {
  const kat    = String(row[0]).trim() || "Sonstige";
  const name   = String(row[1]).trim();
  const preis  = typeof row[2] === "number" ? row[2] : parseFloat(String(row[2]).replace(",", ".")) || 0;
  const einheit = String(row[3] || "").trim();
  const unit   = normalizeUnit(einheit);

  if (!katSort.has(kat)) katSort.set(kat, 0);
  const sort = katSort.get(kat);
  katSort.set(kat, sort + 1);

  await insertAccessory(kat, name, preis, unit, sort);
  totalZubehoer++;
}

console.log(`→ ${totalZubehoer} Zubehörartikel in ${katSort.size} Kategorien importiert\n`);

// ── Zusammenfassung ───────────────────────────────────────────────────────────
const cProd   = await client.query(`SELECT COUNT(*) FROM configurator_products`);
const cPreis  = await client.query(`SELECT COUNT(*) FROM configurator_prices`);
const cZub    = await client.query(`SELECT COUNT(*) FROM configurator_accessories`);

console.log(`✅ Import abgeschlossen:`);
console.log(`   ${cProd.rows[0].count} Konfigurator-Produkte`);
console.log(`   ${cPreis.rows[0].count} Preiszeilen`);
console.log(`   ${cZub.rows[0].count} Zubehörartikel`);

await client.end();
