// server/services/emailService.ts
// Sends emails via IONOS SMTP (Nodemailer) when SMTP_HOST is configured,
// falls back to Brevo HTTP API, then logs to console if neither is set.

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

interface EmailAttachment {
  name: string;
  content: Buffer;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}

interface SendDocumentEmailOptions {
  to: string;
  subject: string;
  text: string;
  attachmentBuffer: Buffer;
  attachmentName: string;
}

// ── Logo helper ──────────────────────────────────────────────────────────────

function loadLogoBase64(): string | null {
  const logoPath = path.resolve("client/public/images/Logo/ac_premium_bau_final.png");
  try {
    return fs.readFileSync(logoPath).toString("base64");
  } catch {
    return null;
  }
}

// ── HTML template ────────────────────────────────────────────────────────────

function buildHtmlEmail(bodyText: string): { html: string; logoBase64: string | null } {
  const e = process.env;
  const logoBase64 = loadLogoBase64();

  const address = [e.COMPANY_STREET, [e.COMPANY_ZIP, e.COMPANY_CITY].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  // Convert plain text body lines to <p> tags
  const bodyHtml = bodyText
    .split("\n")
    .map((line) => (line.trim() === "" ? "<br>" : `<p style="margin:0 0 8px 0">${escHtml(line)}</p>`))
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(e.COMPANY_NAME ?? "")}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" border="0"
               style="max-width:620px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12);">

          <!-- HEADER -->
          <tr>
            <td style="background:#1a1a1a;padding:28px 32px;text-align:center;">
              ${
                logoBase64
                  ? `<img src="cid:company-logo" alt="${escHtml(e.COMPANY_NAME ?? "Logo")}"
                         style="max-height:64px;max-width:280px;display:block;margin:0 auto;" />`
                  : `<span style="color:#C8A96E;font-size:22px;font-weight:bold;letter-spacing:1px;">${escHtml(e.COMPANY_NAME ?? "")}</span>`
              }
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="background:#C8A96E;height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 32px 24px 32px;color:#333333;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="background:#C8A96E;height:1px;font-size:0;line-height:0;margin:0 32px;">&nbsp;</td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 32px;color:#aaaaaa;font-size:11px;line-height:1.8;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:top;padding-right:16px;">
                    ${e.COMPANY_NAME ? `<strong style="color:#C8A96E;font-size:12px;">${escHtml(e.COMPANY_NAME)}</strong><br>` : ""}
                    ${address ? `${escHtml(address)}<br>` : ""}
                    ${e.COMPANY_PHONE ? `Tel: ${escHtml(e.COMPANY_PHONE)}<br>` : ""}
                    ${e.COMPANY_EMAIL ? `E-Mail: <a href="mailto:${escHtml(e.COMPANY_EMAIL)}" style="color:#C8A96E;text-decoration:none;">${escHtml(e.COMPANY_EMAIL)}</a><br>` : ""}
                    ${e.COMPANY_WEBSITE ? `<a href="https://${escHtml(e.COMPANY_WEBSITE)}" style="color:#C8A96E;text-decoration:none;">${escHtml(e.COMPANY_WEBSITE)}</a><br>` : ""}
                    ${e.COMPANY_CONTACT_PERSON ? `Ansprechpartner: ${escHtml(e.COMPANY_CONTACT_PERSON)}<br>` : ""}
                  </td>
                  <td style="vertical-align:top;">
                    ${e.COMPANY_BANK_NAME || e.COMPANY_IBAN ? `<strong style="color:#C8A96E;font-size:12px;">Bankverbindung</strong><br>` : ""}
                    ${e.COMPANY_BANK_NAME ? `${escHtml(e.COMPANY_BANK_NAME)}<br>` : ""}
                    ${e.COMPANY_IBAN ? `IBAN: ${escHtml(e.COMPANY_IBAN)}<br>` : ""}
                    ${e.COMPANY_BIC ? `BIC: ${escHtml(e.COMPANY_BIC)}<br>` : ""}
                    ${e.COMPANY_VAT_ID || e.COMPANY_TAX_ID ? `<br>` : ""}
                    ${e.COMPANY_VAT_ID ? `USt-IdNr.: ${escHtml(e.COMPANY_VAT_ID)}<br>` : ""}
                    ${e.COMPANY_TAX_ID ? `Steuernr.: ${escHtml(e.COMPANY_TAX_ID)}<br>` : ""}
                    ${e.COMPANY_FINANZAMT ? `${escHtml(e.COMPANY_FINANZAMT)}` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return { html, logoBase64 };
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Plain-text footer ────────────────────────────────────────────────────────

function buildTextFooter(): string {
  const e = process.env;
  const lines: string[] = ["--"];
  if (e.COMPANY_NAME) lines.push(e.COMPANY_NAME);
  const address = [e.COMPANY_STREET, [e.COMPANY_ZIP, e.COMPANY_CITY].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (address) lines.push(address);
  if (e.COMPANY_PHONE) lines.push(`Tel: ${e.COMPANY_PHONE}`);
  if (e.COMPANY_EMAIL) lines.push(`E-Mail: ${e.COMPANY_EMAIL}`);
  if (e.COMPANY_WEBSITE) lines.push(e.COMPANY_WEBSITE);
  if (e.COMPANY_CONTACT_PERSON) lines.push(`Ansprechpartner: ${e.COMPANY_CONTACT_PERSON}`);
  if (e.COMPANY_BANK_NAME || e.COMPANY_IBAN) {
    lines.push("");
    lines.push("Bankverbindung:");
    if (e.COMPANY_BANK_NAME) lines.push(e.COMPANY_BANK_NAME);
    if (e.COMPANY_IBAN) lines.push(`IBAN: ${e.COMPANY_IBAN}`);
    if (e.COMPANY_BIC) lines.push(`BIC: ${e.COMPANY_BIC}`);
  }
  if (e.COMPANY_VAT_ID) lines.push(`USt-IdNr.: ${e.COMPANY_VAT_ID}`);
  if (e.COMPANY_TAX_ID) lines.push(`Steuernr.: ${e.COMPANY_TAX_ID}`);
  if (e.COMPANY_FINANZAMT) lines.push(e.COMPANY_FINANZAMT);
  return lines.join("\n");
}

// ── Send via IONOS SMTP (Nodemailer) ─────────────────────────────────────────

async function sendViaSMTP(opts: SendEmailOptions, html: string, logoBase64: string | null): Promise<void> {
  const e = process.env;
  const fromEmail = e.SMTP_FROM ?? e.SMTP_USER ?? "noreply@example.com";
  const displayName = e.COMPANY_CONTACT_PERSON ?? e.COMPANY_NAME;
  const from = displayName ? `"${displayName}" <${fromEmail}>` : fromEmail;

  const transporter = nodemailer.createTransport({
    host: e.SMTP_HOST!,
    port: Number(e.SMTP_PORT ?? 587),
    secure: e.SMTP_SECURE === "true",
    auth: {
      user: e.SMTP_USER!,
      pass: e.SMTP_PASSWORD!,
    },
  });

  const attachments: nodemailer.SendMailOptions["attachments"] = [];

  if (logoBase64) {
    attachments.push({
      filename: "logo.png",
      content: Buffer.from(logoBase64, "base64"),
      cid: "company-logo",
      contentDisposition: "inline",
    });
  }

  if (opts.attachments) {
    for (const att of opts.attachments) {
      attachments.push({ filename: att.name, content: att.content });
    }
  }

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: `${opts.text}\n\n${buildTextFooter()}`,
    html,
    attachments,
  });

  console.log(`[email/smtp] Sent "${opts.subject}" to ${opts.to}`);
}

// ── Send via Brevo HTTP API ───────────────────────────────────────────────────

async function sendViaBrevo(opts: SendEmailOptions, html: string): Promise<void> {
  const e = process.env;
  const fromEmail = e.BREVO_FROM ?? e.SMTP_FROM ?? "noreply@example.com";
  const displayName = e.COMPANY_CONTACT_PERSON ?? e.COMPANY_NAME;
  const fullText = `${opts.text}\n\n${buildTextFooter()}`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: displayName ? { email: fromEmail, name: displayName } : { email: fromEmail },
      to: [{ email: opts.to }],
      subject: opts.subject,
      textContent: fullText,
      htmlContent: html,
      attachment: opts.attachments?.map((item) => ({
        name: item.name,
        content: item.content.toString("base64"),
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo Fehler ${response.status}: ${body}`);
  }

  console.log(`[email/brevo] Sent "${opts.subject}" to ${opts.to}`);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const { html, logoBase64 } = buildHtmlEmail(opts.text);
  const e = process.env;

  if (e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASSWORD) {
    await sendViaSMTP(opts, html, logoBase64);
    return;
  }

  if (e.BREVO_API_KEY) {
    await sendViaBrevo(opts, html);
    return;
  }

  // Dev fallback — log only
  const attachmentInfo = opts.attachments?.map((a) => a.name).join(", ") ?? "keine Anhänge";
  console.warn(
    `[email] Kein E-Mail-Provider konfiguriert (SMTP_HOST oder BREVO_API_KEY setzen).` +
    `\n  An: ${opts.to} | Betreff: "${opts.subject}" | Anhänge: ${attachmentInfo}`
  );
  console.info(`[email] Vorschau Textinhalt:\n${opts.text}\n\n${buildTextFooter()}`);
}

export async function sendDocumentEmail(opts: SendDocumentEmailOptions): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        name: opts.attachmentName,
        content: opts.attachmentBuffer,
      },
    ],
  });
}
