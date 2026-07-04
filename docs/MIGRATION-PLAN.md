# Migration & Restrukturierung — Konzept Terrasse

**Erstellt:** 2026-07-03  
**Status:** Planungsphase — KEINE CODE-IMPLEMENTIERUNG  
**Version:** 1.0

---

## Inhaltsverzeichnis

1. [Zusammenfassung](#zusammenfassung)
2. [Architektur-Änderungen](#architektur-änderungen)
3. [Brand Identity & Design System](#brand-identity--design-system)
4. [Hauptwebsite (localhost)](#hauptwebsite-localhost)
5. [Rechnungssystem (rechnungen.localhost)](#rechnungssystem-rechnungenlocalhost)
6. [Sicherheitsanforderungen](#sicherheitsanforderungen)
7. [Datenbank-Architektur](#datenbank-architektur)
8. [Umgebungsvariablen](#umgebungsvariablen)
9. [Implementierungs-Roadmap](#implementierungs-roadmap)

---

## Zusammenfassung

Das Projekt umfasst drei Hauptbereiche:

| Bereich | Domain | Beschreibung |
|---|---|---|
| **Öffentliche Website** | `localhost` | 1:1-Replik von konzept-terrasse.de, mehrsprachig (DE/EN), kein KI-Content, Premium-Qualität |
| **B2B / Rechnungsportal** | `rechnungen.localhost` | Aktuelles System + alle Funktionen von b2b.konzept-terrasse.de |
| **Datenbank** | PostgreSQL | Migration auf volle PostgreSQL-DB mit Env-Variablen |

---

## Architektur-Änderungen

### IST-Zustand

```
localhost:3008
  └── Express App
       ├── /api/*         → Business Logic (Invoices, Quotes, Protocols)
       ├── /              → React SPA (Login → Dashboard)
       └── Session Auth   → express-session + PostgreSQL/SQLite
```

Die aktuelle App ist **ausschließlich** ein internes Verwaltungstool ohne öffentliche Webseite.

### SOLL-Zustand

```
localhost
  └── Vite React App (Public Website)
       ├── /              → Homepage (Hero, Produkte, Partner, FAQ, Bewertungen)
       ├── /produkte       → Produktübersicht
       ├── /[produkt]      → 12 Produktdetailseiten
       ├── /unternehmen    → Unternehmensseiten
       ├── /kontakt        → Kontakt + Map
       ├── /angebot-anfragen → Angebotsformular
       ├── /aktionen       → Aktionen / Deals
       ├── /galerie        → Bildergalerie
       ├── /filialen       → Standorte
       ├── /impressum      → Impressum (übertragen)
       ├── /datenschutz    → Datenschutzerklärung
       └── /agb            → AGB

rechnungen.localhost
  └── Express API + React SPA (Internes B2B-Portal)
       ├── /login          → Authentifizierung
       ├── /dashboard      → Übersicht / KPIs
       ├── /kunden         → Kundenverwaltung
       ├── /angebote       → Angebotsverwaltung
       ├── /rechnungen     → Rechnungsverwaltung
       ├── /protokolle     → Abnahmeprotokolle
       ├── /dokumente      → Archiv aller Dokumente
       └── /dienstleistungen → Leistungskatalog + Einheiten
```

### Subdomain-Konfiguration (Lokal)

```
# Windows: C:\Windows\System32\drivers\etc\hosts
127.0.0.1    localhost
127.0.0.1    rechnungen.localhost
```

```typescript
// server/index.ts — Subdomain-Routing
app.use((req, res, next) => {
  const host = req.hostname; // 'localhost' oder 'rechnungen.localhost'
  const isB2B = host.startsWith('rechnungen.');
  req.isB2B = isB2B;
  next();
});
```

---

## Brand Identity & Design System

### Farbpalette (verpflichtend)

```css
/* Primärfarben */
--color-bg:           #1a1a1a;              /* Hintergrund: Dunkelgrau/fast Schwarz */
--color-bg-alt:       #000000;              /* Alternative: reines Schwarz */
--color-gold:         #C8A96E;              /* Gold: Logo, Premium, Akzente */
--color-subtitle:     #555555;              /* Untertitel, Dienstleistungen */
--color-divider:      rgba(200,169,110,.6); /* Trennlinie: Gold 60% Opacity */

/* Texte */
--color-text-primary:   #FFFFFF;
--color-text-secondary: #D0D0D0;
--color-text-muted:     #888888;

/* States */
--color-success:  #4CAF50;
--color-warning:  #FFA726;
--color-error:    #EF5350;
```

### Design-Prinzipien

- ✅ Meta / Google / Apple Niveau — absoluter Premium-Anspruch
- ✅ Kein KI-Content, keine generischen Bausteine
- ✅ Alle Texte via i18n-Variablen (EN/DE), kein hardcodierter Text
- ✅ Bildplatzhalter für echte Fotos/Videos (kein Lorem Picsum)
- ✅ Smooth Animations (60fps), performante CSS-Transitions
- ✅ WCAG 2.1 AA Barrierefreiheit
- ✅ Mobile-first, vollständig responsiv
- ❌ Keine generischen KI-Patterns oder Klischees
- ❌ Kein Emojis im UI (außer explizit gewünscht)
- ❌ Kein Lorem Ipsum
