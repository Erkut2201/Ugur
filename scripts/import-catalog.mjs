// scripts/import-catalog.mjs
// Importiert alle Daten aus APT_KubiQ_Preiskalkulator.xlsx in die DB.
// Führt TRUNCATE + INSERT durch → idempotent (mehrfach ausführbar).
// Run: node scripts/import-catalog.mjs

import { existsSync } from "fs";
import { config } from "dotenv";
import pg from "pg";
import XLSX from "xlsx";

// ── Env laden ────────────────────────────────────────────────────────────────
if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) { console.error("Kein POSTGRES_URL gefunden"); process.exit(1); }

const ssl = connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });
await client.connect();
console.log("✓ DB verbunden\n");

// ── Helper ────────────────────────────────────────────────────────────────────
const productInfoTexts = {
  "Terrassenüberdachung Glas": `CE-zertifiziertes Aluminium-System mit hoher Stabilität und geprüften statischen Werten. Eindeckung mit VSG-Sicherheitsglas (klar, matt oder getönt), Dachneigung ca. 8 %. Oberfläche mit hochwertiger, im Ofen eingebrannter Pulverbeschichtung, erhältlich in 5 Farben. Auf die Lackierung wird eine Garantie von 10 Jahren gewährt.`,
  "Terrassenüberdachung Steg": `CE-zertifiziertes Aluminium-System mit hoher Stabilität und geprüften statischen Werten. Eindeckung mit mehrschichtigen, bruchsicheren Stegplatten (Polycarbonat) mit wirksamem UV-Schutz, Dachneigung ca. 8 %. Oberfläche mit hochwertiger, im Ofen eingebrannter Pulverbeschichtung, erhältlich in 5 Farben. Auf die Lackierung wird eine Garantie von 10 Jahren gewährt.`,
  "Carport Glas": `Freitragendes Aluminium-System ohne Zwischenstützen, statisch geprüft für Schnee- und Windlast. Eindeckung mit VSG-Sicherheitsglas für zuverlässigen Witterungsschutz bei maximaler Lichtdurchlässigkeit. Pulverbeschichtete Oberfläche, erhältlich in 5 Farben, 10 Jahre Garantie auf die Lackierung.`,
  "Carport Steg": `Freitragendes Aluminium-System ohne Zwischenstützen, statisch geprüft für Schnee- und Windlast. Eindeckung mit bruchsicheren, UV-stabilisierten Stegplatten (Polycarbonat). Pulverbeschichtete Oberfläche, erhältlich in 5 Farben, 10 Jahre Garantie auf die Lackierung.`,
  "Vordach Glas": `Kompaktes Aluminium-Vordach zur Montage über Haus- oder Eingangstüren. Eindeckung mit VSG-Sicherheitsglas, klar oder getönt. Pulverbeschichtete Oberfläche, erhältlich in 5 Farben, 10 Jahre Garantie auf die Lackierung.`,
  "Vordach Steg": `Kompaktes Aluminium-Vordach zur Montage über Haus- oder Eingangstüren. Eindeckung mit bruchsicheren, UV-beständigen Stegplatten (Polycarbonat). Pulverbeschichtete Oberfläche, erhältlich in 5 Farben, 10 Jahre Garantie auf die Lackierung.`,
  "KubiQ SLZ1 (65 kg/m²)": `CE-zertifiziertes Aluminium-System mit hoher Stabilität und geprüften statischen Werten. Modernes, von außen flach wirkendes Design mit quadratischer Dachrinne und integrierter Dachneigung von ca. 5 %. Erhältlich in drei Belastungsklassen: SLZ1 (65 kg/m²), SLZ2 (85 kg/m²), SLZ3 (110 kg/m²). Pulverbeschichtete Oberfläche, erhältlich in 5 Farben. Auf die Lackierung wird eine Garantie von 10 Jahren gewährt.`,
  "KubiQ SLZ2 (85 kg/m²)": `CE-zertifiziertes Aluminium-System mit hoher Stabilität und geprüften statischen Werten. Modernes, von außen flach wirkendes Design mit quadratischer Dachrinne und integrierter Dachneigung von ca. 5 %. Erhältlich in drei Belastungsklassen: SLZ1 (65 kg/m²), SLZ2 (85 kg/m²), SLZ3 (110 kg/m²). Pulverbeschichtete Oberfläche, erhältlich in 5 Farben. Auf die Lackierung wird eine Garantie von 10 Jahren gewährt.`,
  "KubiQ SLZ3 (110 kg/m²)": `CE-zertifiziertes Aluminium-System mit hoher Stabilität und geprüften statischen Werten. Modernes, von außen flach wirkendes Design mit quadratischer Dachrinne und integrierter Dachneigung von ca. 5 %. Erhältlich in drei Belastungsklassen: SLZ1 (65 kg/m²), SLZ2 (85 kg/m²), SLZ3 (110 kg/m²). Pulverbeschichtete Oberfläche, erhältlich in 5 Farben. Auf die Lackierung wird eine Garantie von 10 Jahren gewährt.`,
  "Unterglasmarkise": `Markise zur Montage unter der Glaseindeckung von Terrassenüberdachungen und Wintergärten. Motorisiert mit Somfy-Motor und Funkfernbedienung. Hochwertiges Tuch, erhältlich in mehreren Farben und Tuchkollektionen. Gestell pulverbeschichtet in RAL-Farbe nach Wahl.`,
  "Vollkassettenmarkise": `Gelenkarmmarkise mit vollständig geschlossenem Aluminiumgehäuse im eingefahrenen Zustand. Tuch, Armgelenke und Ausfallprofil sind dadurch komplett vor Witterung und UV-Einfluss geschützt. Motorisiert mit Somfy-Motor und Funkfernbedienung. Pulverbeschichtetes Gehäuse und Tuch in zahlreichen Farben erhältlich.`,
  "Halbkassettenmarkise": `Gelenkarmmarkise mit teilweiser Aluminium-Abdeckung von Tuch und Mechanik im eingefahrenen Zustand. Motorisiert mit Somfy-Motor und Funkfernbedienung. Pulverbeschichtetes Gehäuse und Tuch in zahlreichen Farben erhältlich.`,
  "Senkrechtmarkise": `Moderne motorisierte Senkrechtmarkise mit Somfy-Motor und ZIP-Technologie. Bedienung per Funkfernbedienung. Erhältlich in 4 pulverbeschichteten Aluminiumfarben und verschiedenen Screen-Geweben für optimalen Sonnen- und Sichtschutz.`,
  "Guillotine-Glassysteme": `Vertikal öffnendes Glasfenster-System, das im geöffneten Zustand vollständig im Deckenbereich verschwindet. Elektrische Bedienung per Motor und Funkfernbedienung. Verglasung in Einscheiben- oder Verbundsicherheitsglas, Rahmen pulverbeschichtet.`,
  "Abschlusskeil": `Abschlusskeil zur seitlichen Anpassung von Glasschiebewänden, Paneelenwänden und Festglaswänden. Aluminiumrahmen mit Pulverbeschichtung, Ausführung mit Polycarbonat oder Glas. Individuell auf Höhe und Tiefe der Konstruktion abgestimmt.`,
  "LED-Einbaustreifen": `LED-Lichtstreifen zur Integration in die oberen Trägerprofile der Konstruktion. Steuerbar per Fernbedienung, mit Dimmfunktion. Sondermontage durch geschultes Fachpersonal.`,
};

async function insertCategory(name, description, parentId, sortOrder) {
  const res = await client.query(
    `INSERT INTO product_categories (name, description, product_info_text, parent_id, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, description || null, productInfoTexts[name] || null, parentId || null, sortOrder ?? 0]
  );
  return res.rows[0].id;
}

async function insertItem(categoryId, articleNumber, name, description, unit, unitPrice, notes, sortOrder) {
  await client.query(
    `INSERT INTO catalog_items
       (category_id, article_number, name, description, unit, unit_price, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [categoryId, articleNumber || null, name, description || null,
     unit || "Stk", unitPrice ?? 0, notes || null, sortOrder ?? 0]
  );
}

// Einheit normalisieren
function normalizeUnit(raw) {
  if (!raw) return "Stk";
  const r = String(raw).toLowerCase();
  if (r.includes("meter")) return "m";
  if (r.includes("stück") || r.includes("stuck") || r.includes("piece")) return "Stk";
  if (r.includes("m²") || r.includes("m2")) return "m²";
  if (r.includes("lfm")) return "lfm";
  if (r.includes("pausch")) return "Pauschal";
  if (r.includes("stk")) return "Stk";
  return "Stk";
}

// ── DB leeren (nur unsere Tabellen) ─────────────────────────────────────────
console.log("Leere bestehende Katalogdaten…");
await client.query("TRUNCATE catalog_items, product_categories RESTART IDENTITY CASCADE");
console.log("✓ Tabellen geleert\n");

// ── Excel laden ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile("./client/example/APT_KubiQ_Preiskalkulator.xlsx");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HAUPTKATEGORIE: Produkte (aus Preisdaten-Sheet)
//    Jedes Produkt = Unterkategorie; Breite×Tiefe-Kombination = Artikel
// ═══════════════════════════════════════════════════════════════════════════════
console.log("=== 1. Produkte (Preisdaten) ===");
const hauptProdukteId = await insertCategory("Produkte", "Terrassenüberdachungen, Carports, Vordächer, Schiebeanlagen, Markisen", null, 0);

const preisRows = XLSX.utils.sheet_to_json(wb.Sheets["Preisdaten"], { header: 1, defval: "" });
// Header: [Produkt, Breite, Tiefe_Hoehe, Preis_netto, Sonderfarbe_Hinweis, Quelle]
const dataRows = preisRows.slice(1).filter(r => r[0] && r[3]);

// Produkte gruppieren
const produktMap = new Map(); // produktName → [{breite, tiefe, preis, hinweis}]
for (const row of dataRows) {
  const name  = String(row[0]).trim();
  const breite = row[1];
  const tiefe  = row[2];
  const preis  = Number(row[3]);
  const hint   = String(row[4] || "").trim();
  if (!produktMap.has(name)) produktMap.set(name, []);
  produktMap.get(name).push({ breite, tiefe, preis, hint });
}

// Produkt-Oberkategorien nach Typ gruppieren
const produktTypen = {
  "Terrassenüberdachungen": ["Terrassenüberdachung Glas", "Terrassenüberdachung Steg"],
  "Carports": ["Carport Glas", "Carport Steg"],
  "Vordächer": ["Vordach Glas", "Vordach Steg"],
  "KubiQ Systeme": ["KubiQ SLZ1 (65 kg/m²)", "KubiQ SLZ2 (85 kg/m²)", "KubiQ SLZ3 (110 kg/m²)"],
  "Glasschiebeanlagen (GGS)": [...produktMap.keys()].filter(p => p.startsWith("GGS")),
  "SlideCold": [...produktMap.keys()].filter(p => p.startsWith("SlideCold")),
  "Markisen": ["Unterglasmarkise", "Senkrechtmarkise"],
};

for (const productName of [...produktMap.keys()].filter((p) => p.startsWith("GGS"))) {
  productInfoTexts[productName] = `Rahmenloses Glas-Schiebesystem
zur Verglasung von Terrassenüberdachungen.

Läuft leichtgängig in 3- oder
5-gleisigen Aluminium-Laufschienen, Elemente seitlich stapelbar.

Erhältlich mit 2 bis 10
Scheibenelementen, individuell in Breite und Höhe konfigurierbar.

Verglasung in Einscheiben- oder
Verbundsicherheitsglas.`;
}

for (const productName of [...produktMap.keys()].filter((p) => p.startsWith("SlideCold"))) {
  productInfoTexts[productName] = `Gerahmtes
Aluminium-Schiebesystem zur Verglasung von Terrassenüberdachungen und
Wintergärten.

Läuft in 2- oder 3-gleisigen
Schienensystemen, erhältlich mit 2 bis 6 Flügeln.

Höhere Dichtigkeit gegenüber
Wind und Schlagregen als rahmenlose Systeme.

Pulverbeschichteter
Aluminiumrahmen, erhältlich in 5 Farben.`;
}

let typSort = 0;
for (const [typName, produkte] of Object.entries(produktTypen)) {
  const typId = await insertCategory(typName, null, hauptProdukteId, typSort++);

  let prodSort = 0;
  for (const prodName of produkte) {
    const items = produktMap.get(prodName);
    if (!items || items.length === 0) continue;

    const prodCatId = await insertCategory(prodName, null, typId, prodSort++);
    let itemSort = 0;
    for (const { breite, tiefe, preis, hint } of items) {
      const itemName = `Breite ${breite}m × Tiefe/Höhe ${tiefe}m`;
      const desc = hint || null;
      await insertItem(prodCatId, null, itemName, desc, "Pauschal", preis, null, itemSort++);
    }
    console.log(`  ✓ ${prodName}: ${items.length} Varianten`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HAUPTKATEGORIE: Zubehör & Profile (aus Zubehör_Referenz-Sheet)
//    Kategorie-Spalte = Unterkategorie; Artikel+Preis+Einheit = Artikel
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== 2. Zubehör & Profile ===");
const hauptZubehoerId = await insertCategory("Zubehör & Profile", "Aluminiumprofile, Glas, Beleuchtung, Zubehör", null, 1);

const zubehoerRows = XLSX.utils.sheet_to_json(wb.Sheets["Zubehör_Referenz"], { header: 1, defval: "" });
// Header row 1: [Kategorie, Artikel, Preis, Einheit]
const zubehoerData = zubehoerRows.slice(2).filter(r => r[1] && r[2] !== "");

// Nach Kategorie gruppieren, Reihenfolge beibehalten
const zubehoerKatMap = new Map();
for (const row of zubehoerData) {
  const kat  = String(row[0]).trim() || "_Sonstige";
  const art  = String(row[1]).trim();
  const preis = typeof row[2] === "number" ? row[2] : parseFloat(String(row[2]).replace(",", ".")) || 0;
  const einheit = String(row[3] || "").trim();
  if (!zubehoerKatMap.has(kat)) zubehoerKatMap.set(kat, []);
  zubehoerKatMap.get(kat).push({ art, preis, einheit });
}

let zSort = 0;
for (const [katName, artikel] of zubehoerKatMap) {
  const katId = await insertCategory(katName, null, hauptZubehoerId, zSort++);
  let aSort = 0;
  for (const { art, preis, einheit } of artikel) {
    const unit = normalizeUnit(einheit);
    await insertItem(katId, null, art, null, unit, preis, einheit !== "pro Stück" && einheit !== "pro Meter" ? einheit : null, aSort++);
  }
  console.log(`  ✓ ${katName}: ${artikel.length} Artikel`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HAUPTKATEGORIE: Festelemente (aus Festelemente_Referenz-Sheet)
//    Jede Matrix-Tabelle = Unterkategorie; Breite×Höhe-Preis = Artikel
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== 3. Festelemente ===");
const hauptFestId = await insertCategory("Festelemente", "Glas-Fixverglasungen, Fenster, Türen", null, 2);

const festRows = XLSX.utils.sheet_to_json(wb.Sheets["Festelemente_Referenz"], { header: 1, defval: "" });

// Parsen: Blöcke werden durch Titelzeilen (erste Zelle = langer Text, Rest leer) getrennt
let currentBlock = null;
let currentHeader = null; // Breiten-Header
let festSort = 0;
const blocks = [];

for (const row of festRows) {
  const first = String(row[0] || "").trim();
  const isTitle = first.length > 20 && row.slice(1).every(c => c === "" || c === 0);
  const isHeader = first.startsWith("Höhe") || first.startsWith("Breite");
  const isDataRow = first.match(/^\d/) && typeof row[1] === "number";
  const isAufpreis = first.startsWith("Aufpreis") || first.startsWith("Ab Höhe");

  if (isTitle) {
    if (currentBlock) blocks.push(currentBlock);
    currentBlock = { name: first, headers: [], items: [], aufpreis: null };
    currentHeader = null;
  } else if (isHeader && currentBlock) {
    currentHeader = row.slice(1).filter(h => h !== "");
    currentBlock.headers = currentHeader;
  } else if (isDataRow && currentBlock && currentHeader) {
    const height = first;
    currentHeader.forEach((breite, idx) => {
      const preis = row[idx + 1];
      if (typeof preis === "number" && preis > 0) {
        currentBlock.items.push({
          name: `Breite ${breite} × Höhe ${height}`,
          preis,
        });
      }
    });
  } else if (isAufpreis && currentBlock) {
    currentBlock.aufpreis = first;
  }
}
if (currentBlock) blocks.push(currentBlock);

for (const block of blocks) {
  if (!block.items.length) continue;
  const notes = block.aufpreis || null;
  const catId = await insertCategory(block.name, notes, hauptFestId, festSort++);
  let iSort = 0;
  for (const { name, preis } of block.items) {
    await insertItem(catId, null, name, null, "Stk", preis, null, iSort++);
  }
  console.log(`  ✓ ${block.name}: ${block.items.length} Varianten`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HAUPTKATEGORIE: Allgemeine Hinweise (aus Hinweise-Sheet)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== 4. Allgemeine Hinweise ===");
const hinweiseRows = XLSX.utils.sheet_to_json(wb.Sheets["Hinweise"], { header: 1, defval: "" });
const hinweiseData = hinweiseRows.filter(r => r[0] && r[1] && r[0] !== "Allgemeine Hinweise & Lieferkonditionen");
if (hinweiseData.length) {
  const hinwCatId = await insertCategory("Konditionen & Hinweise", "Lieferbedingungen, Zahlungsziele, allgemeine Hinweise", null, 3);
  let hSort = 0;
  for (const row of hinweiseData) {
    const key = String(row[0]).trim();
    const val = String(row[1]).trim();
    if (key && val) {
      await insertItem(hinwCatId, null, key, val, "Pauschal", 0, null, hSort++);
    }
  }
  console.log(`  ✓ ${hinweiseData.length} Hinweise importiert`);
}

// ── Fertig ────────────────────────────────────────────────────────────────────
const countCat = await client.query("SELECT COUNT(*) FROM product_categories");
const countItem = await client.query("SELECT COUNT(*) FROM catalog_items");
console.log(`\n✅ Import abgeschlossen:`);
console.log(`   ${countCat.rows[0].count} Kategorien`);
console.log(`   ${countItem.rows[0].count} Artikel`);

await client.end();
