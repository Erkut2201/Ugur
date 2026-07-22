// server/routes/quotes.ts
import { Router } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  quotesTable,
  quotesTableSQLite,
  quoteItemsTable,
  quoteItemsTableSQLite,
  customersTable,
  customersTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  insertQuoteSchema,
} from "../../shared/schema.js";
import { nextDocumentNumber } from "../utils/documentNumber.js";
import { generateQuotePdf } from "../services/pdfService.js";
import { saveDocument, getDocumentUrl } from "../services/storageService.js";
import { sendDocumentEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

const tbl = () => (USE_POSTGRES ? quotesTable : quotesTableSQLite);
const itemsTbl = () => (USE_POSTGRES ? quoteItemsTable : quoteItemsTableSQLite);
const custTbl = () => (USE_POSTGRES ? customersTable : customersTableSQLite);
const invTbl = () => (USE_POSTGRES ? invoicesTable : invoicesTableSQLite);

// Normalisiert Text: entfernt unsichtbare Unicode-Zeichen und falsche Kodierungen
function normalizeText(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  return text
    .normalize('NFC')  // Unicode normalisieren
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero-width spaces entfernen
    .replace(/\u00A0/g, ' ')  // Non-breaking space → normales Leerzeichen
    .trim();
}

// Normalisiert alle Text-Felder in Items
function normalizeItems(items: any[]): any[] {
  return items.map(item => ({
    ...item,
    description: normalizeText(item.description),
    manufacturer: normalizeText(item.manufacturer),
    productInfoTitle: normalizeText(item.productInfoTitle),
    productInfoText: normalizeText(item.productInfoText),
    productDescription: normalizeText(item.productDescription),
    unit: normalizeText(item.unit),
  }));
}

async function getQuoteWithItems(db: any, id: number) {
  const rows = await db.select().from(tbl()).where(eq(tbl().id, id)).limit(1);
  if (rows.length === 0) return null;
  const items = await db
    .select()
    .from(itemsTbl())
    .where(eq(itemsTbl().quoteId, id))
    .orderBy(itemsTbl().position);
  // Join customer
  let customer = null;
  if (rows[0].customerId) {
    const custRows = await db.select().from(custTbl()).where(eq(custTbl().id, rows[0].customerId)).limit(1);
    customer = custRows[0] ?? null;
  }
  return { ...rows[0], items, customer };
}

// GET /api/quotes
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await db.select().from(tbl()).orderBy(desc(tbl().createdAt));
    if (rows.length === 0) { res.json([]); return; }
    const quoteIds = rows.map((r: any) => r.id);
    const linkedInvoices = await db
      .select()
      .from(invTbl())
      .where(inArray(invTbl().quoteId, quoteIds));
    const invoicesByQuoteId = new Map<number, any[]>();
    for (const inv of linkedInvoices) {
      if (inv.quoteId == null) continue;
      if (!invoicesByQuoteId.has(inv.quoteId)) invoicesByQuoteId.set(inv.quoteId, []);
      invoicesByQuoteId.get(inv.quoteId)!.push(inv);
    }
    const enriched = rows.map((r: any) => {
      const quoteInvoices = invoicesByQuoteId.get(r.id) ?? [];
      const standardInvoice = quoteInvoices.find((inv) => (inv.invoiceType ?? "standard") === "standard") ?? null;
      const downPaymentInvoice = quoteInvoices.find((inv) => inv.invoiceType === "down_payment") ?? null;
      const finalInvoice = quoteInvoices.find((inv) => inv.invoiceType === "final") ?? null;
      return {
        ...r,
        linkedInvoiceNumber: finalInvoice?.invoiceNumber ?? standardInvoice?.invoiceNumber ?? downPaymentInvoice?.invoiceNumber ?? null,
        linkedInvoiceId: finalInvoice?.id ?? standardInvoice?.id ?? downPaymentInvoice?.id ?? null,
        linkedInvoices: quoteInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceType: inv.invoiceType ?? "standard",
          status: inv.status,
        })),
        downPaymentInvoiceNumber: downPaymentInvoice?.invoiceNumber ?? null,
        downPaymentInvoiceId: downPaymentInvoice?.id ?? null,
        finalInvoiceNumber: finalInvoice?.invoiceNumber ?? null,
        finalInvoiceId: finalInvoice?.id ?? null,
      };
    });
    res.json(enriched);
  } catch (err) {
    console.error("[quotes/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/quotes/:id
router.get("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const quote = await getQuoteWithItems(db, Number(req.params.id));
    if (!quote) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(quote);
  } catch (err) {
    console.error("[quotes/get]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/quotes
router.post("/", async (req, res) => {
  const parsed = insertQuoteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const quoteNumber = await nextDocumentNumber("quote");
    const { items, ...quoteData } = parsed.data;

    const inserted = await db
      .insert(tbl())
      .values({ ...quoteData, quoteNumber, vatRate: String(quoteData.vatRate) })
      .returning();
    const quote = inserted[0];

    if (items.length > 0) {
      const normalizedItems = normalizeItems(items);
      await db.insert(itemsTbl()).values(
        normalizedItems.map((item) => ({ ...item, quoteId: quote.id }))
      );
    }

    const full = await getQuoteWithItems(db, quote.id);
    res.status(201).json(full);
  } catch (err) {
    console.error("[quotes/create]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/quotes/:id
router.put("/:id", async (req, res) => {
  const parsed = insertQuoteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const id = Number(req.params.id);
    const { items, ...quoteData } = parsed.data;

    await db
      .update(tbl())
      .set({ ...quoteData, vatRate: String(quoteData.vatRate), updatedAt: new Date() })
      .where(eq(tbl().id, id));

    // Replace items
    await db.delete(itemsTbl()).where(eq(itemsTbl().quoteId, id));
    if (items.length > 0) {
      const normalizedItems = normalizeItems(items);
      await db.insert(itemsTbl()).values(normalizedItems.map((item) => ({ ...item, quoteId: id })));
    }

    const full = await getQuoteWithItems(db, id);
    if (!full) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(full);
  } catch (err) {
    console.error("[quotes/update]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PATCH /api/quotes/:id/status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body ?? {};
  const valid = ["draft", "sent", "accepted", "rejected"];
  if (!valid.includes(status)) { res.status(400).json({ error: "Ungültiger Status" }); return; }
  try {
    const { db } = getDb();
    await db.update(tbl()).set({ status }).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[quotes/status]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/quotes/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await db.delete(tbl()).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[quotes/delete]", err);
    if (err?.code === "23503") {
      res.status(409).json({ error: "Dieses Angebot kann nicht gelöscht werden, da noch Rechnungen oder Protokolle damit verknüpft sind. Bitte zuerst die verknüpften Einträge löschen." });
      return;
    }
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/quotes/:id/pdf  — generate & store PDF
router.post("/:id/pdf", async (req, res) => {
  try {
    const { db } = getDb();
    const quote = await getQuoteWithItems(db, Number(req.params.id));
    if (!quote) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateQuotePdf(quote as any);
    const key = await saveDocument(`quotes/${quote.id}/${quote.quoteNumber}.pdf`, pdfBuffer);

    await db
      .update(tbl())
      .set({ pdfS3Key: key })
      .where(eq(tbl().id, quote.id));

    res.json({ key, url: await getDocumentUrl(key) });
  } catch (err) {
    console.error("[quotes/pdf]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/quotes/:id/pdf/download  — generate fresh PDF and stream to browser
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const { db } = getDb();
    const quote = await getQuoteWithItems(db, Number(req.params.id));
    if (!quote) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateQuotePdf(quote as any);
    const fileName = `${(quote as any).quoteNumber ?? "Angebot"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[quotes/download]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/quotes/:id/pdf/:filename  — same as /download but with filename in URL for browser tab title
router.get("/:id/pdf/:filename", async (req, res) => {
  try {
    const { db } = getDb();
    const quote = await getQuoteWithItems(db, Number(req.params.id));
    if (!quote) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateQuotePdf(quote as any);
    const fileName = `${(quote as any).quoteNumber ?? "Angebot"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[quotes/pdf-named]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// POST /api/quotes/:id/send-email
router.post("/:id/send-email", async (req, res) => {
  const { to, subject, message } = req.body ?? {};
  if (!to) { res.status(400).json({ error: "Empfänger fehlt" }); return; }

  try {
    const { db } = getDb();
    const quote = await getQuoteWithItems(db, Number(req.params.id));
    if (!quote) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateQuotePdf(quote as any);
    await sendDocumentEmail({
      to,
      subject: subject ?? `Angebot ${(quote as any).quoteNumber}`,
      text: message ?? `Anbei finden Sie unser Angebot ${(quote as any).quoteNumber}.`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${(quote as any).quoteNumber}.pdf`,
    });

    // Update status to sent
    await db.update(tbl()).set({ status: "sent" }).where(eq(tbl().id, (quote as any).id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[quotes/email]", err);
    res.status(500).json({ error: "E-Mail-Versand fehlgeschlagen" });
  }
});

// PATCH /api/quotes/:id/number — change quote number with duplicate handling
router.patch("/:id/number", async (req, res) => {
  try {
    const { newNumber, resolution } = req.body;
    const id = Number(req.params.id);

    if (!newNumber || typeof newNumber !== "string") {
      res.status(400).json({ error: "newNumber erforderlich" });
      return;
    }

    const { db } = getDb();

    // Check if new number already exists
    const existing = await db
      .select()
      .from(tbl())
      .where(eq(tbl().quoteNumber, newNumber))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      // Duplicate found
      if (!resolution) {
        res.status(409).json({
          error: "duplicate",
          message: `Die Angebotsnummer ${newNumber} existiert bereits.`,
          existingId: existing[0].id,
        });
        return;
      }

      // Handle resolution
      if (resolution === "temp") {
        // Give old quote a temporary number
        const tempNumber = `${newNumber}-TEMP-${Date.now()}`;
        await db
          .update(tbl())
          .set({ quoteNumber: tempNumber, updatedAt: new Date() })
          .where(eq(tbl().id, existing[0].id));
      } else if (resolution === "next") {
        // Give old quote the next available number
        const nextNumber = await nextDocumentNumber("quote");
        await db
          .update(tbl())
          .set({ quoteNumber: nextNumber, updatedAt: new Date() })
          .where(eq(tbl().id, existing[0].id));
      } else {
        res.status(400).json({ error: "Ungültige resolution: temp oder next erforderlich" });
        return;
      }
    }

    // Update the target quote with new number
    await db
      .update(tbl())
      .set({ quoteNumber: newNumber, updatedAt: new Date() })
      .where(eq(tbl().id, id));

    const updated = await getQuoteWithItems(db, id);
    res.json(updated);
  } catch (err: any) {
    console.error("[quotes/update-number]", err);
    if (err?.code === "23505" || err?.code === "SQLITE_CONSTRAINT") {
      res.status(409).json({ error: "Die Angebotsnummer existiert bereits" });
      return;
    }
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
