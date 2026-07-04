# Datenbank-Architektur — PostgreSQL

**Migration:** SQLite-Fallback entfernen, vollständig auf PostgreSQL umstellen

---

## Schema-Erweiterungen (SOLL)

### Neue Tabellen für Website

```sql
-- Kontaktformular-Einträge
CREATE TABLE contact_submissions (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  message     TEXT NOT NULL,
  product     TEXT,
  ip_hash     TEXT,       -- gehashte IP für DSGVO
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Cookie-Consents (DSGVO-Compliance)
CREATE TABLE cookie_consents (
  id             SERIAL PRIMARY KEY,
  session_id     TEXT NOT NULL,
  necessary      BOOLEAN DEFAULT TRUE,
  analytics      BOOLEAN DEFAULT FALSE,
  marketing      BOOLEAN DEFAULT FALSE,
  functional     BOOLEAN DEFAULT FALSE,
  ip_hash        TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Angebotsanfragen (Website-Formular)
CREATE TABLE quote_requests (
  id          SERIAL PRIMARY KEY,
  product     TEXT NOT NULL,
  first_name  TEXT,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  message     TEXT,
  images      TEXT[],     -- Array von Datei-Keys
  status      TEXT DEFAULT 'new',  -- new, reviewed, converted
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Bestehende Tabellen (unverändert)

```
users
customers
quotes + quoteItems
invoices + invoiceItems
protocols + protocolItems
services
unitsCatalog
documentCounters
sessions (connect-pg-simple)
```

---

## Drizzle ORM Konfiguration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host:     process.env.PG_HOST!,
    port:     Number(process.env.PG_PORT) || 5432,
    user:     process.env.PG_USER!,
    password: process.env.PG_PASSWORD!,
    database: process.env.PG_DATABASE!,
    ssl:      process.env.PG_SSL === 'true',
  },
});
```

---

## Migrationsablauf

```bash
# 1. Schema erzeugen
npm run db:generate

# 2. Schema anwenden
npm run db:push

# 3. Admin-Account erstellen (automatisch beim Start)
npm run migrate
```
