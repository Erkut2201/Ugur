// server/db.ts
// Dual-mode DB: PostgreSQL (production) or SQLite (local fallback via node:sqlite built-in)
// Dialect is determined entirely from env vars — no code changes needed

import "dotenv/config";
import { createRequire } from "module";
import { USE_POSTGRES } from "../shared/schema.js";

const require = createRequire(import.meta.url);

let _db: ReturnType<typeof buildDb> | null = null;

function buildDb() {
  if (USE_POSTGRES) {
    // ── PostgreSQL ──────────────────────────────────────────────────────────
    const { drizzle } = require("drizzle-orm/node-postgres");
    const { Pool } = require("pg");

    const poolConfig = process.env.POSTGRES_URL
      ? {
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
          max: 20,
          idleTimeoutMillis: 30_000,
        }
      : {
          host: process.env.PG_HOST!,
          port: Number(process.env.PG_PORT ?? 5432),
          user: process.env.PG_USER!,
          password: process.env.PG_PASSWORD!,
          database: process.env.PG_DATABASE!,
          ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
          max: 20,
          idleTimeoutMillis: 30_000,
        };

    const pool = new Pool(poolConfig);

    const db = drizzle(pool);
    console.log(
      `[db] Connected to PostgreSQL (${
        process.env.POSTGRES_URL ? "via POSTGRES_URL" : `${process.env.PG_HOST}/${process.env.PG_DATABASE}`
      })`
    );
    return { db, pool, dialect: "postgres" as const };
  } else {
    // ── SQLite fallback via Node built-in ────────────────────────────────────
    // Uses node:sqlite (available since Node 22.5) — no native build needed
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    const { drizzle } = require("drizzle-orm/sqlite-proxy");
    const fs = require("fs");
    const path = require("path");

    const dbPath = process.env.SQLITE_PATH ?? "./data/local.db";
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sqlite = new DatabaseSync(dbPath);
    sqlite.exec("PRAGMA journal_mode = WAL");

    // Bridge node:sqlite (sync) to drizzle sqlite-proxy (async)
    const db = drizzle(async (sql: string, params: any[], method: string) => {
      const stmt = sqlite.prepare(sql);
      if (method === "run") {
        stmt.run(...params);
        return { rows: [] };
      }
      const rows = stmt.all(...params) as Record<string, unknown>[];
      // sqlite-proxy expects rows as arrays of values (column order)
      const mapped = rows.map((r) => Object.values(r));
      if (method === "get") {
        return { rows: mapped.length > 0 ? [mapped[0]] : [] };
      }
      return { rows: mapped };
    });

    console.log(`[db] Using SQLite (node:sqlite built-in) at ${path.resolve(dbPath)}`);
    return { db, pool: sqlite, dialect: "sqlite" as const };
  }
}

export function getDb() {
  if (!_db) _db = buildDb();
  return _db;
}
