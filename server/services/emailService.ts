// server/services/emailService.ts
// Sends documents and public inquiries via Brevo HTTP API. Falls back to console-logging when API key not configured.

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

function buildEmailFooter(): string {
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

  const hasBank = e.COMPANY_BANK_NAME || e.COMPANY_IBAN;
  if (hasBank) {
    lines.push("");
    lines.push("Bankverbindung:");
    if (e.COMPANY_BANK_NAME) lines.push(e.COMPANY_BANK_NAME);
    if (e.COMPANY_IBAN) lines.push(`IBAN: ${e.COMPANY_IBAN}`);
    if (e.COMPANY_BIC) lines.push(`BIC: ${e.COMPANY_BIC}`);
  }

  if (e.COMPANY_VAT_ID) lines.push(`\nUSt-IdNr.: ${e.COMPANY_VAT_ID}`);
  if (e.COMPANY_TAX_ID) lines.push(`Steuernummer: ${e.COMPANY_TAX_ID}`);

  return lines.join("\n");
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM ?? process.env.SMTP_FROM ?? "noreply@example.com";
  const fullText = `${opts.text}\n\n${buildEmailFooter()}`;

  if (!apiKey) {
    const attachmentInfo = opts.attachments?.map((item) => item.name).join(", ") ?? "keine Anhänge";
    console.warn(
      `[email] BREVO_API_KEY not configured — would send to ${opts.to}: "${opts.subject}" with ${attachmentInfo}`
    );
    console.info(`[email] Full body preview:\n${fullText}`);
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: from },
      to: [{ email: opts.to }],
      subject: opts.subject,
      textContent: fullText,
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

  console.log(`[email] Sent "${opts.subject}" to ${opts.to}`);
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
