// server/services/storageService.ts
// Storage: S3 primary (when configured) + local filesystem backup (always written).
// Documents: same behaviour as before (PDF-centric).
// Inquiry uploads: always saved locally; also uploaded to S3 when configured.

import fs from "fs";
import path from "path";

const USE_S3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY);

let _s3Client: any = null;

function getS3Client() {
  if (_s3Client) return _s3Client;
  const { S3Client } = require("@aws-sdk/client-s3");
  _s3Client = new S3Client({
    region: process.env.S3_REGION ?? "eu-central-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT), // required for Hetzner/MinIO
  });
  return _s3Client;
}

export async function saveDocument(key: string, buffer: Buffer): Promise<string> {
  if (USE_S3) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
      })
    );
    console.log(`[storage] Uploaded to S3: ${key}`);
    return key;
  }

  // Local fallback
  const localBase = process.env.LOCAL_STORAGE_PATH ?? "./data/pdfs";
  const fullPath = path.resolve(localBase, key);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, buffer);
  console.log(`[storage] Saved locally: ${fullPath}`);
  return key;
}

export async function getDocumentUrl(key: string): Promise<string> {
  if (USE_S3) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    const url = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
      { expiresIn: 3600 }
    );
    return url;
  }

  // Local fallback: serve via API endpoint
  return `/api/documents/local/${encodeURIComponent(key)}`;
}

export async function readDocumentBuffer(key: string): Promise<Buffer> {
  if (USE_S3) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const response = await getS3Client().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })
    );
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const localBase = process.env.LOCAL_STORAGE_PATH ?? "./data/pdfs";
  return fs.readFileSync(path.resolve(localBase, key));
}

export async function readImageAsBase64(filePath: string): Promise<string> {
  // Supports local file paths (relative to project root) or returns empty string on error
  try {
    const resolved = path.resolve(filePath);
    const raw = fs.readFileSync(resolved);

    // Compress + resize with sharp to keep PDF size small
    let compressed: Buffer;
    try {
      const sharp = (await import("sharp")).default;
      compressed = await sharp(raw)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
    } catch {
      // sharp unavailable – use original
      compressed = raw;
    }

    return `data:image/jpeg;base64,${compressed.toString("base64")}`;
  } catch {
    return "";
  }
}

// ─── Inquiry / general upload (S3 primary + local backup always) ─────────────

function localUploadPath(key: string): string {
  const base = process.env.LOCAL_STORAGE_PATH ?? "./data/pdfs";
  return path.resolve(base, key);
}

function saveLocally(key: string, buffer: Buffer, mimeType: string): void {
  const fullPath = localUploadPath(key);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, buffer);
  console.log(`[storage] Backup saved locally: ${fullPath} (${mimeType})`);
}

/**
 * Saves an arbitrary upload.
 * - Always writes a local backup copy to LOCAL_STORAGE_PATH.
 * - Additionally uploads to S3 when S3_BUCKET and S3_ACCESS_KEY are configured.
 * Returns the storage key (use for URL generation and DB storage).
 */
export async function saveUpload(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // 1. Always save locally as backup
  saveLocally(key, buffer, mimeType);

  // 2. Upload to S3 when configured
  if (USE_S3) {
    try {
      const { PutObjectCommand } = require("@aws-sdk/client-s3");
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      console.log(`[storage] Uploaded to S3: ${key}`);
    } catch (err) {
      console.error(`[storage] S3 upload failed for ${key}, local backup retained:`, err);
      // Do not rethrow — local backup is sufficient
    }
  }

  return key;
}

/**
 * Returns a URL for a previously saved upload.
 * Uses a signed S3 URL when S3 is configured, otherwise the local API endpoint.
 */
export async function getUploadUrl(key: string): Promise<string> {
  if (USE_S3) {
    try {
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      return await getSignedUrl(
        getS3Client(),
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
        { expiresIn: 3600 }
      );
    } catch {
      // Fall through to local URL
    }
  }
  return `/api/documents/local/${encodeURIComponent(key)}`;
}

