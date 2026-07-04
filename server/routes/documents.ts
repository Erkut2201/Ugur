// server/routes/documents.ts
// Document archive — lists all quotes, invoices and protocols with metadata
import { Router } from "express";
import { desc } from "drizzle-orm";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import path from "path";
import fs from "fs";
import {
  USE_POSTGRES,
  quotesTable,
  quotesTableSQLite,
  invoicesTable,
  invoicesTableSQLite,
  protocolsTable,
  protocolsTableSQLite,
} from "../../shared/schema.js";
import { getDocumentUrl } from "../services/storageService.js";

const router = Router();
router.use(requireAuth);

// GET /api/documents?type=quote|invoice|protocol
router.get("/", async (req, res) => {
  try {
    const { db } = getDb();
    const typeFilter = req.query.type as string | undefined;
    const result: any[] = [];

    if (!typeFilter || typeFilter === "quote") {
      const rows = await db
        .select()
        .from(USE_POSTGRES ? quotesTable : quotesTableSQLite)
        .orderBy(desc(USE_POSTGRES ? quotesTable.createdAt : quotesTableSQLite.createdAt));
      result.push(...rows.map((r: any) => ({ ...r, docType: "quote", number: r.quoteNumber })));
    }

    if (!typeFilter || typeFilter === "invoice") {
      const rows = await db
        .select()
        .from(USE_POSTGRES ? invoicesTable : invoicesTableSQLite)
        .orderBy(desc(USE_POSTGRES ? invoicesTable.createdAt : invoicesTableSQLite.createdAt));
      result.push(...rows.map((r: any) => ({ ...r, docType: "invoice", number: r.invoiceNumber })));
    }

    if (!typeFilter || typeFilter === "protocol") {
      const rows = await db
        .select()
        .from(USE_POSTGRES ? protocolsTable : protocolsTableSQLite)
        .orderBy(desc(USE_POSTGRES ? protocolsTable.createdAt : protocolsTableSQLite.createdAt));
      result.push(...rows.map((r: any) => ({ ...r, docType: "protocol", number: r.protocolNumber })));
    }

    // Sort all by createdAt descending
    result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json(result);
  } catch (err) {
    console.error("[documents/list]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/documents/url?key=...  — get signed URL for any S3 key
router.get("/url", async (req, res) => {
  const key = req.query.key as string;
  if (!key) { res.status(400).json({ error: "key fehlt" }); return; }
  try {
    const url = await getDocumentUrl(key);
    res.json({ url });
  } catch (err) {
    console.error("[documents/url]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// GET /api/documents/local/:key  — serve local PDF files (fallback when no S3)
router.get("/local/:key(*)", (req, res) => {
  const key = req.params.key;
  // Sanitize: prevent path traversal
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const localBase = process.env.LOCAL_STORAGE_PATH ?? "./data/pdfs";
  const filePath = path.resolve(localBase, normalized);

  // Ensure file is within allowed directory
  if (!filePath.startsWith(path.resolve(localBase))) {
    res.status(403).json({ error: "Zugriff verweigert" });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Datei nicht gefunden" });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
  res.sendFile(filePath);
});

export default router;
