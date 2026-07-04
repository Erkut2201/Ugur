import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { desc } from "drizzle-orm";
import { sendEmail } from "../services/emailService.js";
import { getDb } from "../db.js";
import { saveUpload } from "../services/storageService.js";
import { requireAuth } from "../middleware/auth.js";
import {
  USE_POSTGRES,
  publicInquiriesTable,
  publicInquiriesTableSQLite,
  insertContactInquirySchema,
  insertOfferInquirySchema,
} from "../../shared/schema.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Nur JPG, PNG, WEBP und PDF sind erlaubt"));
      return;
    }
    cb(null, true);
  },
});

const inquiryLimit = new Map<string, { count: number; resetAt: number }>();
const inquiryTable = () => (USE_POSTGRES ? publicInquiriesTable : publicInquiriesTableSQLite);

// ── Authenticated: list all inquiries ────────────────────────────────────────
router.get("/", requireAuth, async (_req, res) => {
  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(inquiryTable())
      .orderBy(desc((inquiryTable() as any).createdAt));
    res.json(rows);
  } catch (err) {
    console.error("[inquiries] GET /", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

function enforceInquiryRateLimit(ip: string): string | null {
  const now = Date.now();
  const entry = inquiryLimit.get(ip);

  if (!entry || now >= entry.resetAt) {
    inquiryLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return null;
  }

  if (entry.count >= 5) {
    return "Zu viele Anfragen. Bitte später erneut versuchen.";
  }

  entry.count += 1;
  return null;
}

function getInquiryRecipient(): string {
  return process.env.PUBLIC_INQUIRY_EMAIL ?? process.env.COMPANY_EMAIL ?? process.env.BREVO_FROM ?? "info@example.com";
}

function getSafeFiles(files: Express.Multer.File[] | undefined) {
  return (files ?? []).map((file) => ({
    originalname: file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"),
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  }));
}

async function sendInquiryEmail(
  subject: string,
  text: string,
  attachments: Array<{ originalname: string; buffer: Buffer }> = []
) {
  await sendEmail({
    to: getInquiryRecipient(),
    subject,
    text,
    attachments: [
      {
        name: "anfrage.txt",
        content: Buffer.from(text, "utf-8"),
      },
      ...attachments.map((file) => ({
        name: file.originalname,
        content: file.buffer,
      })),
    ],
  });
}

async function saveInquiry(values: {
  type: "contact" | "offer";
  product?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  message: string;
  consent: boolean;
  files: Array<{ originalname: string; mimetype: string; size: number; storageKey: string }>;
}) {
  const { db } = getDb();
  await (db as any).insert(inquiryTable()).values({
    type: values.type,
    product: values.product ?? null,
    name: values.name,
    email: values.email,
    phone: values.phone,
    address: values.address ?? null,
    message: values.message,
    consentAccepted: values.consent,
    fileCount: values.files.length,
    uploadedFilesJson: JSON.stringify(
      values.files.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        storageKey: file.storageKey,
      }))
    ),
  });
}

router.post("/contact", async (req, res) => {
  const ip = req.ip ?? String(req.headers["x-forwarded-for"] ?? "unknown");
  const rateLimitError = enforceInquiryRateLimit(String(ip));
  if (rateLimitError) {
    res.status(429).json({ error: rateLimitError });
    return;
  }

  const parsed = insertContactInquirySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" });
    return;
  }

  const data = parsed.data;
  try {
    await saveInquiry({
      type: "contact",
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      consent: data.consent,
      files: [],
    });
    await sendInquiryEmail(
      `Kontaktanfrage von ${data.name}`,
      [
        `Name: ${data.name}`,
        `E-Mail: ${data.email}`,
        `Telefon: ${data.phone}`,
        "",
        "Nachricht:",
        data.message,
      ].join("\n")
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("[public-inquiries/contact]", error);
    res.status(500).json({ error: "Anfrage konnte nicht verarbeitet werden" });
  }
});

router.post("/offer", upload.array("files", 5), async (req, res) => {
  const ip = req.ip ?? String(req.headers["x-forwarded-for"] ?? "unknown");
  const rateLimitError = enforceInquiryRateLimit(String(ip));
  if (rateLimitError) {
    res.status(429).json({ error: rateLimitError });
    return;
  }

  const parsed = insertOfferInquirySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" });
    return;
  }

  const data = parsed.data;
  const rawFiles = getSafeFiles(req.files as Express.Multer.File[] | undefined);

  // Persist each file: S3 primary + local backup always
  const timestamp = Date.now();
  const storedFiles = await Promise.all(
    rawFiles.map(async (file) => {
      const ext = file.originalname.split(".").pop() ?? "bin";
      const storageKey = `inquiries/${timestamp}-${file.originalname}`;
      await saveUpload(storageKey, file.buffer, file.mimetype);
      return {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        storageKey,
        buffer: file.buffer,
      };
    })
  );

  try {
    await saveInquiry({
      type: "offer",
      product: data.product,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address || undefined,
      message: data.message,
      consent: data.consent,
      files: storedFiles,
    });
    await sendInquiryEmail(
      `Angebotsanfrage von ${data.name}`,
      [
        `Produkt: ${data.product}`,
        `Name: ${data.name}`,
        `E-Mail: ${data.email}`,
        `Telefon: ${data.phone}`,
        `Adresse: ${data.address || "-"}`,
        "",
        "Projektbeschreibung:",
        data.message,
        "",
        `Uploads: ${storedFiles.length}`,
        ...storedFiles.map((file) => `- ${file.originalname} (${file.mimetype}, ${file.size} Bytes)`),
      ].join("\n"),
      storedFiles.map((file) => ({ originalname: file.originalname, buffer: file.buffer }))
    );

    res.status(201).json({ ok: true, uploadedFiles: storedFiles.length });
  } catch (error) {
    console.error("[public-inquiries/offer]", error);
    res.status(500).json({ error: "Anfrage konnte nicht verarbeitet werden" });
  }
});

router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (!(error instanceof Error)) {
    next(error);
    return;
  }

  if (error.message.includes("Nur JPG") || error.message.includes("File too large") || error.message.includes("Too many files")) {
    res.status(400).json({ error: error.message });
    return;
  }

  next(error);
});

export default router;
