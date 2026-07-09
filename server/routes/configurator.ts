// server/routes/configurator.ts
// API für den Angebots-Konfigurator:
//   - Produkte mit verfügbaren Breiten/Tiefen
//   - Preisberechnung (nächsthöhere Stufe)
//   - Zubehör-Kategorien und Artikel

import { Router } from "express";
import { eq, asc, and } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  configuratorProductsTable,
  configuratorProductsTableSQLite,
  configuratorPricesTable,
  configuratorPricesTableSQLite,
  configuratorAccessoriesTable,
  configuratorAccessoriesTableSQLite,
  productCategoriesTable,
  productCategoriesTableSQLite,
  catalogItemsTable,
  catalogItemsTableSQLite,
} from "../../shared/schema.js";

const catTbl = () => USE_POSTGRES ? productCategoriesTable : productCategoriesTableSQLite;
const itemTbl = () => USE_POSTGRES ? catalogItemsTable : catalogItemsTableSQLite;

const router = Router();
router.use(requireAuth);

const prodTbl = () => USE_POSTGRES ? configuratorProductsTable : configuratorProductsTableSQLite;
const priceTbl = () => USE_POSTGRES ? configuratorPricesTable : configuratorPricesTableSQLite;
const accTbl = () => USE_POSTGRES ? configuratorAccessoriesTable : configuratorAccessoriesTableSQLite;

function getBilledQuantity(quantity: number, unit: string) {
  const normalizedUnit = unit.trim().toLowerCase();
  return normalizedUnit === "m" ? Math.ceil(quantity) : quantity;
}

// ── GET /api/configurator/products?manufacturerId=X ─────────────────────────
// Alle Produkte eines Herstellers mit ihren verfügbaren Breiten und Tiefen
router.get("/products", async (req, res) => {
  try {
    const { db } = getDb();
    const manufacturerId = req.query.manufacturerId ? Number(req.query.manufacturerId) : null;

    const products = manufacturerId
      ? await (db as any).select().from(prodTbl())
          .where(eq((prodTbl() as any).manufacturerId, manufacturerId))
          .orderBy(asc((prodTbl() as any).sortOrder), asc((prodTbl() as any).name))
      : await (db as any).select().from(prodTbl())
          .orderBy(asc((prodTbl() as any).sortOrder), asc((prodTbl() as any).name));

    // Für jedes Produkt die verfügbaren Breiten, Tiefen und Glasvarianten laden
    const result = await Promise.all(products.map(async (p: any) => {
      const prices = await (db as any)
        .select()
        .from(priceTbl())
        .where(eq((priceTbl() as any).productId, p.id));

      const widths  = [...new Set(prices.map((r: any) => Number(r.width)))].sort((a, b) => a - b);
      const depths  = [...new Set(prices.map((r: any) => Number(r.depth)))].sort((a, b) => a - b);

      const segments = String(p.name ?? "").split("/").map((segment: string) => segment.trim()).filter(Boolean);
      const categoryName = segments.length >= 2 ? segments[segments.length - 2] : String(p.name ?? "").trim();
      const categoryRows = await (db as any)
        .select()
        .from(catTbl())
        .where(and(
          eq((catTbl() as any).manufacturerId, p.manufacturerId),
          eq((catTbl() as any).name, categoryName)
        ))
        .limit(1);
      const productCategory = categoryRows[0] ?? null;

      // Glasvarianten aus catalog_items der verknüpften Kategorie laden
      let glassVariants: any[] = [];
      if (p.glassVariantCategoryId) {
        glassVariants = await (db as any)
          .select()
          .from(itemTbl())
          .where(eq((itemTbl() as any).categoryId, p.glassVariantCategoryId))
          .orderBy(asc((itemTbl() as any).sortOrder), asc((itemTbl() as any).name));
      }

      return {
        ...p,
        productCategoryId: productCategory?.id ?? null,
        productInfoTitle: productCategory?.name ?? categoryName,
        productInfoText: productCategory?.productInfoText ?? null,
        availableWidths: widths,
        availableDepths: depths,
        glassVariants,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error("[configurator] GET /products", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── POST /api/configurator/calculate ────────────────────────────────────────
// Berechnet den Preis für eine Breite×Tiefe-Kombination (nächsthöhere Stufe)
// Body: { productId, width, depth, accessories: [{id, quantity}] }
router.post("/calculate", async (req, res) => {
  try {
    const { productId, width, depth, accessories = [] } = req.body;

    if (!productId || width == null || depth == null) {
      return res.status(400).json({ error: "productId, width und depth sind erforderlich" });
    }

    const { db } = getDb();

    // Alle Preiszeilen für dieses Produkt laden
    const prices = await (db as any)
      .select()
      .from(priceTbl())
      .where(eq((priceTbl() as any).productId, Number(productId)));

    if (!prices.length) {
      return res.status(404).json({ error: "Keine Preisdaten für dieses Produkt" });
    }

    // Nächsthöhere Breite und Tiefe finden
    const inputWidth = Number(width);
    const inputDepth = Number(depth);

    const widths = [...new Set(prices.map((r: any) => Number(r.width)))].sort((a, b) => a - b);
    const depths = [...new Set(prices.map((r: any) => Number(r.depth)))].sort((a, b) => a - b);

    const chosenWidth = widths.find(w => w >= inputWidth) ?? widths[widths.length - 1];
    const chosenDepth = depths.find(d => d >= inputDepth) ?? depths[depths.length - 1];

    // Preis für exakte Kombination suchen
    const match = prices.find(
      (r: any) => Number(r.width) === chosenWidth && Number(r.depth) === chosenDepth
    );

    if (!match) {
      return res.status(404).json({
        error: `Keine Preiskombination für ${chosenWidth}m × ${chosenDepth}m gefunden`
      });
    }

    const basePrice = Number(match.priceNet);

    // Zubehör-Preise berechnen
    let accessoryTotal = 0;
    const accessoryLines: any[] = [];

    if (accessories.length > 0) {
      const accIds = accessories.map((a: any) => Number(a.id));
      const accData = await (db as any)
        .select()
        .from(accTbl())
        .where(eq((accTbl() as any).id, accIds[0])); // Einzelabfragen wegen SQLite

      // Alle Zubehörartikel laden
      for (const { id, quantity } of accessories) {
        const rows = await (db as any)
          .select()
          .from(accTbl())
          .where(eq((accTbl() as any).id, Number(id)))
          .limit(1);
        if (rows[0]) {
          const exactQuantity = Number(quantity);
          const billedQuantity = getBilledQuantity(exactQuantity, String(rows[0].unit ?? ""));
          const lineTotal = Number(rows[0].priceNet) * billedQuantity;
          accessoryTotal += lineTotal;
          accessoryLines.push({
            id: rows[0].id,
            name: rows[0].name,
            category: rows[0].category,
            unit: rows[0].unit,
            priceNet: Number(rows[0].priceNet),
            quantity: exactQuantity,
            total: lineTotal,
          });
        }
      }
    }

    const totalNet = basePrice + accessoryTotal;

    res.json({
      productId: Number(productId),
      inputWidth,
      inputDepth,
      chosenWidth,
      chosenDepth,
      basePrice,
      accessoryLines,
      accessoryTotal,
      totalNet,
    });
  } catch (err) {
    console.error("[configurator] POST /calculate", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── PUT /api/configurator/products/:id ─────────────────────────────────────
// Produkt aktualisieren (z.B. glassVariantCategoryId setzen)
router.put("/products/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const id = Number(req.params.id);
    const { glassVariantCategoryId } = req.body;
    const [row] = await (db as any)
      .update(prodTbl())
      .set({ glassVariantCategoryId: glassVariantCategoryId ?? null })
      .where(eq((prodTbl() as any).id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[configurator] PUT /products/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── GET /api/configurator/accessories?manufacturerId=X ──────────────────────
// Alle Zubehör-Kategorien mit Artikeln
router.get("/accessories", async (req, res) => {
  try {
    const { db } = getDb();
    const manufacturerId = req.query.manufacturerId ? Number(req.query.manufacturerId) : null;

    const rows = manufacturerId
      ? await (db as any).select().from(accTbl())
          .where(eq((accTbl() as any).manufacturerId, manufacturerId))
          .orderBy(asc((accTbl() as any).category), asc((accTbl() as any).sortOrder))
      : await (db as any).select().from(accTbl())
          .orderBy(asc((accTbl() as any).category), asc((accTbl() as any).sortOrder));

    // Nach Kategorie gruppieren
    const grouped: Record<string, any[]> = {};
    for (const row of rows) {
      const cat = row.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }

    res.json(grouped);
  } catch (err) {
    console.error("[configurator] GET /accessories", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
