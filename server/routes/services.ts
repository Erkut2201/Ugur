// server/routes/services.ts
import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  servicesTable,
  servicesTableSQLite,
  insertServiceSchema,
} from "../../shared/schema.js";

const router = Router();
router.use(requireAuth);

const table = () => (USE_POSTGRES ? servicesTable : servicesTableSQLite);

// GET /api/services
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any).select().from(table()).orderBy((table() as any).name);
    res.json(rows);
  } catch (err) {
    console.error("[services] GET /", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/services/:id
router.get("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(table())
      .where(eq((table() as any).id, Number(req.params.id)))
      .limit(1);
    if (!rows.length) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[services] GET /:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/services
router.post("/", async (req, res) => {
  try {
    const parsed = insertServiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { db } = getDb();
    const [row] = await (db as any).insert(table()).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("[services] POST /", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/services/:id
router.put("/:id", async (req, res) => {
  try {
    const parsed = insertServiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { db } = getDb();
    const [row] = await (db as any)
      .update(table())
      .set({ ...parsed.data, updatedAt: USE_POSTGRES ? new Date() : new Date().toISOString() })
      .where(eq((table() as any).id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(row);
  } catch (err) {
    console.error("[services] PUT /:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/services/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any)
      .delete(table())
      .where(eq((table() as any).id, Number(req.params.id)));
    res.status(204).end();
  } catch (err) {
    console.error("[services] DELETE /:id", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
