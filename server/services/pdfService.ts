// server/services/pdfService.ts
// Generates PDFs for AC Premium Bau.
// ALL text content comes from env vars -- nothing is hardcoded.

import { jsPDF } from "jspdf";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
const _require = createRequire(import.meta.url);
const autoTable = _require("jspdf-autotable").default ?? _require("jspdf-autotable");
import { readImageAsBase64 } from "./storageService.js";

// --- Lato font einbetten (einmalig beim Start) --------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR  = path.join(__dirname, "..", "fonts");

function loadFontBase64(filename: string): string {
  try {
    return readFileSync(path.join(FONTS_DIR, filename)).toString("base64");
  } catch {
    return "";
  }
}

const LATO_REGULAR_B64 = loadFontBase64("Lato-Regular.ttf");
const LATO_BOLD_B64    = loadFontBase64("Lato-Bold.ttf");

function registerLato(doc: jsPDF) {
  if (LATO_REGULAR_B64) {
    doc.addFileToVFS("Lato-Regular.ttf", LATO_REGULAR_B64);
    doc.addFont("Lato-Regular.ttf", "lato", "normal");
  }
  if (LATO_BOLD_B64) {
    doc.addFileToVFS("Lato-Bold.ttf", LATO_BOLD_B64);
    doc.addFont("Lato-Bold.ttf", "lato", "bold");
  }
}

const PDF_FONT = "helvetica"; // LATO_REGULAR_B64 ? "lato" : "helvetica";

// --- Env-based company config -------------------------------------------------
function company() {
  return {
    name:           process.env.COMPANY_NAME           ?? "",
    street:         process.env.COMPANY_STREET         ?? "",
    zip:            process.env.COMPANY_ZIP            ?? "",
    city:           process.env.COMPANY_CITY           ?? "",
    phone:          process.env.COMPANY_PHONE          ?? "",
    mobile:         process.env.COMPANY_MOBILE         ?? "",
    email:          process.env.COMPANY_EMAIL          ?? "",
    website:        process.env.COMPANY_WEBSITE        ?? "",
    officeStreet:   process.env.COMPANY_OFFICE_STREET  ?? "",
    officeZip:      process.env.COMPANY_OFFICE_ZIP     ?? "",
    officeCity:     process.env.COMPANY_OFFICE_CITY    ?? "",
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

// Logo: links oben, leicht transparent (DIN-5008 Briefkopf)
const LOGO_W       = 42;   // mm
const LOGO_H       = 22;   // mm  (Querformat ~1.9:1)
const LOGO_X       = MARGIN;
const LOGO_Y       = 6;
const LOGO_OPACITY = 1.0;  // vollständig sichtbar
// Trennlinie unter Briefkopf
const HEADER_LINE_Y = 36;  // mm ab Seitenanfang
const TOP_PADDING   = HEADER_LINE_Y + 16; // Kundenadresse ab hier

// Footer: 4 columns of company info separated by gold rule
const FOOTER_LINE_H = 3.5;
const FOOTER_HEIGHT = FOOTER_LINE_H * 4 + 5;
const FOOTER_Y      = PAGE_HEIGHT - FOOTER_HEIGHT - 6; // gold line y
const CONTENT_BOTTOM_Y = FOOTER_Y - 8;
const CONTINUATION_TOP_Y = TOP_PADDING;
const CONTINUATION_TITLE_Y = TOP_PADDING + 4;

// AC Premium Bau brand colors: #1a1a1a dark, #C8A96E gold, #555555 muted
const COLOR_ORANGE     = [200, 169, 110] as [number, number, number]; // #C8A96E Gold (alias kept for compatibility)
const COLOR_DARK       = [26, 26, 26]    as [number, number, number]; // #1a1a1a
const COLOR_GRAY       = [85, 85, 85]    as [number, number, number]; // #555555
const COLOR_LIGHT_GRAY = [240, 240, 240] as [number, number, number];
const COLOR_WHITE      = [255, 255, 255] as [number, number, number];

type TableLayout = {
  headerHeight: number;
  headerGap: number;
  headerFontSize: number;
  titleFontSize: number;
  titleLineHeight: number;
  titleAfterGap: number;
  manufacturerFontSize: number;
  manufacturerHeight: number;
  infoFontSize: number;
  infoLineHeight: number;
  infoParagraphGap: number;
  infoAfterGap: number;
  detailFontSize: number;
  detailLineHeight: number;
  detailAfterGap: number;
  qtyFontSize: number;
  qtyLineHeight: number;
  qtyAfterGap: number;
  separatorHeight: number;
};

type QuoteLayout = {
  titleFontSize: number;
  metaFontSize: number;
  greetingFontSize: number;
  greetingLineGap: number;
  greetingParagraphGap: number;
  greetingWrapLineHeight: number;
  addressLabelFontSize: number;
  addressBodyFontSize: number;
  addressLineHeight: number;
  addressBottomGap: number;
  labeledTextFontSize: number;
  labeledTextLineHeight: number;
  closingFontSize: number;
  closingLineHeight: number;
  totalsBodyFontSize: number;
  totalsTotalFontSize: number;
  totalsStartGap: number;
  totalsRowGap: number;
  totalsVatGap: number;
  totalsDividerGap: number;
  totalsAfterGap: number;
  table: TableLayout;
};

const NORMAL_QUOTE_LAYOUT: QuoteLayout = {
  titleFontSize: 22,
  metaFontSize: 10,
  greetingFontSize: 10,
  greetingLineGap: 6,
  greetingParagraphGap: 5.5,
  greetingWrapLineHeight: 5,
  addressLabelFontSize: 8.5,
  addressBodyFontSize: 8.5,
  addressLineHeight: 5,
  addressBottomGap: 4,
  labeledTextFontSize: 8.5,
  labeledTextLineHeight: 4,
  closingFontSize: 7.6,
  closingLineHeight: 3.5,
  totalsBodyFontSize: 9,
  totalsTotalFontSize: 11,
  totalsStartGap: 6,
  totalsRowGap: 6,
  totalsVatGap: 2,
  totalsDividerGap: 5,
  totalsAfterGap: 10,
  table: {
    headerHeight: 8,
    headerGap: 4,
    headerFontSize: 8.8,
    titleFontSize: 9.2,
    titleLineHeight: 4.2,
    titleAfterGap: 0.6,
    manufacturerFontSize: 6.6,
    manufacturerHeight: 3.6,
    infoFontSize: 7.5,
    infoLineHeight: 3.7,
    infoParagraphGap: 2.4,
    infoAfterGap: 1,
    detailFontSize: 7.9,
    detailLineHeight: 3.9,
    detailAfterGap: 0.6,
    qtyFontSize: 7.9,
    qtyLineHeight: 3.8,
    qtyAfterGap: 2.4,
    separatorHeight: 5,
  },
};

const COMPACT_QUOTE_LAYOUT: QuoteLayout = {
  titleFontSize: 20,
  metaFontSize: 9,
  greetingFontSize: 9,
  greetingLineGap: 5,
  greetingParagraphGap: 4.6,
  greetingWrapLineHeight: 4.2,
  addressLabelFontSize: 8,
  addressBodyFontSize: 8,
  addressLineHeight: 4.25,
  addressBottomGap: 2.8,
  labeledTextFontSize: 8,
  labeledTextLineHeight: 3.6,
  closingFontSize: 7.1,
  closingLineHeight: 3.15,
  totalsBodyFontSize: 8.3,
  totalsTotalFontSize: 10,
  totalsStartGap: 5,
  totalsRowGap: 5,
  totalsVatGap: 1.5,
  totalsDividerGap: 4,
  totalsAfterGap: 8,
  table: {
    headerHeight: 7.2,
    headerGap: 3,
    headerFontSize: 8.1,
    titleFontSize: 8.5,
    titleLineHeight: 3.7,
    titleAfterGap: 0.4,
    manufacturerFontSize: 6.1,
    manufacturerHeight: 3.1,
    infoFontSize: 7,
    infoLineHeight: 3.25,
    infoParagraphGap: 1.8,
    infoAfterGap: 0.8,
    detailFontSize: 7.2,
    detailLineHeight: 3.45,
    detailAfterGap: 0.45,
    qtyFontSize: 7.2,
    qtyLineHeight: 3.35,
    qtyAfterGap: 1.9,
    separatorHeight: 4,
  },
};

const TIGHT_QUOTE_LAYOUT: QuoteLayout = {
  titleFontSize: 18,
  metaFontSize: 8.4,
  greetingFontSize: 8.3,
  greetingLineGap: 4.4,
  greetingParagraphGap: 4,
  greetingWrapLineHeight: 3.75,
  addressLabelFontSize: 7.5,
  addressBodyFontSize: 7.5,
  addressLineHeight: 3.9,
  addressBottomGap: 1.8,
  labeledTextFontSize: 7.6,
  labeledTextLineHeight: 3.35,
  closingFontSize: 6.7,
  closingLineHeight: 2.95,
  totalsBodyFontSize: 7.9,
  totalsTotalFontSize: 9.3,
  totalsStartGap: 4.2,
  totalsRowGap: 4.3,
  totalsVatGap: 1.2,
  totalsDividerGap: 3.5,
  totalsAfterGap: 6.5,
  table: {
    headerHeight: 6.6,
    headerGap: 2.2,
    headerFontSize: 7.6,
    titleFontSize: 8,
    titleLineHeight: 3.35,
    titleAfterGap: 0.3,
    manufacturerFontSize: 5.8,
    manufacturerHeight: 2.7,
    infoFontSize: 6.6,
    infoLineHeight: 3,
    infoParagraphGap: 1.4,
    infoAfterGap: 0.55,
    detailFontSize: 6.8,
    detailLineHeight: 3.05,
    detailAfterGap: 0.35,
    qtyFontSize: 6.8,
    qtyLineHeight: 3,
    qtyAfterGap: 1.4,
    separatorHeight: 3.2,
  },
};

// --- Helpers ------------------------------------------------------------------

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&euro;': '€',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  
  // Decode numeric entities like &#160; or &#xA0;
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

function formatCurrencyEur(value: number | string): string {
  const n   = typeof value === "string" ? parseFloat(value) : value;
  const num = isNaN(n) ? 0 : n;
  const [intPart, decPart] = num.toFixed(2).split(".");
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decPart + " EUR";
}

function formatCurrencyEuroSign(value: number | string): string {
  const n   = typeof value === "string" ? parseFloat(value) : value;
  const num = isNaN(n) ? 0 : n;
  const [intPart, decPart] = num.toFixed(2).split(".");
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decPart + " €";
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

// --- Gezeichnete Kontakt-Icons (orange Kreis + weißes Symbol) ----------------

const ICON_R = 2.9; // Kreis-Radius mm

function drawIconCircle(doc: jsPDF, cx: number, cy: number) {
  doc.setFillColor(...COLOR_ORANGE);
  doc.setDrawColor(...COLOR_ORANGE);
  doc.circle(cx, cy, ICON_R, "F");
}

/**
 * Telefon-Icon: klassischer vertikaler Hörer —
 * breite Ohrmuschel (oben) + schmaler Griff (Mitte) + breite Sprechmuschel (unten)
 * alle Teile als weiße roundedRect, klar als Telefon erkennbar
 */
function drawPhoneIcon(doc: jsPDF, cx: number, cy: number) {
  drawIconCircle(doc, cx, cy);
  doc.setDrawColor(...COLOR_WHITE);
  doc.setFillColor(...COLOR_WHITE);
  doc.setLineWidth(0.2);

  // Äußerer Rahmen des Smartphones (Outline)
  doc.roundedRect(cx - 0.6, cy - 1.1, 1.2, 2.2, 0.2, 0.2, "S");

  // Lautsprecher-Schlitz oben
  doc.line(cx - 0.2, cy - 0.7, cx + 0.2, cy - 0.7);

  // Kleiner Home-Button/Kamera-Punkt unten
  doc.circle(cx, cy + 0.7, 0.15, "F");
}

/**
 * E-Mail-Icon: Umschlag-Rechteck + Klappen-Diagonalen
 */
function drawEmailIcon(doc: jsPDF, cx: number, cy: number) {
  drawIconCircle(doc, cx, cy);
  doc.setDrawColor(...COLOR_WHITE);
  doc.setLineWidth(0.45);
  const w = 3.5; const h = 2.2;
  const x0 = cx - w / 2; const y0 = cy - h / 2;
  // Umschlag-Rahmen
  doc.rect(x0, y0, w, h, "S");
  // Klappen-V von oben-links und oben-rechts zur Mitte
  doc.line(x0,     y0, cx, cy + 0.25);
  doc.line(x0 + w, y0, cx, cy + 0.25);
}

/**
 * Globus-Icon: Kreis + Äquator + senkrechter Meridian + Längengrad-Ellipse
 */
function drawGlobeIcon(doc: jsPDF, cx: number, cy: number) {
  drawIconCircle(doc, cx, cy);
  doc.setDrawColor(...COLOR_WHITE);
  doc.setLineWidth(0.4);
  // Äußerer Globus-Kreis
  doc.circle(cx, cy, 2.0, "S");
  // Äquator
  doc.line(cx - 2.0, cy, cx + 2.0, cy);
  // Meridian
  doc.line(cx, cy - 2.0, cx, cy + 2.0);
  // Längengrad-Ellipse (Ost-West-Kurve)
  doc.ellipse(cx, cy, 1.0, 2.0, "S");
}

// --- Header image + 4-column footer ------------------------------------------

async function addHeaderFooter(doc: jsPDF) {
  const c = company();

  // --- Logo: links oben, leicht transparent (Wasserzeichen-Effekt) ----------
  const headerPath = process.env.COMPANY_HEADER_IMAGE ?? "";
  if (headerPath) {
    const base64 = await readImageAsBase64(headerPath);
    if (base64) {
      const ext    = headerPath.split(".").pop()?.toLowerCase() ?? "jpeg";
      const format = ext === "png" ? "PNG" : "JPEG";
      // Weißer Hintergrund hinter Logo (verhindert graue Artefakte bei PNGs ohne Transparenz)
      doc.setFillColor(255, 255, 255);
      doc.rect(LOGO_X, LOGO_Y, LOGO_W, LOGO_H, "F");
      doc.saveGraphicsState();
      // @ts-ignore — jsPDF GState ist vorhanden, aber nicht immer korrekt typisiert
      doc.setGState(new (doc as any).GState({ opacity: LOGO_OPACITY }));
      doc.addImage(base64, format, LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
      doc.restoreGraphicsState();
    }
  }

  // --- Firmenblock rechts oben (rechtsbündig) --------------------------------
  const rightX = PAGE_WIDTH - MARGIN;
  let fy = LOGO_Y + 3;
  doc.setFontSize(10);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text(c.name, rightX, fy, { align: "right" });
  fy += 5.5;
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9);
  if (c.contactPerson) { doc.text(c.contactPerson,             rightX, fy, { align: "right" }); fy += 5; }
  if (c.street)        { doc.text(c.street,                    rightX, fy, { align: "right" }); fy += 5; }
  if (c.zip || c.city) { doc.text(`${c.zip} ${c.city}`.trim(), rightX, fy, { align: "right" }); }

  // --- Horizontale Trennlinie ------------------------------------------------
  doc.setDrawColor(...COLOR_DARK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, HEADER_LINE_Y, PAGE_WIDTH - MARGIN, HEADER_LINE_Y);

  // --- Kontaktblock rechts (unter Linie) mit gezeichneten Icons + Links -----
  const iconR  = 2.8;                         // Kreis-Radius mm
  const contactRightX = PAGE_WIDTH - MARGIN - 3;
  const iconCX = contactRightX;               // leicht nach links versetzt gegen Abschneiden
  const textRX = iconCX - iconR * 2 - 1.5;   // Text endet links vom Icon
  let cy = HEADER_LINE_Y + 5.5;
  const clh = 6.5;
  doc.setFontSize(8.1);
  doc.setTextColor(...COLOR_DARK);
  doc.setFont(PDF_FONT, "normal");

  if (c.phone || c.mobile) {
    const tel = c.phone || c.mobile;
    doc.text(tel!, textRX, cy, { align: "right" });
    drawPhoneIcon(doc, iconCX - iconR, cy - iconR * 0.4);
    // Klickbarer Link über Icon + Text
    const telClean = (tel ?? "").replace(/\s/g, "");
    doc.link(textRX - 40, cy - 3.5, 44 + iconR * 2, 5.5, { url: `tel:${telClean}` });
    cy += clh;
  }
  if (c.email) {
    doc.text(c.email, textRX, cy, { align: "right" });
    drawEmailIcon(doc, iconCX - iconR, cy - iconR * 0.4);
    doc.link(textRX - 40, cy - 3.5, 44 + iconR * 2, 5.5, { url: `mailto:${c.email}` });
    cy += clh;
  }
  if (c.website) {
    doc.text(c.website, textRX, cy, { align: "right" });
    drawGlobeIcon(doc, iconCX - iconR, cy - iconR * 0.4);
    const url = c.website.startsWith("http") ? c.website : `https://${c.website}`;
    doc.link(textRX - 40, cy - 3.5, 44 + iconR * 2, 5.5, { url });
  }

  // --- Footer: Trennlinie + 4 Spalten ---------------------------------------
  doc.setDrawColor(...COLOR_ORANGE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, FOOTER_Y, MARGIN + CONTENT_WIDTH, FOOTER_Y);

  const colW = CONTENT_WIDTH / 4;
  const y0   = FOOTER_Y + 3;
  const lh   = FOOTER_LINE_H;

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_DARK);

  // Col 1: Hauptadresse
  const x1 = MARGIN;
  doc.setFont(PDF_FONT, "bold");
  doc.text(c.name, x1, y0);
  doc.setFont(PDF_FONT, "normal");
  if (c.contactPerson) doc.text(c.contactPerson,             x1, y0 + lh);
  if (c.street)        doc.text(c.street,                    x1, y0 + lh * 2);
  if (c.zip || c.city) doc.text(`${c.zip} ${c.city}`.trim(), x1, y0 + lh * 3);

  // Col 2: Kontakt
  const x2 = MARGIN + colW;
  let c2row = 0;
  if (c.phone)   { doc.text(`Tel: ${c.phone}`,        x2, y0 + lh * c2row); c2row++; }
  if (c.mobile)  { doc.text(`Mobil: ${c.mobile}`,     x2, y0 + lh * c2row); c2row++; }
  if (c.email)   { doc.text(`E-Mail: ${c.email}`,     x2, y0 + lh * c2row); c2row++; }
  if (c.website) { doc.text(`Web: ${c.website}`,      x2, y0 + lh * c2row); }

  // Col 3: Bankverbindung
  const x3 = MARGIN + colW * 2;
  if (c.bankName)      doc.text(c.bankName,                         x3, y0);
  if (c.contactPerson) doc.text(`Konto Inh.: ${c.contactPerson}`,  x3, y0 + lh);
  if (c.iban)          doc.text(`IBAN: ${c.iban}`,                  x3, y0 + lh * 2);
  if (c.bic)           doc.text(`BIC: ${c.bic}`,                    x3, y0 + lh * 3);

  // Col 4: Steuerdaten
  const x4 = MARGIN + colW * 3;
  if (c.taxId)     doc.text(`Steuer-Nr.: ${c.taxId}`, x4, y0);
  if (c.vatId)     doc.text(`Ust-IdNr.: ${c.vatId}`,  x4, y0 + lh);
  if (c.finanzamt) doc.text(c.finanzamt,               x4, y0 + lh * 2);

  doc.setTextColor(...COLOR_DARK);
}

// --- Customer address (left column, DIN-5008 envelope window area) ------------

function addCustomerAddress(doc: jsPDF, customer: any | null | undefined): number {
  let y = TOP_PADDING;

  if (!customer) return y + 20;

  doc.setFontSize(10);
  doc.setTextColor(...COLOR_DARK);
  doc.setFont(PDF_FONT, "normal");

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

function getGreetingContent(customer: any | null | undefined) {
  const c = company();
  const lastName = customer?.name ?? "";
  const salutation = customer?.salutation ?? "";
  const greeting = greetingPrefix(salutation, lastName);
  const person = c.contactPerson || c.name;

  return {
    greeting,
    line2: `vielen Dank für Ihre Anfrage bei ${c.name}.`,
    line3: `Folgendes unverbindliches, freibleibendes Angebot wurde für Sie von ${person} bearbeitet und gesendet.`,
  };
}

function getGreetingHeight(doc: jsPDF, customer: any | null | undefined, layout: QuoteLayout): number {
  const { line3 } = getGreetingContent(customer);
  doc.setFontSize(layout.greetingFontSize);
  const wrapped = doc.splitTextToSize(line3, CONTENT_WIDTH) as string[];
  return layout.greetingLineGap + layout.greetingParagraphGap + wrapped.length * layout.greetingWrapLineHeight + 4;
}

function addGreeting(doc: jsPDF, customer: any | null | undefined, y: number, layout: QuoteLayout = NORMAL_QUOTE_LAYOUT): number {
  const { greeting, line2, line3 } = getGreetingContent(customer);

  doc.setFontSize(layout.greetingFontSize);
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_DARK);

  doc.text(greeting, MARGIN, y);
  y += layout.greetingLineGap;

  doc.text(line2, MARGIN, y);
  y += layout.greetingParagraphGap;

  const wrapped = doc.splitTextToSize(line3, CONTENT_WIDTH) as string[];
  for (let i = 0; i < wrapped.length; i += 1) {
    doc.text(wrapped[i], MARGIN, y + i * layout.greetingWrapLineHeight);
  }
  y += wrapped.length * layout.greetingWrapLineHeight + 4;

  return y;
}

// --- 3-column address block ---------------------------------------------------
// Rechnungsadresse | Lieferadresse | Auftragsdaten

function getAddressBlockLines(
  customer: any | null | undefined,
  auftragsdaten: string[],
  billing?: { name?: string | null; street?: string | null; zip?: string | null; city?: string | null } | null,
) {
  const deliveryLines: string[] = [];
  if (customer) {
    const fullName = [customer.firstName, customer.name].filter(Boolean).join(" ");
    if (fullName) deliveryLines.push(fullName);
    if (customer.company) deliveryLines.push(customer.company);
    if (customer.street) deliveryLines.push(customer.street);
    const zc = `${customer.zip ?? ""} ${customer.city ?? ""}`.trim();
    if (zc) deliveryLines.push(zc);
  }

  const billingLines: string[] = [];
  if (billing?.name || billing?.street || billing?.zip || billing?.city) {
    if (billing.name) billingLines.push(billing.name);
    if (billing.street) billingLines.push(billing.street);
    const zc = `${billing.zip ?? ""} ${billing.city ?? ""}`.trim();
    if (zc) billingLines.push(zc);
  } else {
    billingLines.push(...deliveryLines);
  }

  return { billingLines, deliveryLines, auftragsdatenLines: auftragsdaten };
}

function getThreeColumnAddressBlockHeight(
  customer: any | null | undefined,
  auftragsdaten: string[],
  billing?: { name?: string | null; street?: string | null; zip?: string | null; city?: string | null } | null,
  layout: QuoteLayout = NORMAL_QUOTE_LAYOUT,
): number {
  const { billingLines, deliveryLines, auftragsdatenLines } = getAddressBlockLines(customer, auftragsdaten, billing);
  const maxLines = Math.max(billingLines.length, deliveryLines.length, auftragsdatenLines.length, 0);
  return layout.addressLineHeight + maxLines * layout.addressLineHeight + layout.addressBottomGap;
}

function addThreeColumnAddressBlock(
  doc: jsPDF,
  customer: any | null | undefined,
  auftragsdaten: string[],
  y: number,
  billing?: { name?: string | null; street?: string | null; zip?: string | null; city?: string | null } | null,
  layout: QuoteLayout = NORMAL_QUOTE_LAYOUT,
): number {
  const colW = CONTENT_WIDTH / 3;
  const x1 = MARGIN;
  const x2 = MARGIN + colW;
  const x3 = MARGIN + colW * 2;
  const lh = layout.addressLineHeight;

  doc.setFontSize(layout.addressLabelFontSize);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(...COLOR_DARK);

  const labelLineY = y + 0.8;
  const labelLineW = 0.25;
  doc.setLineWidth(labelLineW);
  doc.setDrawColor(...COLOR_DARK);

  doc.text("Rechnungsadresse:", x1, y);
  doc.line(x1, labelLineY, x1 + doc.getTextWidth("Rechnungsadresse:"), labelLineY);

  doc.text("Lieferadresse:", x2, y);
  doc.line(x2, labelLineY, x2 + doc.getTextWidth("Lieferadresse:"), labelLineY);

  doc.text("Auftragsdaten:", x3, y);
  doc.line(x3, labelLineY, x3 + doc.getTextWidth("Auftragsdaten:"), labelLineY);

  let y1 = y + lh;
  let y2 = y + lh;
  let y3 = y + lh;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(layout.addressBodyFontSize);

  const { billingLines, deliveryLines, auftragsdatenLines } = getAddressBlockLines(customer, auftragsdaten, billing);

  for (const line of billingLines) { doc.text(line, x1, y1); y1 += lh; }
  for (const line of deliveryLines) { doc.text(line, x2, y2); y2 += lh; }
  for (const line of auftragsdatenLines) { doc.text(line, x3, y3); y3 += lh; }

  return Math.max(y1, y2, y3) + layout.addressBottomGap;
}

// --- Produktblöcke statt Rastertabelle --------------------------------------

function addContinuationTitle(doc: jsPDF, title: string | undefined) {
  if (!title) return;
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`${title} – Fortsetzung`, MARGIN, CONTINUATION_TITLE_Y);
  doc.setFont(PDF_FONT, "normal");
}

async function ensurePageSpace(doc: jsPDF, currentY: number, requiredHeight: number, continuationTitle?: string): Promise<number> {
  if (currentY + requiredHeight <= CONTENT_BOTTOM_Y) return currentY;
  doc.addPage();
  registerLato(doc);
  await addHeaderFooter(doc);
  addContinuationTitle(doc, continuationTitle);
  return continuationTitle ? CONTINUATION_TITLE_Y + 8 : CONTINUATION_TOP_Y;
}

async function addLabeledTextBlock(
  doc: jsPDF,
  label: string,
  text: string,
  startY: number,
  options?: { fontSize?: number; lineHeight?: number; gapBefore?: number; continuationTitle?: string; maxWidth?: number },
): Promise<number> {
  const fontSize = options?.fontSize ?? 8.5;
  const lineHeight = options?.lineHeight ?? 4;
  const gapBefore = options?.gapBefore ?? 2;
  const continuationTitle = options?.continuationTitle;
  const maxWidth = options?.maxWidth ?? CONTENT_WIDTH;
  const wrappedLines = doc.splitTextToSize(text, maxWidth) as string[];

  let y = await ensurePageSpace(doc, startY + gapBefore, 10 + Math.min(wrappedLines.length, 1) * lineHeight, continuationTitle);
  doc.setFontSize(fontSize);
  doc.setFont(PDF_FONT, "bold");
  doc.text(label, MARGIN, y);
  y += 5;

  doc.setFont(PDF_FONT, "normal");
  for (const line of wrappedLines) {
    y = await ensurePageSpace(doc, y, lineHeight + 1, continuationTitle);
    doc.text(line, MARGIN, y);
    y += lineHeight;
  }

  return y + 3;
}

function addPageNumbers(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_GRAY);
    doc.text(`Seite ${page}/${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: "right" });
  }

  doc.setTextColor(...COLOR_DARK);
}

function getWrappedTextHeight(lineCount: number, lineHeight: number, extraAfter = 0): number {
  if (lineCount <= 0) return extraAfter;
  return lineCount * lineHeight + extraAfter;
}

function getLabeledTextBlockHeight(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  options?: { lineHeight?: number; gapBefore?: number },
): number {
  const lineHeight = options?.lineHeight ?? 4;
  const gapBefore = options?.gapBefore ?? 2;
  const wrappedLines = doc.splitTextToSize(text, maxWidth) as string[];
  return gapBefore + 5 + getWrappedTextHeight(wrappedLines.length, lineHeight, 3);
}

function getItemTableParts(doc: jsPDF, item: any, textMaxWidth: number) {
  const qty = parseFloat(item.quantity ?? 1);
  const unit = (item.unit ?? "").trim();
  const unitPrice = parseFloat(item.unitPrice ?? 0);
  const total = parseFloat(item.total ?? 0);
  const lines = String(item.description ?? "")
    .split(/\r?\n/)
    .map((line) => decodeHtmlEntities(line.trim()))
    .filter(Boolean);

  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? "";
  const firstLineIsArticleNumber = /^\[[^\]]+\]$/.test(firstLine);
  const title = (firstLineIsArticleNumber ? secondLine : firstLine) || "Position";
  const detailLines = firstLineIsArticleNumber
    ? [firstLine, ...lines.slice(2)]
    : lines.slice(1);
  const manufacturer = decodeHtmlEntities(String(item.manufacturer ?? "").trim());
  const manufacturerLabel = manufacturer ? `AC-${manufacturer}` : "";
  const productInfoText = decodeHtmlEntities(String(item.productInfoText ?? "").trim());
  const productDescription = decodeHtmlEntities(String(item.productDescription ?? "").trim());
  const productDescLines = productDescription
    ? productDescription
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .flatMap((l) => doc.splitTextToSize(l, textMaxWidth) as string[])
    : [];
  const productInfoParagraphs = productInfoText
    ? productInfoText
        .split(/\r?\n\s*\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) =>
          paragraph
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .flatMap((line) => doc.splitTextToSize(line, textMaxWidth) as string[])
        )
        .filter((paragraphLines) => paragraphLines.length > 0)
    : [];
  const qtyLine = `${qty.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ""} x ${formatCurrencyEur(unitPrice)}`;

  return {
    total,
    manufacturerLabel,
    productDescLines,
    productInfoParagraphs,
    wrappedTitle: doc.splitTextToSize(title, textMaxWidth) as string[],
    wrappedDetails: detailLines.map((detailLine) => doc.splitTextToSize(detailLine.replace(/^[•\-\*]\s*/, ""), textMaxWidth) as string[]),
    wrappedQty: doc.splitTextToSize(qtyLine, textMaxWidth) as string[],
  };
}

function getItemRowHeight(parts: ReturnType<typeof getItemTableParts>, tableLayout: TableLayout): number {
  let rowHeight = parts.wrappedTitle.length * tableLayout.titleLineHeight + tableLayout.titleAfterGap;
  if (parts.manufacturerLabel) rowHeight += tableLayout.manufacturerHeight;
  if (parts.productDescLines.length > 0) rowHeight += parts.productDescLines.length * tableLayout.detailLineHeight + tableLayout.detailAfterGap;
  rowHeight += parts.productInfoParagraphs.reduce((sum, paragraphLines, paragraphIndex) => {
    const paragraphHeight = paragraphLines.length * tableLayout.infoLineHeight;
    const paragraphGap = paragraphIndex < parts.productInfoParagraphs.length - 1 ? tableLayout.infoParagraphGap : 0;
    return sum + paragraphHeight + paragraphGap;
  }, 0);
  if (parts.productInfoParagraphs.length > 0) rowHeight += tableLayout.infoAfterGap;
  rowHeight += parts.wrappedDetails.reduce((sum, linesForDetail) => sum + linesForDetail.length * tableLayout.detailLineHeight + tableLayout.detailAfterGap, 0);
  rowHeight += parts.wrappedQty.length * tableLayout.qtyLineHeight + tableLayout.qtyAfterGap;
  return rowHeight;
}

function getItemsTableHeight(doc: jsPDF, items: any[], tableLayout: TableLayout): number {
  const priceColW = 40;
  const textMaxWidth = CONTENT_WIDTH - priceColW - 12;
  let height = tableLayout.headerHeight + tableLayout.headerGap;

  for (let index = 0; index < items.length; index += 1) {
    const parts = getItemTableParts(doc, items[index], textMaxWidth);
    if (index > 0) height += tableLayout.separatorHeight;
    height += getItemRowHeight(parts, tableLayout);
  }

  return height;
}

async function addItemsTable(
  doc: jsPDF,
  items: any[],
  startY: number,
  continuationTitle?: string,
  reservedHeightAfterLastItem = 0,
  tableLayout: TableLayout = NORMAL_QUOTE_LAYOUT.table,
): Promise<number> {
  const headerHeight = tableLayout.headerHeight;
  const priceColW = 40;
  const leftX = MARGIN;
  const rightX = PAGE_WIDTH - MARGIN;
  const contentX = leftX + 3;
  const priceX = rightX - 2;
  const textMaxWidth = CONTENT_WIDTH - priceColW - 12;
  let y = startY;

  const drawTableHeader = () => {
    doc.setFillColor(...COLOR_ORANGE);
    doc.rect(leftX, y, CONTENT_WIDTH, headerHeight, "F");
    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(tableLayout.headerFontSize);
    doc.setTextColor(...COLOR_WHITE);
    doc.text("Produkte", contentX, y + headerHeight - 2.8);
    doc.text("Betrag zzgl. MwSt", priceX, y + headerHeight - 2.8, { align: "right" });
    y += headerHeight + tableLayout.headerGap;
  };

  y = await ensurePageSpace(doc, y, headerHeight + 12, continuationTitle);
  drawTableHeader();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const parts = getItemTableParts(doc, item, textMaxWidth);
    let shouldDrawSeparator = index > 0;
    const separatorHeight = shouldDrawSeparator ? tableLayout.separatorHeight : 0;
    const isLastItem = index === items.length - 1;
    const rowHeight = getItemRowHeight(parts, tableLayout);
    const requiredHeight = separatorHeight + rowHeight + (isLastItem ? reservedHeightAfterLastItem : 0);

    if (y + requiredHeight > CONTENT_BOTTOM_Y) {
      doc.addPage();
      registerLato(doc);
      await addHeaderFooter(doc);
      addContinuationTitle(doc, continuationTitle);
      y = continuationTitle ? CONTINUATION_TITLE_Y + 8 : CONTINUATION_TOP_Y;
      drawTableHeader();
      shouldDrawSeparator = false;
    }

    if (shouldDrawSeparator) {
      doc.setDrawColor(...COLOR_LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.line(leftX, y, rightX, y);
      y += 5;
    }

    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(tableLayout.titleFontSize);
    doc.setTextColor(...COLOR_DARK);
    for (let i = 0; i < parts.wrappedTitle.length; i += 1) {
      doc.text(parts.wrappedTitle[i], contentX, y + tableLayout.titleLineHeight + i * tableLayout.titleLineHeight);
    }
    doc.text(formatCurrencyEur(parts.total), priceX, y + tableLayout.titleLineHeight, { align: "right" });

    y += parts.wrappedTitle.length * tableLayout.titleLineHeight + tableLayout.titleAfterGap;

    if (parts.manufacturerLabel) {
      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(tableLayout.manufacturerFontSize);
      doc.setTextColor(...COLOR_GRAY);
      doc.text(parts.manufacturerLabel, contentX, y + 2.1);
      y += tableLayout.manufacturerHeight;
    }

    if (parts.productDescLines.length > 0) {
      doc.setFont(PDF_FONT, "italic");
      doc.setFontSize(tableLayout.detailFontSize);
      doc.setTextColor(...COLOR_GRAY);
      for (let i = 0; i < parts.productDescLines.length; i += 1) {
        doc.text(parts.productDescLines[i], contentX, y + tableLayout.detailLineHeight - 0.4 + i * tableLayout.detailLineHeight);
      }
      y += parts.productDescLines.length * tableLayout.detailLineHeight + tableLayout.detailAfterGap;
    }

    if (parts.productInfoParagraphs.length > 0) {
      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(tableLayout.infoFontSize);
      doc.setTextColor(...COLOR_GRAY);

      for (let paragraphIndex = 0; paragraphIndex < parts.productInfoParagraphs.length; paragraphIndex += 1) {
        const paragraphLines = parts.productInfoParagraphs[paragraphIndex];
        for (let lineIndex = 0; lineIndex < paragraphLines.length; lineIndex += 1) {
          doc.text(paragraphLines[lineIndex], contentX, y + tableLayout.infoLineHeight - 0.4 + lineIndex * tableLayout.infoLineHeight);
        }
        y += paragraphLines.length * tableLayout.infoLineHeight;
        if (paragraphIndex < parts.productInfoParagraphs.length - 1) {
          y += tableLayout.infoParagraphGap;
        }
      }

      y += tableLayout.infoAfterGap;
    }

    if (parts.wrappedDetails.length > 0) {
      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(tableLayout.detailFontSize);
      doc.setTextColor(...COLOR_GRAY);

      for (const wrappedDetail of parts.wrappedDetails) {
        for (let i = 0; i < wrappedDetail.length; i += 1) {
          doc.text(wrappedDetail[i], contentX, y + tableLayout.detailLineHeight - 0.4 + i * tableLayout.detailLineHeight);
        }
        y += wrappedDetail.length * tableLayout.detailLineHeight + tableLayout.detailAfterGap;
      }
    }

    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(tableLayout.qtyFontSize);
    doc.setTextColor(...COLOR_GRAY);
    for (let i = 0; i < parts.wrappedQty.length; i += 1) {
      doc.text(parts.wrappedQty[i], contentX, y + tableLayout.qtyLineHeight - 0.3 + i * tableLayout.qtyLineHeight);
    }
    y += parts.wrappedQty.length * tableLayout.qtyLineHeight + tableLayout.qtyAfterGap;
  }

  doc.setTextColor(...COLOR_DARK);
  return y;
}

// --- Totals block with footnote -----------------------------------------------

function addTotals(
  doc: jsPDF,
  y: number,
  vatRate: number,
  subtotal: number,
  vatAmount: number,
  total: number,
  layout: QuoteLayout = NORMAL_QUOTE_LAYOUT,
): number {
  const BLOCK_SHIFT_LEFT = 2;
  const LABEL_X = PAGE_WIDTH - MARGIN - 74 - BLOCK_SHIFT_LEFT;
  const VALUE_X = PAGE_WIDTH - MARGIN - BLOCK_SHIFT_LEFT;
  let curY = y + layout.totalsStartGap;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(layout.totalsBodyFontSize);
  doc.setTextColor(...COLOR_DARK);

  doc.text("Nettobetrag:", LABEL_X, curY);
  doc.text(formatCurrencyEur(subtotal), VALUE_X, curY, { align: "right" });
  curY += layout.totalsRowGap;

  if (vatRate > 0) {
    doc.text(`zzgl. ${vatRate}% MwSt:`, LABEL_X, curY);
    doc.text(formatCurrencyEur(vatAmount), VALUE_X, curY, { align: "right" });
    curY += layout.totalsVatGap;
  }

  doc.setDrawColor(...COLOR_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(LABEL_X - 5, curY, VALUE_X, curY);
  curY += layout.totalsDividerGap;

  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(layout.totalsTotalFontSize);
  doc.setTextColor(...COLOR_DARK);
  doc.text("Gesamtbetrag:", LABEL_X, curY);
  doc.text(formatCurrencyEur(total), VALUE_X, curY, { align: "right" });
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_DARK);
  curY += layout.totalsAfterGap;

  return curY;
}

function getTotalsBlockHeight(vatRate: number, layout: QuoteLayout = NORMAL_QUOTE_LAYOUT): number {
  return layout.totalsStartGap + layout.totalsRowGap + (vatRate > 0 ? layout.totalsVatGap : 0) + layout.totalsDividerGap + layout.totalsAfterGap;
}

// --- Quote PDF ----------------------------------------------------------------

export async function generateQuotePdf(quote: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerLato(doc);
  await addHeaderFooter(doc);
  const c = company();

  const billingAddress = {
    name: quote.billingName ?? null,
    street: quote.billingStreet ?? null,
    zip: quote.billingZip ?? null,
    city: quote.billingCity ?? null,
  };

  const auftragsdaten = [
    `Angebotsnummer: ${quote.quoteNumber ?? ""}`,
    `Angebotsdatum: ${formatDate(quote.date)}`,
    c.deliveryTime   ? `Lieferzeit: ${c.deliveryTime}`               : "",
    quote.validUntil ? `Gültig bis: ${formatDate(quote.validUntil)}` : "",
  ].filter(Boolean);

  const vatRate   = parseFloat(quote.vatRate   ?? c.defaultVatRate);
  const subtotal  = parseFloat(quote.subtotal  ?? 0);
  const vatAmount = parseFloat(quote.vatAmount ?? 0);
  const total     = parseFloat(quote.total     ?? 0);
  const downPaymentPercent = Number(quote.downPaymentPercent ?? 0);
  const normalizedDownPaymentPercent = Number.isFinite(downPaymentPercent) ? downPaymentPercent : 0;
  const downPaymentAmount = Math.round(total * normalizedDownPaymentPercent) / 100;
  const quoteClosingLines = normalizedDownPaymentPercent > 0
    ? [
        `Bei Auftragserteilung wird eine Sicherheitsleistung in Form einer Anzahlung von ${normalizedDownPaymentPercent.toFixed(2).replace(/\.00$/, "")} % (${formatCurrencyEuroSign(downPaymentAmount)}) fällig.`,
        "Diese ist innerhalb von 14 Tagen ab Auftragserteilung zahlbar. Die Produktion startet nach Zahlungseingang.",
        "Die Anzahlung wird vom Gesamtbetrag vollständig in Abzug gebracht. Der Rechnungsbetrag wird mit der Lieferung und Montage fällig.",
        "Diese Auftragskonditionen sind zwei Wochen gültig.",
      ]
    : ["Diese Auftragskonditionen sind zwei Wochen gültig."];

  const websiteBase = (c.website || "www.konzept-terrasse.de").replace(/\/+$/, "");
  const agbLabel = `${websiteBase.replace(/^https?:\/\//, "")}/agb`;
  const agbUrl = `${websiteBase.startsWith("http") ? websiteBase : `https://${websiteBase}`}/agb`;
  const continuationTitle = "Angebot";

  const chooseQuoteLayout = () => {
    const layouts = [NORMAL_QUOTE_LAYOUT, COMPACT_QUOTE_LAYOUT, TIGHT_QUOTE_LAYOUT];

    const evaluateLayout = (layout: QuoteLayout) => {
      const addrEndY = addCustomerAddress(doc, quote.customer);
      const tableStartYBase = Math.max(addrEndY + 8, TOP_PADDING + 32);
      doc.setFontSize(layout.closingFontSize);
      const wrappedClosing = quoteClosingLines.flatMap((line) => doc.splitTextToSize(line, CONTENT_WIDTH) as string[]);
      const greetingHeight = getGreetingHeight(doc, quote.customer, layout);
      const addressHeight = getThreeColumnAddressBlockHeight(quote.customer, auftragsdaten, billingAddress, layout);
      const tableStartY = tableStartYBase + 10 + greetingHeight + addressHeight + layout.addressBottomGap;
      const notesHeight = quote.notes
        ? getLabeledTextBlockHeight(doc, quote.notes, CONTENT_WIDTH, { lineHeight: layout.labeledTextLineHeight })
        : 0;
      const paymentTermsHeight = quote.paymentTerms
        ? getLabeledTextBlockHeight(doc, quote.paymentTerms, CONTENT_WIDTH, { lineHeight: layout.labeledTextLineHeight })
        : 0;
      const closingHeight = 8 + getWrappedTextHeight(wrappedClosing.length, layout.closingLineHeight, 0);
      const legalHeight = 2 + 4.2 + 7 + 10;
      const totalsHeight = layout.totalsStartGap + layout.totalsRowGap + layout.totalsVatGap + layout.totalsDividerGap + layout.totalsAfterGap;
      const reservedBelowTable = totalsHeight + notesHeight + paymentTermsHeight + closingHeight + legalHeight;
      const tableHeight = getItemsTableHeight(doc, quote.items ?? [], layout.table);

      return {
        layout,
        wrappedClosing,
        reservedBelowTable,
        tableStartY,
        fits: tableStartY + tableHeight + reservedBelowTable <= CONTENT_BOTTOM_Y,
      };
    };

    for (const layout of layouts) {
      const result = evaluateLayout(layout);
      if (result.fits) return result;
    }

    return evaluateLayout(TIGHT_QUOTE_LAYOUT);
  };

  const { layout: quoteLayout, wrappedClosing, reservedBelowTable } = chooseQuoteLayout();

  const addrEndY = addCustomerAddress(doc, quote.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(quoteLayout.titleFontSize);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Angebot", MARGIN, y);

  doc.setFontSize(quoteLayout.metaFontSize);
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_GRAY);
  doc.text(`Datum: ${formatDate(quote.date)}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  doc.setTextColor(...COLOR_DARK);
  y += quoteLayout.titleFontSize >= 22 ? 10 : quoteLayout.titleFontSize >= 20 ? 8.5 : 7.5;

  y = addGreeting(doc, quote.customer, y, quoteLayout);
  y = addThreeColumnAddressBlock(doc, quote.customer, auftragsdaten, y, billingAddress, quoteLayout);

  doc.setFontSize(quoteLayout.closingFontSize);
  doc.setFont(PDF_FONT, "normal");

  const tableEndY = await addItemsTable(doc, quote.items ?? [], y, continuationTitle, reservedBelowTable, quoteLayout.table);
  let nextY = addTotals(doc, tableEndY, vatRate, subtotal, vatAmount, total, quoteLayout);

  if (quote.notes) {
    nextY = await addLabeledTextBlock(doc, "Anmerkungen:", quote.notes, nextY, {
      continuationTitle,
      fontSize: quoteLayout.labeledTextFontSize,
      lineHeight: quoteLayout.labeledTextLineHeight,
    });
  }

  if (quote.paymentTerms) {
    nextY = await addLabeledTextBlock(doc, "Zahlungsbedingungen:", quote.paymentTerms, nextY, {
      continuationTitle,
      fontSize: quoteLayout.labeledTextFontSize,
      lineHeight: quoteLayout.labeledTextLineHeight,
    });
  }

  let closingY = await ensurePageSpace(doc, nextY + 8, 12, continuationTitle);
  doc.setFontSize(quoteLayout.closingFontSize);
  doc.setTextColor(...COLOR_GRAY);
  for (const line of wrappedClosing) {
    closingY = await ensurePageSpace(doc, closingY, quoteLayout.closingLineHeight + 1, continuationTitle);
    doc.text(line, MARGIN, closingY);
    closingY += quoteLayout.closingLineHeight;
  }

  let legalY = await ensurePageSpace(doc, closingY + 2, 10, continuationTitle);
  doc.setTextColor(...COLOR_DARK);
  doc.text("Vertragsbedingungen:", MARGIN, legalY);
  const legalPrefix = doc.getTextWidth("Vertragsbedingungen: ");
  doc.setTextColor(...COLOR_GRAY);
  doc.text("Unsere Allgemeinen Geschäftsbedingungen unter", MARGIN + legalPrefix, legalY);

  const linkY = legalY + 4.2;
  doc.setTextColor(...COLOR_ORANGE);
  doc.text(agbLabel, MARGIN, linkY);
  doc.link(MARGIN, linkY - 3.2, doc.getTextWidth(agbLabel), 4.5, { url: agbUrl });

  const closingTextY = await ensurePageSpace(doc, linkY + 7, 10, continuationTitle);
  doc.setFontSize(Math.max(7.6, quoteLayout.labeledTextFontSize));
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Mit freundlichen Grüßen", MARGIN, closingTextY);
  doc.text(c.contactPerson || c.name, MARGIN, closingTextY + 5);

  addPageNumbers(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// --- Invoice PDF --------------------------------------------------------------

export async function generateInvoicePdf(invoice: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerLato(doc);
  await addHeaderFooter(doc);
  const c = company();

  const invoiceType = invoice.invoiceType ?? "standard";
  const invoiceTitle = invoiceType === "down_payment" ? "Anzahlungsrechnung" : "Rechnung";
  const continuationTitle = invoiceTitle;
  const quoteRef = invoice.quoteNumber ?? invoice.quote?.quoteNumber ?? null;
  const vatRate = parseFloat(invoice.vatRate ?? c.defaultVatRate);
  const subtotal = parseFloat(invoice.subtotal ?? 0);
  const vatAmount = parseFloat(invoice.vatAmount ?? 0);
  const total = parseFloat(invoice.total ?? 0);
  const fullSubtotal = invoiceType === "down_payment" && invoice.quote ? parseFloat(invoice.quote.subtotal ?? subtotal) : subtotal;
  const fullVatAmount = invoiceType === "down_payment" && invoice.quote ? parseFloat(invoice.quote.vatAmount ?? vatAmount) : vatAmount;
  const fullTotal = invoiceType === "down_payment" && invoice.quote ? parseFloat(invoice.quote.total ?? total) : total;
  const downPaymentPercent = Number(invoice.quote?.downPaymentPercent ?? 0);
  const payableLabel = downPaymentPercent > 0
    ? `Fällige Anzahlung (${downPaymentPercent.toFixed(2).replace(/\.00$/, "")} %):`
    : "Fälliger Rechnungsbetrag:";

  const invoiceClosingExtraHeight = (() => {
    if (invoiceType === "down_payment") return 22;
    if (invoiceType === "final" && invoice.creditedInvoice) return vatRate > 0 ? 40 : 34;
    return 0;
  })();

  const chooseInvoiceLayout = () => {
    const layouts = [NORMAL_QUOTE_LAYOUT, COMPACT_QUOTE_LAYOUT, TIGHT_QUOTE_LAYOUT];

    const evaluateLayout = (layout: QuoteLayout) => {
      const addrEndY = addCustomerAddress(doc, invoice.customer);
      const addressBottom = Math.max(addrEndY + 8, TOP_PADDING + 32);
      const auftragsdaten = [
        `Rechnungsnummer: ${invoice.invoiceNumber ?? ""}`,
        `Rechnungsdatum: ${formatDate(invoice.date)}`,
        invoice.dueDate ? `Zahlungsziel: ${formatDate(invoice.dueDate)}` : "",
        quoteRef ? `Bezug: Angebot ${quoteRef}` : "",
      ].filter(Boolean);
      const addressHeight = getThreeColumnAddressBlockHeight(invoice.customer, auftragsdaten, {
        name: invoice.billingName ?? null,
        street: invoice.billingStreet ?? null,
        zip: invoice.billingZip ?? null,
        city: invoice.billingCity ?? null,
      }, layout);
      const tableStartY = addressBottom + 10 + addressHeight + 4;
      const notesHeight = invoice.notes
        ? getLabeledTextBlockHeight(doc, invoice.notes, CONTENT_WIDTH, { lineHeight: layout.labeledTextLineHeight })
        : 0;
      const paymentTermsHeight = invoice.paymentTerms
        ? getLabeledTextBlockHeight(doc, invoice.paymentTerms, CONTENT_WIDTH, { lineHeight: layout.labeledTextLineHeight })
        : 0;
      const totalsHeight = getTotalsBlockHeight(vatRate, layout);
      const legalHeight = 18;
      const reservedBelowTable = totalsHeight + invoiceClosingExtraHeight + notesHeight + paymentTermsHeight + legalHeight;
      const tableHeight = getItemsTableHeight(doc, invoice.items ?? [], layout.table);

      return {
        layout,
        reservedBelowTable,
        fits: tableStartY + tableHeight + reservedBelowTable <= CONTENT_BOTTOM_Y,
      };
    };

    for (const layout of layouts) {
      const result = evaluateLayout(layout);
      if (result.fits) return result;
    }

    return evaluateLayout(TIGHT_QUOTE_LAYOUT);
  };

  const { layout: invoiceLayout, reservedBelowTable } = chooseInvoiceLayout();

  const addrEndY = addCustomerAddress(doc, invoice.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(invoiceLayout.titleFontSize);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text(invoiceTitle, MARGIN, y);

  doc.setFontSize(invoiceLayout.metaFontSize);
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_GRAY);
  doc.text(`Datum: ${formatDate(invoice.date)}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  doc.setTextColor(...COLOR_DARK);
  y += invoiceLayout.titleFontSize >= 22 ? 10 : invoiceLayout.titleFontSize >= 20 ? 8.5 : 7.5;

  const auftragsdaten = [
    `Rechnungsnummer: ${invoice.invoiceNumber ?? ""}`,
    `Rechnungsdatum: ${formatDate(invoice.date)}`,
    invoice.dueDate ? `Zahlungsziel: ${formatDate(invoice.dueDate)}` : "",
    quoteRef ? `Bezug: Angebot ${quoteRef}` : "",
  ].filter(Boolean);

  y = addThreeColumnAddressBlock(doc, invoice.customer, auftragsdaten, y, {
    name: invoice.billingName ?? null,
    street: invoice.billingStreet ?? null,
    zip: invoice.billingZip ?? null,
    city: invoice.billingCity ?? null,
  }, invoiceLayout);
  y += 4;

  const tableEndY = await addItemsTable(doc, invoice.items ?? [], y, continuationTitle, reservedBelowTable, invoiceLayout.table);

  let nextY = addTotals(doc, tableEndY, vatRate, fullSubtotal, fullVatAmount, fullTotal, invoiceLayout);

  if (invoiceType === "down_payment") {
    const labelX = PAGE_WIDTH - MARGIN - 74;
    const valueX = PAGE_WIDTH - MARGIN;

    nextY = await ensurePageSpace(doc, nextY - 2, 14, continuationTitle);
    doc.setDrawColor(...COLOR_ORANGE);
    doc.setLineWidth(0.5);
    doc.line(labelX - 5, nextY, valueX, nextY);
    nextY += 5;
    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(invoiceLayout.totalsTotalFontSize);
    doc.setTextColor(...COLOR_ORANGE);
    doc.text(payableLabel, labelX - 8, nextY);
    doc.text(formatCurrencyEur(total), valueX, nextY, { align: "right" });
    nextY += 8;
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(...COLOR_DARK);
  }

  if (invoiceType === "final" && invoice.creditedInvoice) {
    const creditedNet = parseFloat(invoice.creditedInvoice.subtotal ?? 0);
    const creditedVat = parseFloat(invoice.creditedInvoice.vatAmount ?? 0);
    const creditedGross = parseFloat(invoice.creditedInvoice.total ?? 0);
    const remainingGross = total - creditedGross;
    const creditedLabel = invoice.creditedInvoice.invoiceNumber
      ? `abzüglich erhaltene Anzahlung (Rechnungs-Nr. ${invoice.creditedInvoice.invoiceNumber}):`
      : "abzüglich erhaltene Anzahlung:";
    const summaryLabelX = PAGE_WIDTH - MARGIN - 76;
    const creditedLabelX = summaryLabelX - 9;
    const valueX = PAGE_WIDTH - MARGIN;

    nextY = await ensurePageSpace(doc, nextY + 2, vatRate > 0 ? 38 : 32, continuationTitle);
    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_GRAY);
    doc.text(creditedLabel, creditedLabelX, nextY);
    nextY += 7;

    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(8.5);
    doc.text("Netto-Anzahlung:", summaryLabelX, nextY);
    doc.text(`- ${formatCurrencyEuroSign(creditedNet)}`, valueX, nextY, { align: "right" });
    nextY += 6;

    if (vatRate > 0) {
      const vatRateLabel = `${vatRate.toFixed(2).replace(/\.00$/, "")}% MwSt aus Anzahlung:`;
      doc.text(vatRateLabel, summaryLabelX, nextY);
      doc.text(`- ${formatCurrencyEuroSign(creditedVat)}`, valueX, nextY, { align: "right" });
      nextY += 6;
    }

    doc.text("Brutto-Anzahlung:", summaryLabelX, nextY);
    doc.text(`- ${formatCurrencyEuroSign(creditedGross)}`, valueX, nextY, { align: "right" });
    nextY += 4;
    doc.setDrawColor(...COLOR_ORANGE);
    doc.setLineWidth(0.5);
    doc.line(summaryLabelX - 2, nextY, valueX, nextY);
    nextY += 6;

    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_ORANGE);
    doc.text("Noch zu zahlender Betrag:", summaryLabelX, nextY);
    doc.text(formatCurrencyEuroSign(remainingGross), valueX, nextY, { align: "right" });
    nextY += 4;
    doc.setDrawColor(...COLOR_ORANGE);
    doc.line(summaryLabelX - 2, nextY, valueX, nextY);
    nextY += 8;
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(...COLOR_DARK);
  }

  if (invoice.notes) {
    nextY = await addLabeledTextBlock(doc, "Anmerkungen:", invoice.notes, nextY, {
      continuationTitle,
      fontSize: invoiceLayout.labeledTextFontSize,
      lineHeight: invoiceLayout.labeledTextLineHeight,
    });
  }

  if (invoice.paymentTerms) {
    nextY = await addLabeledTextBlock(doc, "Zahlungsbedingungen:", invoice.paymentTerms, nextY, {
      continuationTitle,
      fontSize: invoiceLayout.labeledTextFontSize,
      lineHeight: invoiceLayout.labeledTextLineHeight,
    });
  }

  const closingY = await ensurePageSpace(doc, nextY + 8, 10, continuationTitle);
  doc.setFontSize(Math.max(9, invoiceLayout.labeledTextFontSize));
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Mit freundlichen Grüßen,", MARGIN, closingY);
  doc.text(c.contactPerson || c.name, MARGIN, closingY + 6);

  addPageNumbers(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// --- Acceptance Protocol PDF --------------------------------------------------

export async function generateProtocolPdf(protocol: any): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerLato(doc);
  await addHeaderFooter(doc);
  const c = company();

  const addrEndY = addCustomerAddress(doc, protocol.customer);
  let y = Math.max(addrEndY + 8, TOP_PADDING + 32);

  doc.setFontSize(16);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(...COLOR_DARK);
  doc.text("Abnahmeprotokoll", MARGIN, y);

  doc.setFontSize(10);
  doc.setFont(PDF_FONT, "normal");
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
    doc.setFont(PDF_FONT, "bold");
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
    doc.setFont(PDF_FONT, "bold");
    doc.setTextColor(...COLOR_ORANGE);
    doc.text("Maengel / Nachbesserungen:", MARGIN, y);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_DARK);
    y += 5;
    const defectsLines = doc.splitTextToSize(protocol.defects, CONTENT_WIDTH) as string[];
    for (let i = 0; i < defectsLines.length; i += 1) {
      doc.text(defectsLines[i], MARGIN, y + i * 4);
    }
    y += defectsLines.length * 4 + 8;
  }

  if (protocol.notes) {
    doc.setFontSize(10);
    doc.setFont(PDF_FONT, "bold");
    doc.text("Anmerkungen:", MARGIN, y);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(9);
    y += 5;
    const notesLines = doc.splitTextToSize(protocol.notes, CONTENT_WIDTH) as string[];
    for (let i = 0; i < notesLines.length; i += 1) {
      doc.text(notesLines[i], MARGIN, y + i * 4);
    }
    y += notesLines.length * 4 + 8;
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

  addPageNumbers(doc);
  return Buffer.from(doc.output("arraybuffer"));
}
