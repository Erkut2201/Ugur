# B2B Portal — rechnungen.localhost

**Basierend auf:** b2b.konzept-terrasse.de + aktuelles Rechnungssystem  
**Ziel:** Vollständige Funktionsparität beider Systeme

---

## IST-Zustand — b2b.konzept-terrasse.de (Analysebericht)

### Login-Seite (Verifiziert)

**URL:** `/login`  
**Features:**
- E-Mail + Passwort-Formular
- "Passwort vergessen?" Link → `/forgot-password`
- "Beni Hatırla / Remember me" Checkbox
- Google reCAPTCHA Integration
- Mehrsprachig: Türkisch / Englisch (Switch in der Ecke oben links)
- Responsives Layout
- B2B-spezifisches Branding (Logo, Titel)
- Footer mit Copyright

**Login Fehlermeldungen:**
- reCAPTCHA-Verifizierung
- Ungültige Zugangsdaten

### Passwort vergessen (/forgot-password)
- E-Mail-Eingabe
- Reset-E-Mail wird versendet

---

## SOLL-Zustand — rechnungen.localhost (Vollständige Spezifikation)

### Alle Features (vereint aus beiden Systemen)

#### A. Authentifizierung

| Feature | Aktuelles System | B2B-Portal | Ziel |
|---|---|---|---|
| Login mit E-Mail + PW | ✅ | ✅ | ✅ |
| Session-basiert | ✅ | ✅ | ✅ |
| "Angemeldet bleiben" | ❌ | ✅ | ✅ |
| Passwort zurücksetzen | ❌ | ✅ | ✅ |
| reCAPTCHA | ❌ | ✅ | ✅ |
| Rate Limiting | ✅ (10/15min) | unbekannt | ✅ |
| Session Timeout | ❌ | unbekannt | ✅ 24h |
| CSRF-Schutz | ❌ | ✅ | ✅ |

---

#### B. Dashboard

**Aktuelle Karten:**
- Gesamt Angebote / Entwürfe / Gesendet / Akzeptiert
- Offene / Bezahlte / Überfällige Rechnungen
- Letzte Dokumente (Schnellzugriff)

**Erweitert (SOLL):**
- Umsatzübersicht (monatlich / jährlich)
- Ausstehende Beträge gesamt
- Aktivitäts-Feed
- Schnellerfassung (neues Angebot / Rechnung in einem Klick)

---

#### C. Kundenverwaltung

**CRUD-Operationen:**
- Anlegen, Bearbeiten, Löschen, Anzeigen
- Felder: Anrede, Vorname, Nachname, Firma, Straße, PLZ, Ort, E-Mail, Telefon, Notizen
- Suchfunktion (Name, Firma, E-Mail)
- Filter nach Kriterien
- Schnellanlage-Modal (während Dokumenterstellung)

---

#### D. Angebotsverwaltung

**Dokument-Features:**
- Erstellen, Bearbeiten, Löschen
- Status: Entwurf → Gesendet → Akzeptiert / Abgelehnt
- Positionsliste (Artikel, Menge, Einheit, Einzelpreis, Gesamt)
- MwSt.-Berechnung (Standard: 19%)
- Gültig bis (Datum)
- Zahlungsbedingungen
- PDF-Generierung (inline + Download)
- E-Mail-Versand mit PDF-Anhang
- Angebotsnummer: `ANG-{JAHR}-{NNNN}`

**Konvertierung:**
- Angebot → Rechnung (Daten werden übernommen)

---

#### E. Rechnungsverwaltung

**Dokument-Features:**
- Erstellen, Bearbeiten, Löschen
- Aus Angebot erstellen (Übernahme aller Positionen)
- Status: Entwurf → Gesendet → Bezahlt / Überfällig
- Fälligkeitsdatum
- §19 UStG Option (Kleinunternehmer)
- PDF-Generierung + S3/lokal-Speicherung
- E-Mail-Versand mit Bankverbindung im Footer
- Rechnungsnummer: `RNG-{JAHR}-{NNNN}`

---

#### F. Abnahmeprotokolle

**Features:**
- Erstellen, Bearbeiten, Löschen
- Aus Rechnung erstellen
- Positionen mit "Erledigt" Checkbox
- Status: Entwurf → Abgeschlossen → Unterzeichnet
- Standortfeld
- Mängelfeld
- PDF-Export
- Protokollnummer: `ABN-{JAHR}-{NNNN}`

---

#### G. Dokumente-Archiv

**Features:**
- Einheitliche Liste aller Dokumente (Angebote + Rechnungen + Protokolle)
- Filter nach Typ
- Suche nach Nummer, Kunde, Datum
- Signed URL für Dokument-Download (S3 oder lokal)

---

#### H. Leistungskatalog

**Services:**
- CRUD für wiederverwendbare Dienstleistungen
- Felder: Name, Beschreibung, Einheit, Preis, Kategorie, Notizen
- Einheitenkatalog (konfigurierbar)
- Schnellauswahl beim Erstellen von Positionen

---

#### I. Einstellungen (NEU — aus B2B-Portal)

**Bereiche:**
- Firmendaten (Name, Adresse, Logo, Steuernummer)
- Benutzer-Profil (E-Mail ändern, Passwort ändern)
- E-Mail-Konfiguration (SMTP/Brevo)
- Briefpapier-Upload (Header/Footer-Bild)
- Dokumenten-Präfixe (ANG/RNG/ABN)
- Standard-MwSt.-Satz

---

## Navigation (rechnungen.localhost)

```
Sidebar:
├── Dashboard
├── Kunden
├── Angebote
├── Rechnungen
├── Protokolle
├── Dokumente
├── Dienstleistungen
└── Einstellungen

Header:
├── Firmenname / Logo
├── Benutzername
└── Abmelden
```

---

## URL-Struktur

```
/                     → Login (redirect to /dashboard if authenticated)
/login                → Login-Seite
/forgot-password      → Passwort vergessen
/dashboard            → Dashboard (protected)
/kunden               → Kundenliste
/kunden/neu           → Neuen Kunden anlegen
/kunden/:id           → Kundendetail
/kunden/:id/bearbeiten → Kunden bearbeiten
/angebote             → Angebotsliste
/angebote/neu         → Neues Angebot
/angebote/:id         → Angebotsdetail
/rechnungen           → Rechnungsliste
/rechnungen/neu       → Neue Rechnung
/rechnungen/:id       → Rechnungsdetail
/protokolle           → Protokollliste
/protokolle/neu       → Neues Protokoll
/protokolle/:id       → Protokolldetail
/dokumente            → Archiv
/dienstleistungen     → Leistungskatalog
/einstellungen        → Einstellungen
```
