// server/routes/units.ts
import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  unitsCatalogTable,
  unitsCatalogTableSQLite,
  insertUnitSchema,
} from "../../shared/schema.js";

const router = Router();
router.use(requireAuth);

const tbl = () => (USE_POSTGRES ? unitsCatalogTable : unitsCatalogTableSQLite);

// GET /api/units
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await db.select().from(tbl()).orderBy(asc(tbl().sortOrder), asc(tbl().name));
    res.json(rows);
  } catch (err) {
    console.error("[units/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/units
router.post("/", async (req, res) => {
  const parsed = insertUnitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const { db } = getDb();
    // Use max sort_order + 1
    const all = await db.select().from(tbl());
    const maxOrder = all.reduce((m: number, r: any) => Math.max(m, r.sortOrder ?? 0), 0);
    const inserted = await db
      .insert(tbl())
      .values({ name: parsed.data.name.trim(), sortOrder: maxOrder + 1 })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE") || err?.code === "23505") {
      res.status(409).json({ error: "Einheit existiert bereits" });
      return;
    }
    console.error("[units/create]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/units/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await db.delete(tbl()).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[units/delete]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
