// server/services/pdfService.ts
// Generates PDFs matching the Konzept-Terrasse Briefkopf layout exactly.
// ALL text content comes from env vars -- nothing is hardcoded.

import { jsPDF } from "jspdf";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const autoTable = _require("jspdf-autotable").default ?? _require("jspdf-autotable");
import { readImageAsBase64 } from "./storageService.js";

// --- Env-based company config -------------------------------------------------
function company() {
  return {
    name:           process.env.COMPANY_NAME           ?? "",
    street:         process.env.COMPANY_STREET         ?? "",
    zip:            process.env.COMPANY_ZIP            ?? "",
    city:           process.env.COMPANY_CITY           ?? "",
    phone:          process.env.COMPANY_PHONE          ?? "",
    email:          process.env.COMPANY_EMAIL          ?? "",
    website:        process.env.COMPANY_WEBSITE        ?? "",
    bankName:       process.env.COMPANY_BANK_NAME      ?? "",
    iban:           process.env.COMPANY_IBAN           ?? "",
    bic:            process.env.COMPANY_BIC            ?? "",
    taxId:          process.env.COMPANY_TAX_ID         ?? "",
    vatId:          process.env.COMPANY_VAT_ID         ?? "",
    defaultVatRate: Number(process.env.DEFAULT_VAT_RATE ?? 19),
    contactPerson:  process.env.COMPANY_CONTACT_PERSON ?? "",
    finanzamt:      process.env.COMPANY_FINANZAMT      ?? "",
    deliveryTime:   process.env.DEFAULT_DELIVERY_TIME  ?? "",
  };
}

// --- Layout constants (A4 = 210x297 mm) --------------------------------------
const MARGIN        = 20;
const PAGE_WIDTH    = 210;
const PAGE_HEIGHT   = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 170 mm

// Header image (1786x424 px) spans full page width; proportional height ~50 mm
const HEADER_IMG_H = Math.round(PAGE_WIDTH * (424 / 1786)); // ~50
const TOP_PADDING  = HEADER_IMG_H + 6; // customer address starts here

// Footer: 4 columns of company info separated by orange rule
const FOOTER_LINE_H = 3.5;
const FOOTER_HEIGHT = FOOTER_LINE_H * 4 + 5;
const FOOTER_Y      = PAGE_HEIGHT - FOOTER_HEIGHT - 6; // orange line y

const COLOR_ORANGE     = [229, 83, 0]    as [number, number, number];
const COLOR_DARK       = [26, 26, 26]    as [number, number, number];
const COLOR_GRAY       = [100, 100, 100] as [number, number, number];
const COLOR_LIGHT_GRAY = [240, 240, 240] as [number, number, number];
const COLOR_WHITE      = [255, 255, 255] as [number, number, number];

// --- Helpers ------------------------------------------------------------------

function formatCurrencyEur(value: number | string): string {
  const n   = typeof value === "string" ? parseFloat(value) : value;
  const num = isNaN(n) ? 0 : n;
  const [intPart, decPart] = num.toFixed(2).split(".");
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decPart + " EUR";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("de-DE").format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function greetingPrefix(salutation: string | null | undefined, lastName: string): string {
  const sal = (salutation ?? "").toLowerCase().trim();
  if (sal === "herr") return `Sehr geehrter Herr ${lastName},`;
  if (sal === "frau") return `Sehr geehrte Frau ${lastName},`;
  return "Sehr geehrte Damen und Herren,";
}

// --- Header image + 4-column footer ------------------------------------------

async function addHeaderFooter(doc: jsPDF) {
  const c = company();

  // Briefkopf header image (full page width)
  const headerPath = process.env.COMPANY_HEADER_IMAGE ?? "";
  if (headerPath) {
    const base64 = await readImageAsBase64(headerPath);
    if (base64) {
      doc.addImage(base64, "JPEG", 0, 0, PAGE_WIDTH, HEADER_IMG_H);
    }
  }

  // Footer: orange rule + 4 columns
  doc.setDrawColor(...COLOR_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, FOOTER_Y, MARGIN + CONTENT_WIDTH, FOOTER_Y);

  const colW = CONTENT_WIDTH / 4;
  const y0   = FOOTER_Y + 3;
  const lh   = FOOTER_LINE_H;

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_DARK);

  // Col 1: address
  const x1 = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.text(c.name, x1, y0);
  doc.setFont("helvetica", "normal");
  if (c.contactPerson) doc.text(c.contactPerson,             x1, y0 + lh);
  if (c.street)        doc.text(c.street,                    x1, y0 + lh * 2);
  if (c.zip || c.city) doc.text(`${c.zip} ${c.city}`.trim(), x1, y0 + lh * 3);

  // Col 2: contact
  const x2 = MARGIN + colW;
  if (c.phone)   doc.text(`Tel: ${c.phone}`,        x2, y0);
  if (c.email)   doc.text(`E-Mail: ${c.email}`,     x2, y0 + lh);
  if (c.website) doc.text(`Internet: ${c.website}`, x2, y0 + lh * 2);

  // Col 3: bank
  const x3 = MARGIN + colW * 2;
  if (c.bankName)      doc.text(c.bankName,                          x3, y0);
  if (c.contactPerson) doc.text(`Kto Inh.: ${c.contactPerson}`,     x3, y0 + lh);
  if (c.iban)          doc.text(`IBAN: ${c.iban}`,                   x3, y0 + lh * 2);

  // Col 4: tax
  const x4 = MARGIN + colW * 3;
  if (c.taxId)     doc.text(`Steuer-Nr.: ${c.taxId}`,  x4, y0);
  if (c.vatId)     doc.text(`Ust-IdNr.: ${c.vatId}`,   x4, y0 + lh);
  if (c.finanzamt) doc.text(c.finanzamt,                x4, y0 + lh * 2);

  doc.setTextColor(...COLOR_DARK);
}

// --- Customer address (left column, DIN-5008 envelope window area) ------------

function addCustomerAddress(doc: jsPDF, customer: any | null | undefined): number {
  let y = TOP_PADDING;

  if (!customer) return y + 20;

  doc.setFontSize(10);
  doc.setTextColor(...COLOR_DARK);
  doc.setFont("helvetica", "normal");

  if (customer.salutation) { doc.text(customer.salutation,  MARGIN, y); y += 5; }
  if (customer.company)    { doc.text(customer.company,     MARGIN, y); y += 5; }
  const fullName = [customer.firstName, customer.name].filter(Boolean).join(" ");
  if (fullName)            { doc.text(fullName,             MARGIN, y); y += 5; }
  if (customer.street)     { doc.text(customer.street,      MARGIN, y); y += 5; }
  const zipCity = `${customer.zip ?? ""} ${customer.city ?? ""}`.trim();
  if (zipCity)             { doc.text(zipCity,              MARGIN, y); y += 5; }

  return y;
}

// --- Personalised greeting + intro text (for quotes) -------------------------

function addGreeting(doc: jsPDF, customer: any | null | undefined, y: number): number {
  const c         = company();
  const lastName  = customer?.name ?? "";
  const salutation = customer?.salutation ?? "";
  const greeting  = greetingPrefix(salutation, lastName);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_DARK);

  doc.text(greeting, MARGIN, y);
  y += 6;

  const line2 = `vielen Dank fuer Ihre Anfrage bei ${c.name}.`;
  doc.text(line2, MARGIN, y);
  y += 5.5;

  const person = c.contactPerson || c.name;
  const line3  = `Folgendes unverbindliches, freibleibendes Angebot wurde fuer Sie von ${person} bearbeitet und gesendet.`;
  const wrapped = doc.splitTextToSize(line3, CONTENT_WIDTH) as string[];
  doc.text(wrapped, MARGIN, y);
  y += wrapped.length * 5 + 4;

  return y;
}

// --- 3-column address block ---------------------------------------------------
// Rechnungsadresse | Lieferadresse | Auftragsdaten

function addThreeColumnAddressBlock(
  doc: jsPDF,
  customer: any | null | undefined,
  auftragsdaten: string[],
  y: number,
): number {
  const colW = CONTENT_WIDTH / 3;
  const x1   = MARGIN;
  const x2   = MARGIN + colW;
  const x3   = MARGIN + colW * 2;
  const lh   = 5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Rechnungsadresse:", x1, y);
  doc.text("Lieferadresse:",    x2, y);
  doc.text("Auftragsdaten:",    x3, y);

  let y1 = y + lh;
  let y2 = y + lh;
  let y3 = y + lh;

  doc.setFont("helvetica", "normal");

  if (customer) {
    const addrLines: string[] = [];
    const fullName = [customer.firstName, customer.name].filter(Boolean).join(" ");
    if (fullName)          addrLines.push(fullName);
    if (customer.company)  addrLines.push(customer.company);
    if (customer.street)   addrLines.push(customer.street);
    const zc = `${customer.zip ?? ""} ${customer.city ?? ""}`.trim();
    if (zc)                addrLines.push(zc);

    for (const line of addrLines) {
      doc.text(line, x1, y1); y1 += lh;
      doc.text(line, x2, y2); y2 += lh;
    }
  }

  for (const line of auftragsdaten) {
    doc.text(line, x3, y3);
    y3 += lh;
  }

  return Math.max(y1, y2, y3) + 4;
}

// --- 2-column items table (Produkte | Betrag zzgl. MwSt) ---------------------

function addItemsTable(doc: jsPDF, items: any[], startY: number): number {
  const tableData = items.map((item) => {
    let desc     = item.description ?? "";
    const qty    = parseFloat(item.quantity ?? 1);
    const unit   = (item.unit ?? "").trim();
    const uPrice = parseFloat(item.unitPrice ?? 0);

    if (qty !== 1 || unit) {
      const qtyStr = qty.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
      desc += `\n${qtyStr}${unit ? " " + unit : ""} x ${formatCurrencyEur(uPrice)}`;
    }

    return [desc, formatCurrencyEur(parseFloat(item.total ?? 0))];
  });

  autoTable(doc, {
    startY,
    head: [["Produkte", "Betrag zzgl. MwSt"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLOR_ORANGE,
      textColor: COLOR_WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLOR_DARK,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "right" },
    },
    alternateRowStyles: { fillColor: COLOR_LIGHT_GRAY },
    margin: { left: MARGIN, right: MARGIN },
  });

  return (doc as any).lastAutoTable.finalY as number;
}

// --- Totals block with footnote -----------------------------------------------

function addTotals(
  doc: jsPDF,
  y: number,
  vatRate: number,
  subtotal: number,
  vatAmount: number,
  total: number,
): number {
  const LABEL_X = PAGE_WIDTH - MARGIN - 74;
  const VALUE_X = PAGE_WIDTH - MARGIN;
  let curY = y + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_DARK);

  doc.text("Nettobetrag:", LABEL_X, curY);
  doc.text(formatCurrencyEur(subtotal), VALUE_X, curY, { align: "right" });
  curY += 6;

  if (vatRate > 0) {
    doc.text(`zzgl. ${vatRate}% MwSt:`, LABEL_X, curY);
    doc.text(formatCurrencyEur(vatAmount), VALUE_X, curY, { align: "right" });
    curY += 2;
  }

  doc.setDrawColor(...COLOR_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(LABEL_X - 5, curY, VALUE_X, curY);
  curY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_ORANGE);
  doc.text("Gesamtbetrag*:", LABEL_X, curY);
  doc.text(formatCurrencyEur(total), VALUE_X, curY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_DARK);
  curY += 8;

  if (vatRate > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_GRAY);
    doc.text(
      `* Gesamtbetrag enthaelt die gesetzliche MwSt. (entspricht ${formatCurrencyEur(vatAmount)}).`,
      MARGIN,
      curY,
    );
    curY += 5;
    doc.setTextColor(...COLOR_DARK);
  }

  return curY;
}

// --- Quote PDF ----------------------------------------------------------------

export async function generateQuotePdf(quote: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await addHeaderFooter(doc);
  const c = company();

  const addrEndY = addCustomerAddress(doc, quote.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Angebot", MARGIN, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAY);
  doc.text(`Datum: ${formatDate(quote.date)}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  doc.setTextColor(...COLOR_DARK);
  y += 10;

  y = addGreeting(doc, quote.customer, y);

  const auftragsdaten = [
    `Angebotsnummer: ${quote.quoteNumber ?? ""}`,
    `Angebotsdatum: ${formatDate(quote.date)}`,
    c.deliveryTime   ? `Lieferzeit: ${c.deliveryTime}`               : "",
    quote.validUntil ? `Gueltig bis: ${formatDate(quote.validUntil)}` : "",
  ].filter(Boolean);

  y = addThreeColumnAddressBlock(doc, quote.customer, auftragsdaten, y);
  y += 4;

  const tableEndY = addItemsTable(doc, quote.items ?? [], y);

  const vatRate   = parseFloat(quote.vatRate   ?? c.defaultVatRate);
  const subtotal  = parseFloat(quote.subtotal  ?? 0);
  const vatAmount = parseFloat(quote.vatAmount ?? 0);
  const total     = parseFloat(quote.total     ?? 0);
  let nextY = addTotals(doc, tableEndY, vatRate, subtotal, vatAmount, total);

  if (quote.notes) {
    nextY += 2;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Anmerkungen:", MARGIN, nextY);
    doc.setFont("helvetica", "normal");
    nextY += 5;
    doc.text(doc.splitTextToSize(quote.notes, CONTENT_WIDTH) as string[], MARGIN, nextY);
    nextY += 8;
  }

  if (quote.paymentTerms) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Zahlungsbedingungen:", MARGIN, nextY);
    doc.setFont("helvetica", "normal");
    nextY += 5;
    doc.text(doc.splitTextToSize(quote.paymentTerms, CONTENT_WIDTH) as string[], MARGIN, nextY);
    nextY += 8;
  }

  const closingY = Math.min(nextY + 8, FOOTER_Y - 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Mit freundlichen Gruessen,", MARGIN, closingY);
  doc.text(c.contactPerson || c.name, MARGIN, closingY + 6);

  return Buffer.from(doc.output("arraybuffer"));
}

// --- Invoice PDF --------------------------------------------------------------

export async function generateInvoicePdf(invoice: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await addHeaderFooter(doc);
  const c = company();

  const addrEndY = addCustomerAddress(doc, invoice.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Rechnung", MARGIN, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAY);
  doc.text(`Datum: ${formatDate(invoice.date)}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  doc.setTextColor(...COLOR_DARK);
  y += 10;

  const quoteRef = invoice.quoteNumber ?? invoice.quote?.quoteNumber ?? null;
  const auftragsdaten = [
    `Rechnungsnummer: ${invoice.invoiceNumber ?? ""}`,
    `Rechnungsdatum: ${formatDate(invoice.date)}`,
    invoice.dueDate ? `Zahlungsziel: ${formatDate(invoice.dueDate)}` : "",
    quoteRef        ? `Bezug: Angebot ${quoteRef}`                   : "",
    c.taxId         ? `Steuer-Nr.: ${c.taxId}`                       : "",
  ].filter(Boolean);

  y = addThreeColumnAddressBlock(doc, invoice.customer, auftragsdaten, y);
  y += 4;

  const tableEndY = addItemsTable(doc, invoice.items ?? [], y);

  const vatRate   = parseFloat(invoice.vatRate   ?? c.defaultVatRate);
  const subtotal  = parseFloat(invoice.subtotal  ?? 0);
  const vatAmount = parseFloat(invoice.vatAmount ?? 0);
  const total     = parseFloat(invoice.total     ?? 0);
  let nextY = addTotals(doc, tableEndY, vatRate, subtotal, vatAmount, total);

  if (invoice.notes) {
    nextY += 2;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Anmerkungen:", MARGIN, nextY);
    doc.setFont("helvetica", "normal");
    nextY += 5;
    doc.text(doc.splitTextToSize(invoice.notes, CONTENT_WIDTH) as string[], MARGIN, nextY);
    nextY += 8;
  }

  if (invoice.paymentTerms) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Zahlungsbedingungen:", MARGIN, nextY);
    doc.setFont("helvetica", "normal");
    nextY += 5;
    doc.text(doc.splitTextToSize(invoice.paymentTerms, CONTENT_WIDTH) as string[], MARGIN, nextY);
    nextY += 8;
  }

  const closingY = Math.min(nextY + 8, FOOTER_Y - 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Mit freundlichen Gruessen,", MARGIN, closingY);
  doc.text(c.contactPerson || c.name, MARGIN, closingY + 6);

  return Buffer.from(doc.output("arraybuffer"));
}

// --- Acceptance Protocol PDF --------------------------------------------------

export async function generateProtocolPdf(protocol: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await addHeaderFooter(doc);
  const c = company();

  const addrEndY = addCustomerAddress(doc, protocol.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Abnahmeprotokoll", MARGIN, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_GRAY);
  doc.text(`Datum: ${formatDate(protocol.date)}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  doc.setTextColor(...COLOR_DARK);
  y += 10;

  const invRef = protocol.invoiceNumber ?? protocol.invoice?.invoiceNumber ?? null;
  const qRef   = protocol.quoteNumber   ?? protocol.quote?.quoteNumber     ?? null;
  const auftragsdaten = [
    `Protokollnummer: ${protocol.protocolNumber ?? ""}`,
    `Datum: ${formatDate(protocol.date)}`,
    invRef            ? `Bezug: Rechnung ${invRef}` : (qRef ? `Bezug: Angebot ${qRef}` : ""),
    protocol.location ? `Ort: ${protocol.location}` : "",
  ].filter(Boolean);

  y = addThreeColumnAddressBlock(doc, protocol.customer, auftragsdaten, y);
  y += 4;

  const items = protocol.items ?? [];
  if (items.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Leistungsuebersicht", MARGIN, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Pos.", "Leistungsbeschreibung", "Erledigt", "Bemerkung"]],
      body: items.map((item: any) => [
        item.position,
        item.description,
        item.completed ? "Ja" : "Nein",
        item.notes ?? "",
      ]),
      theme: "grid",
      headStyles: { fillColor: COLOR_ORANGE, textColor: COLOR_WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: COLOR_DARK },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 40 },
      },
      alternateRowStyles: { fillColor: COLOR_LIGHT_GRAY },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = ((doc as any).lastAutoTable.finalY as number) + 8;
  }

  if (protocol.defects) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_ORANGE);
    doc.text("Maengel / Nachbesserungen:", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_DARK);
    y += 5;
    doc.text(doc.splitTextToSize(protocol.defects, CONTENT_WIDTH) as string[], MARGIN, y);
    y += 12;
  }

  if (protocol.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Anmerkungen:", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 5;
    doc.text(doc.splitTextToSize(protocol.notes, CONTENT_WIDTH) as string[], MARGIN, y);
    y += 12;
  }

  const sigY = Math.max(y + 10, FOOTER_Y - 30);
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY);
  doc.setDrawColor(...COLOR_DARK);
  doc.setLineWidth(0.3);

  const sig1X = MARGIN;
  const sig2X = PAGE_WIDTH / 2 + 10;
  const sigW  = PAGE_WIDTH / 2 - MARGIN - 10;

  doc.line(sig1X, sigY, sig1X + sigW, sigY);
  doc.text("Datum, Unterschrift Auftraggeber",  sig1X, sigY + 5);
  doc.line(sig2X, sigY, sig2X + sigW, sigY);
  doc.text("Datum, Unterschrift Auftragnehmer", sig2X, sigY + 5);

  return Buffer.from(doc.output("arraybuffer"));
}
