// server/routes/customers.ts
import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  customersTable,
  customersTableSQLite,
  insertCustomerSchema,
} from "../../shared/schema.js";

const router = Router();
router.use(requireAuth);

const table = () => (USE_POSTGRES ? customersTable : customersTableSQLite);

// GET /api/customers
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any).select().from(table()).orderBy(table().name);
    
    // PostgreSQL gibt snake_case zurück → manuell zu camelCase mappen
    const mapped = rows.map((r: any) => ({
      id: r.id,
      salutation: r.salutation,
      firstName: r.first_name ?? r.firstName, // PG: first_name, SQLite: firstName
      name: r.name,
      company: r.company,
      street: r.street,
      zip: r.zip,
      city: r.city,
      email: r.email,
      phone: r.phone,
      notes: r.notes,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error("[customers/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(table())
      .where(eq(table().id, Number(req.params.id)))
      .limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    
    const r = rows[0];
    const mapped = {
      id: r.id,
      salutation: r.salutation,
      firstName: r.first_name ?? r.firstName,
      name: r.name,
      company: r.company,
      street: r.street,
      zip: r.zip,
      city: r.city,
      email: r.email,
      phone: r.phone,
      notes: r.notes,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
    };
    
    res.json(mapped);
  } catch (err) {
    console.error("[customers/get]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/customers
router.post("/", async (req, res) => {
  const parsed = insertCustomerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const inserted = await (db as any).insert(table()).values(parsed.data).returning();
    res.status(201).json(inserted[0] ?? parsed.data);
  } catch (err) {
    console.error("[customers/create]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
  const parsed = insertCustomerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const updated = await (db as any)
      .update(table())
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(table().id, Number(req.params.id)))
      .returning();
    if (updated.length === 0) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(updated[0]);
  } catch (err) {
    console.error("[customers/update]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await (db as any).delete(table()).where(eq(table().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "23503") {
      res.status(409).json({ error: "Kunde hat noch verknüpfte Dokumente (Angebote, Rechnungen oder Protokolle) und kann nicht gelöscht werden." });
      return;
    }
    console.error("[customers/delete]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
