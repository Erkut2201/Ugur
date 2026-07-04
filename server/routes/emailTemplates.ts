// server/routes/emailTemplates.ts
// Returns pre-filled email templates for quotes, invoices, and protocols.
import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  quotesTable,
  quotesTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  protocolsTable,
  protocolsTableSQLite,
  customersTable,
  customersTableSQLite,
} from "../../shared/schema.js";

const router = Router();
router.use(requireAuth);

// ---  Default templates (override via env vars) ---

const DEFAULT_SUBJECT: Record<string, string> = {
  quote: "Ihr Angebot {{nummer}} – {{firma}}",
  invoice: "Ihre Rechnung {{nummer}} – {{firma}}",
  protocol: "Ihr Abnahmeprotokoll {{nummer}} – {{firma}}",
};

const DEFAULT_BODY: Record<string, string> = {
  quote: [
    "Sehr geehrte/r {{anrede}},",
    "",
    "vielen Dank für Ihr Interesse an unseren Produkten und Dienstleistungen.",
    "",
    "anbei übersenden wir Ihnen unser Angebot {{nummer}} vom {{datum}} über insgesamt {{betrag}}.",
    "",
    "Das Angebot ist freibleibend und unverbindlich. Für Rückfragen oder Änderungswünsche stehen wir Ihnen jederzeit gerne zur Verfügung.",
    "",
    "Wir freuen uns auf Ihre Rückmeldung und eine angenehme Zusammenarbeit.",
    "",
    "Mit freundlichen Grüßen",
    "{{ansprechpartner}}",
  ].join("\n"),

  invoice: [
    "Sehr geehrte/r {{anrede}},",
    "",
    "vielen Dank für Ihren Auftrag.",
    "",
    "anbei übersenden wir Ihnen unsere Rechnung {{nummer}} vom {{datum}} über {{betrag}}.",
    "",
    "Bitte überweisen Sie den Rechnungsbetrag innerhalb der angegebenen Zahlungsfrist auf das im Dokument genannte Konto.",
    "",
    "Bei Fragen zur Rechnung stehen wir Ihnen selbstverständlich gerne zur Verfügung.",
    "",
    "Mit freundlichen Grüßen",
    "{{ansprechpartner}}",
  ].join("\n"),

  protocol: [
    "Sehr geehrte/r {{anrede}},",
    "",
    "anbei erhalten Sie das Abnahmeprotokoll {{nummer}} vom {{datum}} für Ihr Projekt.",
    "",
    "Bitte prüfen Sie das Protokoll und teilen Sie uns etwaige Anmerkungen zeitnah mit.",
    "",
    "Wir bedanken uns für Ihr Vertrauen und die angenehme Zusammenarbeit.",
    "",
    "Mit freundlichen Grüßen",
    "{{ansprechpartner}}",
  ].join("\n"),
};

function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function buildSignatureText(): string {
  const e = process.env;
  const lines: string[] = [
    "–".repeat(40),
    e.COMPANY_CONTACT_PERSON ?? "",
    e.COMPANY_NAME ?? "",
  ];
  const address = [e.COMPANY_STREET, `${e.COMPANY_ZIP ?? ""} ${e.COMPANY_CITY ?? ""}`.trim()]
    .filter(Boolean).join(", ");
  if (address) lines.push(address);
  lines.push("");
  if (e.COMPANY_PHONE) lines.push(`Tel:   ${e.COMPANY_PHONE}`);
  if (e.COMPANY_EMAIL) lines.push(`E-Mail: ${e.COMPANY_EMAIL}`);
  if (e.COMPANY_WEBSITE) lines.push(`Web:   ${e.COMPANY_WEBSITE}`);
  lines.push("");
  if (e.COMPANY_BANK_NAME) lines.push(`Bank:  ${e.COMPANY_BANK_NAME}`);
  if (e.COMPANY_IBAN) lines.push(`IBAN:  ${e.COMPANY_IBAN}`);
  if (e.COMPANY_BIC) lines.push(`BIC:   ${e.COMPANY_BIC}`);
  if (e.COMPANY_TAX_ID || e.COMPANY_VAT_ID) {
    lines.push("");
    if (e.COMPANY_TAX_ID) lines.push(`Steuernummer: ${e.COMPANY_TAX_ID}`);
    if (e.COMPANY_VAT_ID) lines.push(`USt-IdNr.:    ${e.COMPANY_VAT_ID}`);
  }
  return lines.filter(l => l !== undefined).join("\n");
}

// GET /api/email-templates/:type/:docId
router.get("/:type/:docId", async (req, res) => {
  const { type, docId } = req.params;
  const id = Number(docId);

  if (!["quote", "invoice", "protocol"].includes(type)) {
    res.status(400).json({ error: "Ungültiger Dokumenttyp" });
    return;
  }

  try {
    const { db } = getDb();
    const custTbl = () => (USE_POSTGRES ? customersTable : customersTableSQLite);

    let docNumber = "";
    let docDate = "";
    let docTotal: string | null = null;
    let customerId: number | null = null;

    if (type === "quote") {
      const tbl = USE_POSTGRES ? quotesTable : quotesTableSQLite;
      const rows = await db.select().from(tbl).where(eq(tbl.id, id)).limit(1);
      if (!rows[0]) { res.status(404).json({ error: "Nicht gefunden" }); return; }
      const doc = rows[0] as any;
      docNumber = doc.quoteNumber ?? "";
      docDate = doc.date ?? "";
      docTotal = doc.total ?? null;
      customerId = doc.customerId ?? null;
    } else if (type === "invoice") {
      const tbl = USE_POSTGRES ? invoicesTable : invoicesTableSQLite;
      const rows = await db.select().from(tbl).where(eq(tbl.id, id)).limit(1);
      if (!rows[0]) { res.status(404).json({ error: "Nicht gefunden" }); return; }
      const doc = rows[0] as any;
      docNumber = doc.invoiceNumber ?? "";
      docDate = doc.date ?? "";
      docTotal = doc.total ?? null;
      customerId = doc.customerId ?? null;
    } else {
      const tbl = USE_POSTGRES ? protocolsTable : protocolsTableSQLite;
      const rows = await db.select().from(tbl).where(eq(tbl.id, id)).limit(1);
      if (!rows[0]) { res.status(404).json({ error: "Nicht gefunden" }); return; }
      const doc = rows[0] as any;
      docNumber = doc.protocolNumber ?? "";
      docDate = doc.date ?? "";
      customerId = doc.customerId ?? null;
    }

    let customerEmail = "";
    let customerName = "";
    let salutation = "";

    if (customerId) {
      const custRows = await db.select().from(custTbl()).where(eq(custTbl().id, customerId)).limit(1);
      if (custRows[0]) {
        const c = custRows[0] as any;
        const first = c.firstName ?? "";
        const last = c.name ?? "";
        customerName = [first, last].filter(Boolean).join(" ");
        salutation = c.salutation ?? "";
        customerEmail = c.email ?? "";
      }
    }

    const e = process.env;
    const firma = e.COMPANY_NAME ?? "";
    const ansprechpartner = e.COMPANY_CONTACT_PERSON ?? firma;

    // Build polite salutation
    let anrede = "Damen und Herren";
    const lastName = customerName.split(" ").pop() ?? "";
    if (salutation?.toLowerCase() === "herr") anrede = `Herr ${lastName}`;
    else if (salutation?.toLowerCase() === "frau") anrede = `Frau ${lastName}`;

    const dateFormatted = docDate
      ? new Date(docDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "";
    const totalFormatted = docTotal != null
      ? Number(docTotal).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR"
      : "";

    const vars: Record<string, string> = {
      nummer: docNumber,
      datum: dateFormatted,
      betrag: totalFormatted,
      kunde: customerName,
      anrede,
      firma,
      ansprechpartner,
    };

    const envKeyUpper = type.toUpperCase();
    const rawSubject = (e as any)[`EMAIL_TEMPLATE_${envKeyUpper}_SUBJECT`] ?? DEFAULT_SUBJECT[type];
    const rawBody = (e as any)[`EMAIL_TEMPLATE_${envKeyUpper}_BODY`] ?? DEFAULT_BODY[type];

    res.json({
      subject: applyVars(rawSubject, vars),
      body: applyVars(rawBody, vars),
      to: customerEmail,
      signature: buildSignatureText(),
    });
  } catch (err) {
    console.error("[email-templates]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
