import { existsSync } from "fs";
import { config } from "dotenv";
import pg from "pg";
import XLSX from "xlsx";

if (existsSync(".env.development")) config({ path: ".env.development", override: true });
else config({ override: true });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("❌ Kein POSTGRES_URL gefunden");
  process.exit(1);
}

const ssl = connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const normalized = clean(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnit(raw) {
  const value = clean(raw).toLowerCase();
  if (!value) return "Stk";
  if (value.includes("m²") || value.includes("m2")) return "m²";
  if (value.includes("meter") || value === "m") return "m";
  if (value.includes("scheibe")) return "Scheibe";
  if (value.includes("set")) return "Set";
  if (value.includes("100 st")) return "100 Stk";
  if (value.includes("stück") || value.includes("stuck") || value === "stk") return "Stk";
  return clean(raw);
}

function isSectionTitle(row, nextRow) {
  return Boolean(
    row[0] &&
    !row.slice(1).some(Boolean) &&
    nextRow[0] &&
    /(Tiefe|Höhe|Breite)/i.test(nextRow[0])
  );
}

function parseMatrixSections(sheetName, rows) {
  const sections = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index].map(clean);
    const nextRow = (rows[index + 1] || []).map(clean);

    if (!isSectionTitle(row, nextRow)) {
      index++;
      continue;
    }

    const sectionName = row[0];
    const headerLabel = nextRow[0];
    const columns = nextRow.slice(1).map(parseNumber);
    const items = [];
    const notes = [];
    index += 2;

    while (index < rows.length) {
      const current = rows[index].map(clean);
      const lookahead = (rows[index + 1] || []).map(clean);

      if (!current.some(Boolean)) {
        index++;
        continue;
      }

      if (isSectionTitle(current, lookahead)) break;

      const rowValue = parseNumber(current[0]);
      if (rowValue !== null) {
        for (let col = 1; col < current.length; col++) {
          const price = parseNumber(current[col]);
          const widthOrHeight = columns[col - 1];
          if (price === null || widthOrHeight === null) continue;
          items.push({
            name: `${headerLabel} ${widthOrHeight} × ${current[0]}`,
            description: null,
            unit: "Pauschal",
            unitPrice: price,
            notes: null,
          });
        }
      } else if (current[0] && !/PDF-Seiten/i.test(current[0])) {
        notes.push(current[0]);
      }

      index++;
    }

    if (items.length) {
      sections.push({
        sheetName,
        sectionName,
        description: notes.length ? notes.join(" | ") : null,
        items,
      });
    }
  }

  return sections;
}

function parseListSections(sheetName, rows) {
  const sections = [];
  let currentSection = null;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index].map(clean);
    if (!row.some(Boolean)) continue;

    const first = row[0];
    const second = row[1] || "";
    const next = (rows[index + 1] || []).map(clean);
    const startsDetailTable =
      next[0] &&
      (next[0] === "Bezeichnung" || next[0] === "Bauteil") &&
      (next[1] || "").includes("Preis");

    if (
      (first === "Bezeichnung" && second.includes("Preis")) ||
      (first === "Bauteil" && second.includes("Preis"))
    ) {
      if (!currentSection) {
        currentSection = { sheetName, sectionName: sheetName, description: null, items: [] };
        sections.push(currentSection);
      }
      continue;
    }

    if (first && !row.slice(1).some(Boolean) && startsDetailTable) {
      currentSection = { sheetName, sectionName: first, description: null, items: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { sheetName, sectionName: sheetName, description: null, items: [] };
      sections.push(currentSection);
    }

    const price = parseNumber(row[1]);
    if (first && price !== null) {
      currentSection.items.push({
        name: first,
        description: null,
        unit: normalizeUnit(row[2] || "Stk"),
        unitPrice: price,
        notes: null,
      });
    } else if (
      first &&
      !currentSection.description &&
      currentSection.items.length === 0 &&
      !/PDF-Seiten/i.test(first) &&
      !/ZUBEHÖR \/ EINZELTEILE \/ PREISE/i.test(first)
    ) {
      currentSection.description = first;
    }
  }

  return sections.filter((section) => section.items.length > 0);
}

function parseFenceSections(sheetName, rows) {
  const sections = [];
  let currentSection = null;

  for (const rawRow of rows) {
    const row = rawRow.map(clean);
    if (!row.some(Boolean)) continue;

    const first = row[0];
    const price = parseNumber(row[1]);

    if (first.startsWith("ZAUNELEMENT")) {
      currentSection = { sheetName, sectionName: first, description: null, items: [] };
      sections.push(currentSection);
      continue;
    }

    if (first === "Bauteil") continue;

    if (currentSection && first && price !== null) {
      currentSection.items.push({
        name: first,
        description: null,
        unit: "Stk",
        unitPrice: price,
        notes: null,
      });
    }
  }

  return sections.filter((section) => section.items.length > 0);
}

async function insertCategory(manufacturerId, name, description, parentId, sortOrder) {
  const result = await client.query(
    `INSERT INTO product_categories (manufacturer_id, name, description, parent_id, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [manufacturerId, name, description || null, parentId, sortOrder]
  );
  return result.rows[0].id;
}

async function insertItem(categoryId, item, sortOrder) {
  await client.query(
    `INSERT INTO catalog_items (category_id, article_number, name, description, unit, unit_price, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      categoryId,
      null,
      item.name,
      item.description || null,
      item.unit || "Stk",
      item.unitPrice ?? 0,
      item.notes || null,
      sortOrder,
    ]
  );
}

const workbook = XLSX.readFile("./client/example/MB_Aluminium_Preisliste_2026 (2).xlsx");
const sheetNames = workbook.SheetNames.filter((name) => name !== "Übersicht");
const matrixSheets = new Set([
  "MB SOLID",
  "MB BOLD",
  "MB CUBE",
  "MB CUBE GRAND",
  "MB CARPORT",
  "MB PRIME",
  "MB DYNAMIC",
  "MB ADVANCED",
  "MB ADAPTIVE",
  "MARKISEN & SCREENS",
  "ROLLLÄDEN",
  "GELÄNDER",
  "GUILLOTINE",
]);
const listSheets = new Set([
  "SCHIEBEWÄNDE",
  "SCHIEBETÜREN",
  "NICHT ISOLIERTE TÜREN",
  "SEITENWÄNDE & KEILE",
  "RAUMTEILER",
  "FASSADENVERKLEIDUNG",
  "ERSATZTEILE",
]);

await client.connect();
console.log("✓ DB verbunden");

const existing = await client.query(`SELECT id FROM manufacturers WHERE name = 'MB' LIMIT 1`);
if (existing.rows.length) {
  await client.query(`DELETE FROM manufacturers WHERE id = $1`, [existing.rows[0].id]);
  console.log("ℹ Vorhandenen MB-Hersteller gelöscht");
}

const manufacturer = await client.query(
  `INSERT INTO manufacturers (name, description, sort_order)
   VALUES ('MB', 'MB Aluminium Katalogimport aus Excel Preisliste 2026', 1)
   RETURNING id`
);
const manufacturerId = manufacturer.rows[0].id;
console.log(`✓ Hersteller MB angelegt (ID ${manufacturerId})`);

let rootSortOrder = 0;
const summary = [];

for (const sheetName of sheetNames) {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
  const rootId = await insertCategory(manufacturerId, sheetName, null, null, rootSortOrder++);

  let sections = [];
  if (sheetName === "ZÄUNE & TORE") {
    sections = parseFenceSections(sheetName, rows);
  } else if (matrixSheets.has(sheetName)) {
    sections = parseMatrixSections(sheetName, rows);
    if (sheetName === "MARKISEN & SCREENS" || sheetName === "GELÄNDER" || sheetName === "GUILLOTINE") {
      const additionalSections = parseListSections(sheetName, rows);
      const existingSectionNames = new Set(sections.map((section) => section.sectionName));
      for (const section of additionalSections) {
        if (!existingSectionNames.has(section.sectionName)) sections.push(section);
      }
    }
  } else if (listSheets.has(sheetName)) {
    sections = parseListSections(sheetName, rows);
  } else {
    sections = parseListSections(sheetName, rows);
  }

  let childSortOrder = 0;
  let itemCount = 0;

  for (const section of sections) {
    const needsChild = section.sectionName !== sheetName || sections.length > 1;
    const categoryId = needsChild
      ? await insertCategory(manufacturerId, section.sectionName, section.description, rootId, childSortOrder++)
      : rootId;

    let itemSortOrder = 0;
    for (const item of section.items) {
      await insertItem(categoryId, item, itemSortOrder++);
      itemCount++;
    }
  }

  summary.push({ sheetName, sectionCount: sections.length, itemCount });
}

const categoryCount = await client.query(
  `SELECT COUNT(*)::int AS count FROM product_categories WHERE manufacturer_id = $1`,
  [manufacturerId]
);
const itemCount = await client.query(
  `SELECT COUNT(*)::int AS count
   FROM catalog_items ci
   JOIN product_categories pc ON pc.id = ci.category_id
   WHERE pc.manufacturer_id = $1`,
  [manufacturerId]
);

console.log("\nMB Import-Zusammenfassung:");
for (const row of summary) {
  console.log(`- ${row.sheetName}: ${row.sectionCount} Ebenen, ${row.itemCount} Artikel`);
}
console.log(`\n✅ Kategorien: ${categoryCount.rows[0].count}`);
console.log(`✅ Artikel: ${itemCount.rows[0].count}`);

await client.end();