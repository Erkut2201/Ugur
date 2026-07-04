# Umgebungsvariablen — .env Erweiterung

**Alle Variablen müssen gesetzt sein. Keine Defaults in Production.**

---

## Vollständige .env Struktur (SOLL)

```env
# ─────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────
PORT=3008
NODE_ENV=development

# Subdomain-Konfiguration
BASE_DOMAIN=localhost
PUBLIC_URL=http://localhost
INVOICE_URL=http://rechnungen.localhost
COOKIE_DOMAIN=localhost

# ─────────────────────────────────────────────
# DATENBANK — PostgreSQL (Pflicht)
# ─────────────────────────────────────────────
PG_HOST=ep-wandering-tooth-ambs97ep.c-5.us-east-1.aws.neon.tech
PG_PORT=5432
PG_USER=neondb_owner
PG_PASSWORD=<SECRET>
PG_DATABASE=neondb
PG_SSL=true

# Lokales Fallback (optional, nur Development)
# SQLITE_PATH=./data/local.db

# ─────────────────────────────────────────────
# SICHERHEIT (Pflicht)
# ─────────────────────────────────────────────
# Mindestens 64 Zeichen, kryptografisch zufällig
# Generieren: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
SESSION_SECRET=<BASE64_64_CHARS>

# CSRF-Secret (Mindestens 32 Zeichen)
CSRF_SECRET=<RANDOM_32_CHARS>

# ─────────────────────────────────────────────
# ADMIN-ACCOUNT (wird beim ersten Start erstellt)
# ─────────────────────────────────────────────
ADMIN_EMAIL=admin@konzept-terrasse.de
ADMIN_PASSWORD=<STRONG_PASSWORD>

# ─────────────────────────────────────────────
# FIRMENDATEN (für PDFs, E-Mails, Impressum)
# ─────────────────────────────────────────────
COMPANY_NAME=Konzept Terrasse
COMPANY_OWNER=Ünal M.
COMPANY_STREET=Jakob-Krebs-Str. 53
COMPANY_ZIP=47877
COMPANY_CITY=Willich
COMPANY_PHONE=+49 2156 9106557
COMPANY_EMAIL=info@konzept-terrasse.de
COMPANY_WEBSITE=https://konzept-terrasse.de
COMPANY_HEADER_IMAGE=attachments/header.jpg

# Steuer
COMPANY_VAT_ID=DE340233186
COMPANY_TAX_ID=
DEFAULT_VAT_RATE=19

# Bank
COMPANY_BANK_NAME=
COMPANY_IBAN=
COMPANY_BIC=

# ─────────────────────────────────────────────
# DOKUMENT-PRÄFIXE
# ─────────────────────────────────────────────
QUOTE_PREFIX=ANG
INVOICE_PREFIX=RNG
PROTOCOL_PREFIX=ABN

# ─────────────────────────────────────────────
# E-MAIL (Brevo API oder SMTP)
# ─────────────────────────────────────────────
BREVO_API_KEY=
BREVO_FROM=

# SMTP Fallback
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# ─────────────────────────────────────────────
# CLOUD STORAGE (S3 oder lokal)
# ─────────────────────────────────────────────
S3_BUCKET=
S3_REGION=eu-central-1
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
LOCAL_STORAGE_PATH=./data/pdfs

# ─────────────────────────────────────────────
# WEBSITE (Public — localhost)
# ─────────────────────────────────────────────
# Google Maps Embed
GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_PLACE_ID=

# Google Analytics (optional)
GA_MEASUREMENT_ID=

# reCAPTCHA für Formulare
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# ─────────────────────────────────────────────
# I18N
# ─────────────────────────────────────────────
DEFAULT_LOCALE=de
SUPPORTED_LOCALES=de,en
```

---

## .env.template (Checkliste für neue Deployments)

```env
PORT=3008
NODE_ENV=production
BASE_DOMAIN=
PUBLIC_URL=
INVOICE_URL=
COOKIE_DOMAIN=
PG_HOST=
PG_PORT=5432
PG_USER=
PG_PASSWORD=
PG_DATABASE=
PG_SSL=true
SESSION_SECRET=
CSRF_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
COMPANY_NAME=
COMPANY_OWNER=
COMPANY_STREET=
COMPANY_ZIP=
COMPANY_CITY=
COMPANY_PHONE=
COMPANY_EMAIL=
COMPANY_WEBSITE=
COMPANY_VAT_ID=
DEFAULT_VAT_RATE=19
QUOTE_PREFIX=ANG
INVOICE_PREFIX=RNG
PROTOCOL_PREFIX=ABN
```

---

## Neue Variablen im Vergleich zum Ist-Zustand

| Variable | Status | Beschreibung |
|---|---|---|
| `CSRF_SECRET` | **NEU** | CSRF-Schutz |
| `COOKIE_DOMAIN` | **NEU** | Cookie-Scope für Subdomains |
| `INVOICE_URL` | **NEU** | rechnungen.localhost URL |
| `PUBLIC_URL` | **NEU** | Öffentliche Website URL |
| `COMPANY_OWNER` | **NEU** | Name des Inhabers (Impressum) |
| `GOOGLE_MAPS_API_KEY` | **NEU** | Maps Embed auf Kontaktseite |
| `RECAPTCHA_SITE_KEY` | **NEU** | Anti-Spam auf Formularen |
| `RECAPTCHA_SECRET_KEY` | **NEU** | Server-seitige Verifikation |
| `DEFAULT_LOCALE` | **NEU** | Standard-Sprache (de) |
| `SUPPORTED_LOCALES` | **NEU** | Verfügbare Sprachen |
| `GA_MEASUREMENT_ID` | **NEU** | Google Analytics 4 |
