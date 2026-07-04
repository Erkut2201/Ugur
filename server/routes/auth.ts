// server/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { USE_POSTGRES, usersTable, usersTableSQLite } from "../../shared/schema.js";

const router = Router();
const table = () => (USE_POSTGRES ? usersTable : usersTableSQLite);

// Simple in-memory rate limiter: max 10 attempts per IP per 15 min
const loginAttempts = new Map();
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const ip = req.ip ?? req.headers["x-forwarded-for"] ?? "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      res.status(429).json({ error: "Zu viele Versuche. Bitte 15 Minuten warten." });
      return;
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }

  if (!email || !password) {
    res.status(400).json({ error: "E-Mail und Passwort sind erforderlich" });
    return;
  }

  try {
    const { db } = getDb();
    const rows = await (db as any)
      .select()
      .from(table())
      .where(eq(table().email, email))
      .limit(1);

    if (rows.length === 0) {
      res.status(401).json({ error: "Ungültige Anmeldedaten" });
      return;
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Ungültige Anmeldedaten" });
      return;
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }
  res.json({ id: req.session.userId, email: req.session.userEmail });
});

export default router;
