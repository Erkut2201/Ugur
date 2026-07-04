# Sicherheitsanforderungen

**Standard:** OWASP Top 10, DSGVO, deutsche Datenschutzgesetze

---

## 1. Anti-Scraping / Zugangsschutz

**Ziel:** Niemand soll die Website automatisch fetchen / scrapen können.

### HTTP-Security-Header (beide Domains)

```typescript
// server/middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{nonce}'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
}));
```

### Anti-Scraping-Middleware

```typescript
// server/middleware/antiScraping.ts
const BLOCKED_AGENTS = [
  'curl/', 'wget/', 'python-requests', 'scrapy', 'bot/', 'crawler',
  'spider', 'fetch/', 'Go-http-client', 'libwww-perl',
];

export function antiScraping(req, res, next) {
  const ua = req.headers['user-agent'] || '';
  const isBot = BLOCKED_AGENTS.some(b => ua.toLowerCase().includes(b.toLowerCase()));
  
  // Block known scrapers
  if (isBot) return res.status(403).json({ error: 'Access denied' });
  
  // X-Robots-Tag Header
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  
  next();
}
```

### robots.txt (für rechnungen.localhost)

```
User-agent: *
Disallow: /
```

---

## 2. Rate Limiting

```typescript
// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// API allgemein: 100 Requests / 15min pro IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// Login: 10 Versuche / 15min pro IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts' },
});

// Kontaktformular: 5 Sends / Stunde pro IP
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many contact requests' },
});
```

---

## 3. Session-Sicherheit

```typescript
// server/index.ts
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({ pool: pgPool, tableName: 'sessions' }),
  secret: process.env.SESSION_SECRET!, // min. 64 zeichen
  resave: false,
  saveUninitialized: false,
  name: '__ktsid',  // kein 'connect.sid' Standard
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    httpOnly: true,        // Kein JS-Zugriff
    sameSite: 'strict',    // CSRF-Schutz
    maxAge: 24 * 60 * 60 * 1000,  // 24 Stunden
    path: '/',
    domain: process.env.COOKIE_DOMAIN,  // '.localhost' oder eigene Domain
  },
}));
```

---

## 4. CSRF-Schutz

```typescript
// server/middleware/csrf.ts
import { doubleCsrf } from 'csrf-csrf';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET!,
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});

// Alle POST/PUT/DELETE/PATCH Routes schützen
app.use('/api', doubleCsrfProtection);
```

---

## 5. Input Validation

```typescript
// Zod-Schemas für alle API-Endpunkte
import { z } from 'zod';

// Kunden-Schema
export const customerSchema = z.object({
  salutation: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
});

// SQL-Injection durch Drizzle ORM (parameterized queries) abgedeckt
// XSS durch React (auto-escaping) abgedeckt
```

---

## 6. Passwort-Sicherheit

```typescript
// Mindestanforderungen:
const passwordSchema = z.string()
  .min(8, 'Mindestens 8 Zeichen')
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe')
  .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe')
  .regex(/[0-9]/, 'Mindestens eine Ziffer')
  .max(128);

// Hashing: bcryptjs mit 12 Runden (erhöht von 10)
import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(password, SALT_ROUNDS);
```

---

## 7. DSGVO / Cookie-Compliance

**Cookie-Kategorien:**
- **Notwendig:** Session-Cookie, CSRF-Token
- **Analytik:** (nur mit Einwilligung) Google Analytics
- **Marketing:** (nur mit Einwilligung) Social Media Pixels
- **Funktional:** Spracheinstellung

**Cookie-Banner-Anforderungen:**
- Granulare Zustimmung (nicht "alles oder nichts")
- Widerruf jederzeit möglich
- Keine vorangekreuzten Felder für optionale Cookies
- Consent wird geloggt (mit Datum + IP-Hash)

**Datenschutzerklärung:** Vollständig von konzept-terrasse.de übertragen und angepasst.

---

## 8. Sicherheits-Checkliste (vor Go-Live)

```
[ ] Alle env-Variablen gesetzt (kein Default-Wert in Production)
[ ] SESSION_SECRET: min. 64 Zeichen, kryptografisch sicher
[ ] CSRF_SECRET: min. 32 Zeichen
[ ] HTTPS aktiv (Let's Encrypt / eigenes Cert)
[ ] robots.txt korrekt gesetzt
[ ] Security Headers (via Helmet)
[ ] Rate Limiting aktiv
[ ] Anti-Scraping Middleware aktiv
[ ] SQL-Injection: Drizzle ORM parameterized queries
[ ] XSS: React auto-escaping + CSP Header
[ ] CORS: nur erlaubte Origins
[ ] File Upload: Typ + Größen-Validierung
[ ] Logs: keine Passwörter / Tokens im Log
[ ] .env: nicht in Git
[ ] Dependency Vulnerabilities: npm audit
```
