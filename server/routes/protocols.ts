// server/routes/protocols.ts
import { Router } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  protocolsTable,
  protocolsTableSQLite,
  protocolItemsTable,
  protocolItemsTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  invoiceItemsTable,
  invoiceItemsTableSQLite,
  quotesTable,
  quotesTableSQLite,
  customersTable,
  customersTableSQLite,
  insertProtocolSchema,
} from "../../shared/schema.js";
import { convertDocumentNumber, nextDocumentNumber } from "../utils/documentNumber.js";
import { generateProtocolPdf } from "../services/pdfService.js";
import { saveDocument, getDocumentUrl } from "../services/storageService.js";
import { sendDocumentEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

const tbl = () => (USE_POSTGRES ? protocolsTable : protocolsTableSQLite);
const itemsTbl = () => (USE_POSTGRES ? protocolItemsTable : protocolItemsTableSQLite);
const invTbl = () => (USE_POSTGRES ? invoicesTable : invoicesTableSQLite);
const invItemsTbl = () => (USE_POSTGRES ? invoiceItemsTable : invoiceItemsTableSQLite);
const quoteTbl = () => (USE_POSTGRES ? quotesTable : quotesTableSQLite);
const custTbl = () => (USE_POSTGRES ? customersTable : customersTableSQLite);

async function getProtocolWithItems(db: any, id: number) {
  const rows = await db.select().from(tbl()).where(eq(tbl().id, id)).limit(1);
  if (rows.length === 0) return null;
  const proto = rows[0];
  const items = await db
    .select()
    .from(itemsTbl())
    .where(eq(itemsTbl().protocolId, id))
    .orderBy(itemsTbl().position);
  // Join customer
  let customer = null;
  if (proto.customerId) {
    const cr = await db.select().from(custTbl()).where(eq(custTbl().id, proto.customerId)).limit(1);
    customer = cr[0] ?? null;
  }
  // Join invoice number
  let invoiceNumber: string | null = null;
  if (proto.invoiceId) {
    const ir = await db.select().from(invTbl()).where(eq(invTbl().id, proto.invoiceId)).limit(1);
    invoiceNumber = ir[0]?.invoiceNumber ?? null;
  }
  // Join quote number
  let quoteNumber: string | null = null;
  if (proto.quoteId) {
    const qr = await db.select().from(quoteTbl()).where(eq(quoteTbl().id, proto.quoteId)).limit(1);
    quoteNumber = qr[0]?.quoteNumber ?? null;
  }
  return { ...proto, items, customer, invoiceNumber, quoteNumber };
}

// GET /api/protocols
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await db.select().from(tbl()).orderBy(desc(tbl().createdAt));
    if (rows.length === 0) { res.json([]); return; }
    // Load items for each protocol
    const ids = rows.map((r: any) => r.id);
    const allItems = await db
      .select()
      .from(itemsTbl())
      .where(inArray(itemsTbl().protocolId, ids))
      .orderBy(itemsTbl().position);
    const itemsByProtocol = new Map<number, any[]>();
    for (const item of allItems) {
      if (!itemsByProtocol.has(item.protocolId)) itemsByProtocol.set(item.protocolId, []);
      itemsByProtocol.get(item.protocolId)!.push(item);
    }
    const enriched = rows.map((r: any) => ({ ...r, items: itemsByProtocol.get(r.id) ?? [] }));
    res.json(enriched);
  } catch (err) {
    console.error("[protocols/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/protocols/:id
router.get("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const protocol = await getProtocolWithItems(db, Number(req.params.id));
    if (!protocol) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(protocol);
  } catch (err) {
    console.error("[protocols/get]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/protocols
router.post("/", async (req, res) => {
  const parsed = insertProtocolSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const protocolNumber = await nextDocumentNumber("protocol");
    const { items, ...protocolData } = parsed.data;

    const inserted = await db.insert(tbl()).values({ ...protocolData, protocolNumber }).returning();
    const protocol = inserted[0];

    if (items.length > 0) {
      await db.insert(itemsTbl()).values(items.map((item) => ({ ...item, protocolId: protocol.id })));
    }

    res.status(201).json(await getProtocolWithItems(db, protocol.id));
  } catch (err) {
    console.error("[protocols/create]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/protocols/from-invoice/:invoiceId
router.post("/from-invoice/:invoiceId", async (req, res) => {
  try {
    const { db } = getDb();
    const invoiceId = Number(req.params.invoiceId);

    const invRows = await db.select().from(invTbl()).where(eq(invTbl().id, invoiceId)).limit(1);
    if (invRows.length === 0) { res.status(404).json({ error: "Rechnung nicht gefunden" }); return; }
    const invoice = invRows[0];
    if (!["standard", "final"].includes(invoice.invoiceType ?? "standard")) {
      res.status(409).json({ error: "Ein Protokoll kann nur aus der finalen Rechnung erstellt werden" });
      return;
    }

    const invItems = await db
      .select()
      .from(invItemsTbl())
      .where(eq(invItemsTbl().invoiceId, invoiceId))
      .orderBy(invItemsTbl().position);

    const protocolNumber = convertDocumentNumber("protocol", invoice.invoiceNumber);
    const today = new Date().toISOString().split("T")[0];

    const inserted = await db
      .insert(tbl())
      .values({
        protocolNumber,
        invoiceId,
        quoteId: invoice.quoteId,
        customerId: invoice.customerId,
        date: today,
        projectDescription: invoice.projectDescription,
        status: "draft",
      })
      .returning();
    const protocol = inserted[0];

    // Convert invoice items to protocol checklist items
    if (invItems.length > 0) {
      await db.insert(itemsTbl()).values(
        invItems.map((item: any) => ({
          protocolId: protocol.id,
          position: item.position,
          description: item.description,
          completed: false,
        }))
      );
    }

    res.status(201).json(await getProtocolWithItems(db, protocol.id));
  } catch (err) {
    console.error("[protocols/from-invoice]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/protocols/:id
router.put("/:id", async (req, res) => {
  const parsed = insertProtocolSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const id = Number(req.params.id);
    const { items, ...protocolData } = parsed.data;

    await db
      .update(tbl())
      .set({ ...protocolData, updatedAt: new Date() })
      .where(eq(tbl().id, id));

    await db.delete(itemsTbl()).where(eq(itemsTbl().protocolId, id));
    if (items.length > 0) {
      await db.insert(itemsTbl()).values(items.map((item) => ({ ...item, protocolId: id })));
    }

    const full = await getProtocolWithItems(db, id);
    if (!full) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(full);
  } catch (err) {
    console.error("[protocols/update]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PATCH /api/protocols/:id/status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body ?? {};
  const valid = ["draft", "completed", "signed"];
  if (!valid.includes(status)) { res.status(400).json({ error: "Ungültiger Status" }); return; }
  try {
    const { db } = getDb();
    await db.update(tbl()).set({ status }).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[protocols/status]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/protocols/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await db.delete(tbl()).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[protocols/delete]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/protocols/:id/pdf
router.post("/:id/pdf", async (req, res) => {
  try {
    const { db } = getDb();
    const protocol = await getProtocolWithItems(db, Number(req.params.id));
    if (!protocol) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateProtocolPdf(protocol as any);
    const key = await saveDocument(`protocols/${protocol.id}/${(protocol as any).protocolNumber}.pdf`, pdfBuffer);

    await db.update(tbl()).set({ pdfS3Key: key }).where(eq(tbl().id, (protocol as any).id));
    res.json({ key, url: await getDocumentUrl(key) });
  } catch (err) {
    console.error("[protocols/pdf]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/protocols/:id/pdf/download  — generate fresh PDF and stream to browser
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const { db } = getDb();
    const protocol = await getProtocolWithItems(db, Number(req.params.id));
    if (!protocol) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateProtocolPdf(protocol as any);
    const fileName = `${(protocol as any).protocolNumber ?? "Protokoll"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[protocols/download]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/protocols/:id/pdf/:filename  — same as /download but with filename in URL for browser tab title
router.get("/:id/pdf/:filename", async (req, res) => {
  try {
    const { db } = getDb();
    const protocol = await getProtocolWithItems(db, Number(req.params.id));
    if (!protocol) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateProtocolPdf(protocol as any);
    const fileName = `${(protocol as any).protocolNumber ?? "Protokoll"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[protocols/pdf-named]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// POST /api/protocols/:id/send-email
router.post("/:id/send-email", async (req, res) => {
  const { to, subject, message } = req.body ?? {};
  if (!to) { res.status(400).json({ error: "Empfänger fehlt" }); return; }

  try {
    const { db } = getDb();
    const protocol = await getProtocolWithItems(db, Number(req.params.id));
    if (!protocol) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateProtocolPdf(protocol as any);
    await sendDocumentEmail({
      to,
      subject: subject ?? `Abnahmeprotokoll ${(protocol as any).protocolNumber}`,
      text: message ?? `Anbei finden Sie das Abnahmeprotokoll ${(protocol as any).protocolNumber}.`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${(protocol as any).protocolNumber}.pdf`,
    });

    await db.update(tbl()).set({ status: "completed" }).where(eq(tbl().id, (protocol as any).id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[protocols/email]", err);
    res.status(500).json({ error: "E-Mail-Versand fehlgeschlagen" });
  }
});

export default router;
