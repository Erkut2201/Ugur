// server/index.ts
import "./loadEnv.js"; // lädt .env.development (lokal) oder .env (Produktion)
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { doubleCsrf } from "csrf-csrf";
import path from "path";
import { fileURLToPath } from "url";
import { runMigrations, seedAdmin } from "./migrate.js";
import { USE_POSTGRES } from "../shared/schema.js";
import authRouter from "./routes/auth.js";
import customersRouter from "./routes/customers.js";
import quotesRouter from "./routes/quotes.js";
import invoicesRouter from "./routes/invoices.js";
import protocolsRouter from "./routes/protocols.js";
import documentsRouter from "./routes/documents.js";
import servicesRouter from "./routes/services.js";
import unitsRouter from "./routes/units.js";
import catalogRouter from "./routes/catalog.js";
import configuratorRouter from "./routes/configurator.js";
import emailTemplatesRouter from "./routes/emailTemplates.js";
import publicInquiriesRouter from "./routes/publicInquiries.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllowedOrigins() {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return new Set(configuredOrigins);
  }

  return new Set([
    "http://localhost:5173",
    "http://localhost:3008",
    "http://rechnungen.localhost:5173",
    "http://rechnungen.localhost:3008",
  ]);
}

function resolveCookieDomain() {
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
  if (!cookieDomain) return undefined;
  return cookieDomain.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
}

async function startServer() {
  // ── 1. Migrations + seed ───────────────────────────────────────────────────
  await runMigrations();
  await seedAdmin();

  // ── 2. Express app ─────────────────────────────────────────────────────────
  const app = express();
  // Trust the reverse proxy (Render, nginx, etc.) so secure cookies work over HTTPS
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: { action: "deny" },
      referrerPolicy: { policy: "no-referrer" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      hsts: process.env.NODE_ENV === "production",
    })
  );

  const allowedOrigins = getAllowedOrigins();
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, x-csrf-token");
      res.header("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
      return;
    }

    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    const host = req.hostname || "";
    const isInternalHost = host.startsWith("rechnungen.") || host.includes("b2b");

    res.setHeader(
      "X-Robots-Tag",
      isInternalHost ? "noindex, nofollow, noarchive, nosnippet" : "index, follow"
    );

    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
    const blockedAgents = ["python-requests", "curl/", "wget/", "scrapy", "go-http-client", "crawler", "spider"];
    if (isInternalHost && blockedAgents.some((entry) => userAgent.includes(entry))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  });

  // ── 3. Session store ────────────────────────────────────────────────────────
  let sessionStore: session.Store | undefined;

  if (USE_POSTGRES) {
    const { default: connectPgSimple } = await import("connect-pg-simple");
    const PgStore = connectPgSimple(session);
    const { pool } = (await import("./db.js")).getDb() as any;
    sessionStore = new PgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    });
  }
  // SQLite: uses default MemoryStore (fine for local dev)

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }

  app.use(
    session({
      name: "__kt_session",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
        domain: resolveCookieDomain(),
      },
    })
  );

  // ── 4. CSRF protection (double-submit cookie) ─────────────────────────────
  const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET!,
    cookieName: "__kt_csrf",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: resolveCookieDomain(),
    },
    size: 64,
    getTokenFromRequest: (req) =>
      (req.headers["x-csrf-token"] as string | undefined) ?? req.body?.csrfToken,
  });

  // Endpoint: client fetches a token before submitting public forms
  app.get("/api/csrf-token", (req, res) => {
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
  });

  // Apply CSRF check only to mutating public inquiry routes
  app.use("/api/inquiries/contact", doubleCsrfProtection);
  app.use("/api/inquiries/offer", doubleCsrfProtection);

  // ── 5. API routes ──────────────────────────────────────────────────────────
  app.get("/robots.txt", (req, res) => {
    const host = req.hostname || "";
    const isInternalHost = host.startsWith("rechnungen.") || host.includes("b2b");
    res.type("text/plain").send(isInternalHost ? "User-agent: *\nDisallow: /\n" : "User-agent: *\nAllow: /\n");
  });

  // Public config endpoint (does not leak secrets)
  app.get("/api/config", (_req, res) => {
    res.json({ smtpConfigured: !!(process.env.BREVO_API_KEY) });
  });

  // Public company info — serves ENV data without leaking secrets
  app.get("/api/company", (_req, res) => {
    const e = process.env;
    const street = e.COMPANY_STREET ?? "";
    const zip = e.COMPANY_ZIP ?? "";
    const city = e.COMPANY_CITY ?? "";
    const address = `${street}, ${zip} ${city}`.trim().replace(/^,\s*/, "");
    const mapsQuery = encodeURIComponent(`${street} ${zip} ${city}`.trim());
    const rawPhone = e.COMPANY_PHONE ?? "";
    // Format: 070718826970 → +49 7071 882 6970
    const phone = rawPhone.startsWith("0")
      ? `+49 ${rawPhone.slice(1).replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3")}`
      : rawPhone;
    res.json({
      name: e.COMPANY_NAME ?? "",
      address,
      street,
      zip,
      city,
      phone,
      email: e.COMPANY_EMAIL ?? "",
      website: e.COMPANY_WEBSITE ?? "",
      contactPerson: e.COMPANY_CONTACT_PERSON ?? "",
      mapsQuery,
    });
  });

  // Brevo test endpoint
  app.get("/api/email-test", async (req, res) => {
    const e = process.env;
    const info = {
      BREVO_API_KEY: e.BREVO_API_KEY ? "gesetzt (" + e.BREVO_API_KEY.length + " Zeichen)" : "(leer)",
      BREVO_FROM: e.BREVO_FROM || e.SMTP_FROM || "(leer)",
    };
    if (!e.BREVO_API_KEY) {
      res.status(500).json({ ok: false, error: "BREVO_API_KEY nicht gesetzt", config: info });
      return;
    }
    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": e.BREVO_API_KEY },
      });
      if (!response.ok) {
        const body = await response.text();
        res.status(500).json({ ok: false, error: `Brevo ${response.status}: ${body}`, config: info });
        return;
      }
      const account = await response.json() as any;
      res.json({ ok: true, message: "Brevo API-Key gültig!", email: account.email, config: info });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message, config: info });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/inquiries", publicInquiriesRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/quotes", quotesRouter);
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/protocols", protocolsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/units", unitsRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/configurator", configuratorRouter);
  app.use("/api/email-templates", emailTemplatesRouter);

  // ── 5. Static files ────────────────────────────────────────────────────────
  // Serve video/media attachments in both dev and prod
  const attachmentsPath = path.resolve(__dirname, "../attachments");
  app.use("/attachments", express.static(attachmentsPath, { maxAge: "1d" }));

  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(__dirname, "../dist/portal");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.portal.html"));
    });
  }

  // ── 6. Start listening ─────────────────────────────────────────────────────
  const port = Number(process.env.PORT ?? 3008);
  app.listen(port, () => {
    const mode = USE_POSTGRES ? "PostgreSQL" : "SQLite (local fallback)";
    console.log(`[server] Listening on http://localhost:${port} — DB: ${mode}`);
  });
}

startServer().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
