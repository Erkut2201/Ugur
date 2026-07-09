// server/routes/invoices.ts
import { Router } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  invoicesTable,
  invoicesTableSQLite,
  invoiceItemsTable,
  invoiceItemsTableSQLite,
  quotesTable,
  quotesTableSQLite,
  quoteItemsTable,
  quoteItemsTableSQLite,
  customersTable,
  customersTableSQLite,
  protocolsTable,
  protocolsTableSQLite,
  insertInvoiceSchema,
} from "../../shared/schema.js";
import {
  convertDocumentNumber,
  formatInstallmentInvoiceNumber,
  getInvoiceGroupNumberFromQuoteNumber,
  nextDocumentNumber,
} from "../utils/documentNumber.js";
import { generateInvoicePdf } from "../services/pdfService.js";
import { saveDocument, getDocumentUrl } from "../services/storageService.js";
import { sendDocumentEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

const tbl = () => (USE_POSTGRES ? invoicesTable : invoicesTableSQLite);
const itemsTbl = () => (USE_POSTGRES ? invoiceItemsTable : invoiceItemsTableSQLite);
const quotesTbl = () => (USE_POSTGRES ? quotesTable : quotesTableSQLite);
const quoteItemsTbl = () => (USE_POSTGRES ? quoteItemsTable : quoteItemsTableSQLite);
const custTbl = () => (USE_POSTGRES ? customersTable : customersTableSQLite);
const protTbl = () => (USE_POSTGRES ? protocolsTable : protocolsTableSQLite);

async function getInvoiceWithItems(db: any, id: number) {
  const rows = await db.select().from(tbl()).where(eq(tbl().id, id)).limit(1);
  if (rows.length === 0) return null;
  const invoice = rows[0];
  const items = await db
    .select()
    .from(itemsTbl())
    .where(eq(itemsTbl().invoiceId, id))
    .orderBy(itemsTbl().position);
  let customer = null;
  if (invoice.customerId) {
    const custRows = await db.select().from(custTbl()).where(eq(custTbl().id, invoice.customerId)).limit(1);
    customer = custRows[0] ?? null;
  }
  let quoteNumber: string | null = null;
  let quote: any = null;
  if (invoice.quoteId) {
    const qRows = await db.select().from(quotesTbl()).where(eq(quotesTbl().id, invoice.quoteId)).limit(1);
    quote = qRows[0] ?? null;
    quoteNumber = quote?.quoteNumber ?? null;
  }
  let creditedInvoice: any = null;
  if (invoice.creditedInvoiceId) {
    const creditedRows = await db.select().from(tbl()).where(eq(tbl().id, invoice.creditedInvoiceId)).limit(1);
    creditedInvoice = creditedRows[0] ?? null;
  }
  return { ...invoice, items, customer, quoteNumber, quote, creditedInvoice };
}

function parseMoney(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildDownPaymentDescription(quoteNumber: string, percent: number, projectDescription?: string | null) {
  const suffix = projectDescription?.trim() ? ` - ${projectDescription.trim()}` : "";
  return `Anzahlungsrechnung ${percent.toFixed(2).replace(/\.00$/, "")} % zu Angebot ${quoteNumber}${suffix}`;
}

async function getInvoicesByQuoteId(db: any, quoteId: number) {
  return db.select().from(tbl()).where(eq(tbl().quoteId, quoteId));
}

function getInstallmentByType(invoices: any[], invoiceType: string) {
  return invoices.find((invoice) => invoice.invoiceType === invoiceType) ?? null;
}

// GET /api/invoices
router.get("/", async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await db.select().from(tbl()).orderBy(desc(tbl().createdAt));
    if (rows.length === 0) { res.json([]); return; }
    const invoiceIds = rows.map((r: any) => r.id);
    const linkedProtocols = await db
      .select()
      .from(protTbl())
      .where(inArray(protTbl().invoiceId, invoiceIds));
    const protocolByInvoiceId = new Map<number, any>();
    for (const p of linkedProtocols) {
      if (p.invoiceId != null) protocolByInvoiceId.set(p.invoiceId, p);
    }
    const enriched = rows.map((r: any) => ({
      ...r,
      linkedProtocolNumber: protocolByInvoiceId.get(r.id)?.protocolNumber ?? null,
      linkedProtocolId: protocolByInvoiceId.get(r.id)?.id ?? null,
      canCreateProtocol: ["standard", "final"].includes(r.invoiceType ?? "standard"),
    }));
    res.json(enriched);
  } catch (err) {
    console.error("[invoices/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/invoices/:id
router.get("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    const invoice = await getInvoiceWithItems(db, Number(req.params.id));
    if (!invoice) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(invoice);
  } catch (err) {
    console.error("[invoices/get]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/invoices
router.post("/", async (req, res) => {
  const parsed = insertInvoiceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const invoiceNumber = await nextDocumentNumber("invoice");
    const { items, ...invoiceData } = parsed.data;

    const inserted = await db
      .insert(tbl())
      .values({ ...invoiceData, invoiceNumber, vatRate: String(invoiceData.vatRate) })
      .returning();
    const invoice = inserted[0];

    if (items.length > 0) {
      await db.insert(itemsTbl()).values(items.map((item) => ({ ...item, invoiceId: invoice.id })));
    }

    res.status(201).json(await getInvoiceWithItems(db, invoice.id));
  } catch (err) {
    console.error("[invoices/create]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/invoices/from-quote/:quoteId  — create invoice from quote
router.post("/from-quote/:quoteId", async (req, res) => {
  try {
    const { db } = getDb();
    const quoteId = Number(req.params.quoteId);
    const requestedType = String(req.body?.invoiceType ?? "").trim();

    const quoteRows = await db.select().from(quotesTbl()).where(eq(quotesTbl().id, quoteId)).limit(1);
    if (quoteRows.length === 0) { res.status(404).json({ error: "Angebot nicht gefunden" }); return; }
    const quote = quoteRows[0];

    const quoteItems = await db
      .select()
      .from(quoteItemsTbl())
      .where(eq(quoteItemsTbl().quoteId, quoteId))
      .orderBy(quoteItemsTbl().position);

    const existingInvoices = await getInvoicesByQuoteId(db, quoteId);
    const downPaymentPercent = Number(quote.downPaymentPercent ?? 0);
    const hasDownPayment = downPaymentPercent > 0;
    const invoiceType = hasDownPayment
      ? (requestedType === "down_payment" || requestedType === "final" ? requestedType : "")
      : "standard";

    if (!invoiceType) {
      res.status(400).json({ error: "Bitte Rechnungsart angeben" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (!hasDownPayment) {
      if (existingInvoices.length > 0) {
        res.status(409).json({ error: "Zu diesem Angebot existiert bereits eine Rechnung" });
        return;
      }

      const invoiceNumber = convertDocumentNumber("invoice", quote.quoteNumber);
      const inserted = await db
        .insert(tbl())
        .values({
          invoiceNumber,
          invoiceType: "standard",
          invoiceGroupNumber: invoiceNumber,
          installmentIndex: null,
          creditedInvoiceId: null,
          quoteId,
          customerId: quote.customerId,
          date: today,
          dueDate,
          paymentTerms: quote.paymentTerms,
          projectDescription: quote.projectDescription,
          notes: quote.notes,
          status: "draft",
          vatRate: quote.vatRate,
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount,
          total: quote.total,
          billingName: quote.billingName ?? null,
          billingStreet: quote.billingStreet ?? null,
          billingZip: quote.billingZip ?? null,
          billingCity: quote.billingCity ?? null,
        })
        .returning();
      const invoice = inserted[0];

      if (quoteItems.length > 0) {
        await db.insert(itemsTbl()).values(
          quoteItems.map(({ id: _id, quoteId: _qid, ...item }: any) => ({
            ...item,
            invoiceId: invoice.id,
          }))
        );
      }

      res.status(201).json(await getInvoiceWithItems(db, invoice.id));
      return;
    }

    const invoiceGroupNumber = getInvoiceGroupNumberFromQuoteNumber(quote.quoteNumber);
    const existingDownPayment = getInstallmentByType(existingInvoices, "down_payment");
    const existingFinal = getInstallmentByType(existingInvoices, "final");

    if (invoiceType === "down_payment") {
      if (existingDownPayment) {
        res.status(409).json({ error: "Anzahlungsrechnung existiert bereits" });
        return;
      }

      const subtotal = roundMoney(parseMoney(quote.subtotal) * (downPaymentPercent / 100));
      const vatAmount = roundMoney(parseMoney(quote.vatAmount) * (downPaymentPercent / 100));
      const total = roundMoney(subtotal + vatAmount);
      const invoiceNumber = formatInstallmentInvoiceNumber(invoiceGroupNumber, 1);

      const inserted = await db
        .insert(tbl())
        .values({
          invoiceNumber,
          invoiceType: "down_payment",
          invoiceGroupNumber,
          installmentIndex: 1,
          creditedInvoiceId: null,
          quoteId,
          customerId: quote.customerId,
          date: today,
          dueDate,
          paymentTerms: quote.paymentTerms,
          projectDescription: quote.projectDescription,
          notes: quote.notes,
          status: "draft",
          vatRate: quote.vatRate,
          subtotal,
          vatAmount,
          total,
          billingName: quote.billingName ?? null,
          billingStreet: quote.billingStreet ?? null,
          billingZip: quote.billingZip ?? null,
          billingCity: quote.billingCity ?? null,
        })
        .returning();
      const invoice = inserted[0];

      if (quoteItems.length > 0) {
        await db.insert(itemsTbl()).values(
          quoteItems.map(({ id: _id, quoteId: _qid, ...item }: any) => ({
            ...item,
            invoiceId: invoice.id,
          }))
        );
      } else {
        await db.insert(itemsTbl()).values([
          {
            invoiceId: invoice.id,
            position: 1,
            description: buildDownPaymentDescription(quote.quoteNumber, downPaymentPercent, quote.projectDescription),
            quantity: 1,
            unit: "Pauschal",
            unitPrice: total,
            total,
          },
        ]);
      }

      res.status(201).json(await getInvoiceWithItems(db, invoice.id));
      return;
    }

    if (existingFinal) {
      res.status(409).json({ error: "Finale Rechnung existiert bereits" });
      return;
    }
    if (!existingDownPayment) {
      res.status(409).json({ error: "Bitte zuerst die Anzahlungsrechnung erstellen" });
      return;
    }

    const invoiceNumber = formatInstallmentInvoiceNumber(invoiceGroupNumber, 2);
    const inserted = await db
      .insert(tbl())
      .values({
        invoiceNumber,
        invoiceType: "final",
        invoiceGroupNumber,
        installmentIndex: 2,
        creditedInvoiceId: existingDownPayment.id,
        quoteId,
        customerId: quote.customerId,
        date: today,
        dueDate,
        paymentTerms: quote.paymentTerms,
        projectDescription: quote.projectDescription,
        notes: quote.notes,
        status: "draft",
        vatRate: quote.vatRate,
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        total: quote.total,
        billingName: quote.billingName ?? null,
        billingStreet: quote.billingStreet ?? null,
        billingZip: quote.billingZip ?? null,
        billingCity: quote.billingCity ?? null,
      })
      .returning();
    const invoice = inserted[0];

    if (quoteItems.length > 0) {
      await db.insert(itemsTbl()).values(
        quoteItems.map(({ id: _id, quoteId: _qid, ...item }: any) => ({
          ...item,
          invoiceId: invoice.id,
        }))
      );
    }

    res.status(201).json(await getInvoiceWithItems(db, invoice.id));
  } catch (err) {
    console.error("[invoices/from-quote]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PUT /api/invoices/:id
router.put("/:id", async (req, res) => {
  const parsed = insertInvoiceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { db } = getDb();
    const id = Number(req.params.id);
    const current = await getInvoiceWithItems(db, id);
    if (!current) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    if (current.invoiceType === "down_payment") {
      res.status(409).json({ error: "Anzahlungsrechnungen können nicht bearbeitet werden" });
      return;
    }

    const { items, ...invoiceData } = parsed.data;
    const safeInvoiceData = {
      ...invoiceData,
      invoiceType: current.invoiceType ?? invoiceData.invoiceType,
      invoiceGroupNumber: current.invoiceGroupNumber ?? invoiceData.invoiceGroupNumber ?? current.invoiceNumber,
      installmentIndex: current.installmentIndex ?? invoiceData.installmentIndex ?? null,
      creditedInvoiceId: current.creditedInvoiceId ?? invoiceData.creditedInvoiceId ?? null,
    };

    await db
      .update(tbl())
      .set({ ...safeInvoiceData, vatRate: String(safeInvoiceData.vatRate), updatedAt: new Date() })
      .where(eq(tbl().id, id));

    await db.delete(itemsTbl()).where(eq(itemsTbl().invoiceId, id));
    if (items.length > 0) {
      await db.insert(itemsTbl()).values(items.map((item) => ({ ...item, invoiceId: id })));
    }

    const full = await getInvoiceWithItems(db, id);
    if (!full) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    res.json(full);
  } catch (err) {
    console.error("[invoices/update]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// PATCH /api/invoices/:id/status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body ?? {};
  const valid = ["draft", "sent", "paid", "overdue"];
  if (!valid.includes(status)) { res.status(400).json({ error: "Ungültiger Status" }); return; }

  try {
    const { db } = getDb();
    await db.update(tbl()).set({ status }).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[invoices/status]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", async (req, res) => {
  try {
    const { db } = getDb();
    await db.delete(tbl()).where(eq(tbl().id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[invoices/delete]", err);
    if (err?.code === "23503") {
      res.status(409).json({ error: "Diese Rechnung kann nicht gelöscht werden, da noch Protokolle damit verknüpft sind. Bitte zuerst die verknüpften Protokolle löschen." });
      return;
    }
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/invoices/:id/pdf
router.post("/:id/pdf", async (req, res) => {
  try {
    const { db } = getDb();
    const invoice = await getInvoiceWithItems(db, Number(req.params.id));
    if (!invoice) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateInvoicePdf(invoice as any);
    const key = await saveDocument(`invoices/${invoice.id}/${(invoice as any).invoiceNumber}.pdf`, pdfBuffer);

    await db.update(tbl()).set({ pdfS3Key: key }).where(eq(tbl().id, (invoice as any).id));
    res.json({ key, url: await getDocumentUrl(key) });
  } catch (err) {
    console.error("[invoices/pdf]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/invoices/:id/pdf/download  — generate fresh PDF and stream to browser
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const { db } = getDb();
    const invoice = await getInvoiceWithItems(db, Number(req.params.id));
    if (!invoice) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateInvoicePdf(invoice as any);
    const fileName = `${(invoice as any).invoiceNumber ?? "Rechnung"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[invoices/download]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// GET /api/invoices/:id/pdf/:filename  — same as /download but with filename in URL for browser tab title
router.get("/:id/pdf/:filename", async (req, res) => {
  try {
    const { db } = getDb();
    const invoice = await getInvoiceWithItems(db, Number(req.params.id));
    if (!invoice) { res.status(404).json({ error: "Nicht gefunden" }); return; }
    const pdfBuffer = await generateInvoicePdf(invoice as any);
    const fileName = `${(invoice as any).invoiceNumber ?? "Rechnung"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[invoices/pdf-named]", err);
    res.status(500).json({ error: "PDF-Generierung fehlgeschlagen" });
  }
});

// POST /api/invoices/:id/send-email
router.post("/:id/send-email", async (req, res) => {
  const { to, subject, message } = req.body ?? {};
  if (!to) { res.status(400).json({ error: "Empfänger fehlt" }); return; }

  try {
    const { db } = getDb();
    const invoice = await getInvoiceWithItems(db, Number(req.params.id));
    if (!invoice) { res.status(404).json({ error: "Nicht gefunden" }); return; }

    const pdfBuffer = await generateInvoicePdf(invoice as any);
    await sendDocumentEmail({
      to,
      subject: subject ?? `Rechnung ${(invoice as any).invoiceNumber}`,
      text: message ?? `Anbei finden Sie unsere Rechnung ${(invoice as any).invoiceNumber}.`,
      attachmentBuffer: pdfBuffer,
      attachmentName: `${(invoice as any).invoiceNumber}.pdf`,
    });

    await db.update(tbl()).set({ status: "sent" }).where(eq(tbl().id, (invoice as any).id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[invoices/email]", err);
    res.status(500).json({ error: "E-Mail-Versand fehlgeschlagen" });
  }
});

export default router;
