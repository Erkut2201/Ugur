export interface InfoSection {
  title: string;
  body: string[];
}

export interface InfoPageContent {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
}

export const companyPage: InfoPageContent = {
  eyebrow: "Unternehmen",
  title: "Über Konzept Terrasse",
  description:
    "Konzept Terrasse plant und realisiert hochwertige Überdachungs- und Outdoor-Living-Lösungen mit Fokus auf Präzision, Langlebigkeit und fachgerechte Montage.",
  sections: [
    {
      title: "Leistungsspektrum",
      body: [
        "Terrassenüberdachungen, Wintergärten, Lamellendächer, Pergolen, Carports und passende Beschattungssysteme werden projektbezogen geplant.",
        "Die Ausrichtung bleibt klar: maßgefertigte Lösungen mit hochwertiger Ausführung und abgestimmter Montage.",
      ],
    },
    {
      title: "Standorte",
      body: [
        "Hauptsitz: Jakob-Krebs-Str. 53, 47877 Willich.",
        "Lager: Maysweg 1, 47918 Tönisvorst-St. Tönis.",
      ],
    },
    {
      title: "Anspruch",
      body: [
        "Im Mittelpunkt stehen geprüfte Systeme, klare Gestaltung, hohe Materialqualität und eine belastbare Projektabwicklung.",
        "Die öffentliche Website wird schrittweise in eine vollständig mehrsprachige Struktur überführt.",
      ],
    },
  ],
};

export const imprintPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Impressum",
  description: "Angaben gemäß § 5 TMG für Konzept Terrasse.",
  sections: [
    {
      title: "Anbieter",
      body: [
        "Ünal M.",
        "Konzept Terrasse",
        "Jakob-Krebs-Str. 53",
        "47877 Willich",
      ],
    },
    {
      title: "Kontakt",
      body: [
        "Telefon: +49 2156 9106557",
        "E-Mail: info@konzept-terrasse.de",
        "Umsatzsteuer-ID: DE340233186",
      ],
    },
    {
      title: "Verantwortlich",
      body: [
        "Redaktionell verantwortlich: Konzept Terrasse, Ünal M., Jakob-Krebs-Str. 53, 47877 Willich.",
        "EU-Streitschlichtung: https://ec.europa.eu/consumers/odr/.",
        "Nicht bereit oder verpflichtet zur Teilnahme an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle.",
      ],
    },
  ],
};

export const privacyPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Datenschutzerklärung",
  description: "Vorläufig strukturierte Datenschutzseite mit den zentralen Themen der späteren vollständigen DSGVO-Fassung.",
  sections: [
    {
      title: "Allgemeine Hinweise",
      body: [
        "Diese Website verarbeitet technische Zugriffsdaten, Formularangaben und notwendige Sicherheitsinformationen nur im erforderlichen Umfang.",
        "Die endgültige Fassung wird an die produktive Infrastruktur, Consent-Logik und eingebundene Dienste angepasst.",
      ],
    },
    {
      title: "Server und Sicherheit",
      body: [
        "Zum Schutz der Plattform werden Sicherheitsheader, Session-Cookies und technische Schutzmaßnahmen gegen missbräuchliche Zugriffe eingesetzt.",
        "Interne Bereiche werden zusätzlich für Indexierung gesperrt und restriktiver behandelt.",
      ],
    },
    {
      title: "Kontaktanfragen",
      body: [
        "Bei einer Kontakt- oder Angebotsanfrage werden die übermittelten Daten ausschließlich zur Bearbeitung des jeweiligen Anliegens verwendet.",
        "Weitere Angaben zu Speicherdauer, Rechtsgrundlagen und Empfängern folgen mit der finalen Datenschutzerklärung.",
      ],
    },
  ],
};

export const termsPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Allgemeine Geschäftsbedingungen",
  description: "Vorstrukturierte AGB-Seite als Grundlage für die vollständige juristische Endfassung.",
  sections: [
    {
      title: "Geltungsbereich",
      body: [
        "Die späteren AGB regeln Angebote, Lieferungen, Montagen und ergänzende Leistungen von Konzept Terrasse.",
        "Diese Darstellung ist ein Platzhalter mit echter Seitenstruktur, aber noch keine abschließende Rechtsfassung.",
      ],
    },
    {
      title: "Leistungen und Angebote",
      body: [
        "Angebote erfolgen projektbezogen und unter Berücksichtigung technischer sowie örtlicher Rahmenbedingungen.",
        "Verbindliche Leistungsumfänge ergeben sich aus der jeweiligen individuellen Vereinbarung.",
      ],
    },
    {
      title: "Nächster Ausbauschritt",
      body: [
        "Im nächsten Schritt kann die vollständige juristische Fassung in DE/EN eingepflegt und sauber versioniert werden.",
      ],
    },
  ],
};
