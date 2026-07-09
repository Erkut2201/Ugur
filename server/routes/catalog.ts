// server/routes/catalog.ts
// CRUD for manufacturers, product_categories and catalog_items

import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  manufacturersTable,
  manufacturersTableSQLite,
  productCategoriesTable,
  productCategoriesTableSQLite,
  catalogItemsTable,
  catalogItemsTableSQLite,
  manufacturerColorsTable,
  manufacturerColorsTableSQLite,
  insertManufacturerSchema,
  insertProductCategorySchema,
  insertCatalogItemSchema,
  insertManufacturerColorSchema,
} from "../../shared/schema.js";

const router = Router();
router.use(requireAuth);

const mfrTbl = () => (USE_POSTGRES ? manufacturersTable : manufacturersTableSQLite);
const catTbl = () => (USE_POSTGRES ? productCategoriesTable : productCategoriesTableSQLite);
const itemTbl = () => (USE_POSTGRES ? catalogItemsTable : catalogItemsTableSQLite);
const colorTbl = () => (USE_POSTGRES ? manufacturerColorsTable : manufacturerColorsTableSQLite);

// ── Manufacturers ─────────────────────────────────────────────────────────────

// GET /api/catalog/manufacturers
router.get("/manufacturers", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(mfrTbl())
      .orderBy(asc((mfrTbl() as any).sortOrder), asc((mfrTbl() as any).name));
    res.json(rows);
  } catch (err) {
    console.error("[catalog] GET /manufacturers", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/catalog/manufacturers/:id
router.get("/manufacturers/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(mfrTbl())
      .where(eq((mfrTbl() as any).id, Number(req.params.id)))
      .limit(1);
    if (!rows.length) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[catalog] GET /manufacturers/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/catalog/manufacturers
router.post("/manufacturers", async (req, res) => {
  try {
    const parsed = insertManufacturerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any).insert(mfrTbl()).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("[catalog] POST /manufacturers", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/catalog/manufacturers/:id
router.put("/manufacturers/:id", async (req, res) => {
  try {
    const parsed = insertManufacturerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any)
      .update(mfrTbl())
      .set({ ...parsed.data, updatedAt: USE_POSTGRES ? new Date() : new Date().toISOString() })
      .where(eq((mfrTbl() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[catalog] PUT /manufacturers/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/catalog/manufacturers/:id
router.delete("/manufacturers/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any)
      .delete(mfrTbl())
      .where(eq((mfrTbl() as any).id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    console.error("[catalog] DELETE /manufacturers/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── Categories ───────────────────────────────────────────────────────────────

// GET /api/catalog/categories?manufacturerId=X
router.get("/categories", async (req, res) => {
  try {
    const { db } = getDb();
    const manufacturerId = req.query.manufacturerId ? Number(req.query.manufacturerId) : null;
    const query = (db as any)
      .select()
      .from(catTbl())
      .orderBy(asc((catTbl() as any).sortOrder), asc((catTbl() as any).name));
    const rows = manufacturerId
      ? await query.where(eq((catTbl() as any).manufacturerId, manufacturerId))
      : await query;
    res.json(rows);
  } catch (err) {
    console.error("[catalog] GET /categories", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/catalog/categories/:id
router.get("/categories/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(catTbl())
      .where(eq((catTbl() as any).id, Number(req.params.id)))
      .limit(1);
    if (!rows.length) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[catalog] GET /categories/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/catalog/categories
router.post("/categories", async (req, res) => {
  try {
    const parsed = insertProductCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any).insert(catTbl()).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("[catalog] POST /categories", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/catalog/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const parsed = insertProductCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any)
      .update(catTbl())
      .set({ ...parsed.data, updatedAt: USE_POSTGRES ? new Date() : new Date().toISOString() })
      .where(eq((catTbl() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[catalog] PUT /categories/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/catalog/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any)
      .delete(catTbl())
      .where(eq((catTbl() as any).id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    console.error("[catalog] DELETE /categories/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── Items ────────────────────────────────────────────────────────────────────

// GET /api/catalog/items?categoryId=X
router.get("/items", async (req, res) => {
  try {
    const { db } = getDb();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const query = (db as any)
      .select()
      .from(itemTbl())
      .orderBy(asc((itemTbl() as any).sortOrder), asc((itemTbl() as any).name));
    const rows = categoryId
      ? await query.where(eq((itemTbl() as any).categoryId, categoryId))
      : await query;
    res.json(rows);
  } catch (err) {
    console.error("[catalog] GET /items", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/catalog/items/:id
router.get("/items/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(itemTbl())
      .where(eq((itemTbl() as any).id, Number(req.params.id)))
      .limit(1);
    if (!rows.length) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[catalog] GET /items/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/catalog/items
router.post("/items", async (req, res) => {
  try {
    const parsed = insertCatalogItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any).insert(itemTbl()).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("[catalog] POST /items", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/catalog/items/:id
router.put("/items/:id", async (req, res) => {
  try {
    const parsed = insertCatalogItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any)
      .update(itemTbl())
      .set({ ...parsed.data, updatedAt: USE_POSTGRES ? new Date() : new Date().toISOString() })
      .where(eq((itemTbl() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[catalog] PUT /items/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PATCH /api/catalog/items/:id — partial update (z.B. nur unitPrice)
router.patch("/items/:id", async (req, res) => {
  try {
    const allowed = ["unitPrice", "name", "description", "productDescription", "unit", "articleNumber", "notes", "sortOrder"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) patch[key] = req.body[key];
    }
    if (!Object.keys(patch).length) return res.status(400).json({ error: "Keine Felder zum Aktualisieren" });
    // Map camelCase to snake_case column names for drizzle
    const colMap: Record<string, string> = {
      unitPrice: "unit_price",
      articleNumber: "article_number",
    };
    const dbPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      dbPatch[colMap[k] ?? k] = v;
    }
    dbPatch.updated_at = USE_POSTGRES ? new Date() : new Date().toISOString();

    const { db } = getDb();
    const [row] = await (db as any)
      .update(itemTbl())
      .set(patch)
      .where(eq((itemTbl() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[catalog] PATCH /items/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/catalog/items/:id
router.delete("/items/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any)
      .delete(itemTbl())
      .where(eq((itemTbl() as any).id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    console.error("[catalog] DELETE /items/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// ── Manufacturer Colors ───────────────────────────────────────────────────────

// GET /api/catalog/colors?manufacturerId=X
router.get("/colors", async (req, res) => {
  try {
    const { db } = getDb();
    const manufacturerId = req.query.manufacturerId ? Number(req.query.manufacturerId) : null;
    const q = (db as any).select().from(colorTbl())
      .orderBy(asc((colorTbl() as any).sortOrder), asc((colorTbl() as any).name));
    const rows = manufacturerId
      ? await q.where(eq((colorTbl() as any).manufacturerId, manufacturerId))
      : await q;
    res.json(rows);
  } catch (err) {
    console.error("[catalog] GET /colors", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/catalog/colors
router.post("/colors", async (req, res) => {
  try {
    const parsed = insertManufacturerColorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any).insert(colorTbl()).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("[catalog] POST /colors", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/catalog/colors/:id
router.put("/colors/:id", async (req, res) => {
  try {
    const parsed = insertManufacturerColorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { db } = getDb();
    const [row] = await (db as any)
      .update(colorTbl())
      .set(parsed.data)
      .where(eq((colorTbl() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[catalog] PUT /colors/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/catalog/colors/:id
router.delete("/colors/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any).delete(colorTbl()).where(eq((colorTbl() as any).id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    console.error("[catalog] DELETE /colors/:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
