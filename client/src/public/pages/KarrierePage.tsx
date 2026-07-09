import PublicLayout from "../components/PublicLayout.js";
import { Link } from "wouter";

const positions = [
  {
    title: "Monteur / Terrassenbauer (m/w/d)",
    type: "Vollzeit",
    location: "Tübingen & Region",
    description:
      "Du montierst und installierst unsere Terrassenüberdachungen, Wintergärten und Pergolen direkt beim Kunden vor Ort. Handwerkliches Geschick, Zuverlässigkeit und Teamgeist sind gefragt.",
    tasks: [
      "Montage und Aufbau von Aluminium-Terrassensystemen",
      "Einbau von Verglasung, Markisen und Zubehör",
      "Kundenbetreuung und Übergabe vor Ort",
      "Dokumentation der ausgeführten Arbeiten",
    ],
    requirements: [
      "Abgeschlossene handwerkliche Ausbildung (Metallbauer, Schlosser, Zimmermann o. ä.)",
      "Erfahrung im Außenbereich und ggf. mit Aluminium-Konstruktionen",
      "Führerschein Klasse B",
      "Selbstständige, sorgfältige Arbeitsweise",
    ],
  },
  {
    title: "Projektleiter Außendienst (m/w/d)",
    type: "Vollzeit",
    location: "Region Baden-Württemberg",
    description:
      "Als Projektleiter betreust du unsere Kunden von der ersten Beratung bis zur Abnahme. Du planst Projekte, koordinierst die Montage und sorgst für reibungslose Abläufe.",
    tasks: [
      "Kundenberatung und Angebotserstellung",
      "Projektplanung und Koordination der Montage-Teams",
      "Technische Klärung mit Herstellern und Lieferanten",
      "Nachbetreuung und Qualitätssicherung",
    ],
    requirements: [
      "Technisches Studium oder Ausbildung im Bauwesen / Handwerk",
      "Erfahrung im Vertrieb oder Projektmanagement",
      "Kommunikationsstärke und Kundenorientierung",
      "Führerschein Klasse B",
    ],
  },
  {
    title: "Bürokraft / Auftragsabwicklung (m/w/d)",
    type: "Teilzeit / Vollzeit",
    location: "Tübingen (Büro)",
    description:
      "Du unterstützt unser Team in der Auftragsabwicklung, Kundenkommunikation und allgemeinen Büroorganisation. Strukturiertes Arbeiten und ein freundliches Auftreten sind dein Markenzeichen.",
    tasks: [
      "Auftragserfassung und -verwaltung",
      "Telefonische und schriftliche Kundenkommunikation",
      "Terminkoordination und Planung",
      "Allgemeine Bürotätigkeiten",
    ],
    requirements: [
      "Abgeschlossene kaufmännische Ausbildung",
      "Sicherer Umgang mit MS Office",
      "Organisationstalent und freundliches Auftreten",
      "Deutsch fließend in Wort und Schrift",
    ],
  },
];

const benefits = [
  { icon: "💰", label: "Faire Vergütung", text: "Wettbewerbsfähiges Gehalt, pünktliche Zahlung, regelmäßige Entwicklungsgespräche." },
  { icon: "🏗️", label: "Sinnvolle Arbeit", text: "Du siehst, was du erschaffst — hochwertige Projekte, zufriedene Kunden." },
  { icon: "🤝", label: "Kollegiales Team", text: "Flache Hierarchien, kurze Entscheidungswege, familiäre Atmosphäre." },
  { icon: "📚", label: "Weiterbildung", text: "Schulungen bei Herstellern, interne Weiterentwicklung, Förderung von Zertifizierungen." },
  { icon: "🚗", label: "Dienstwagen", text: "Für Außendienst-Positionen stellen wir Firmenwagen zur Verfügung." },
  { icon: "🌟", label: "Wachstum", text: "Wir wachsen stetig — mit uns wächst auch deine Karriere." },
];

export default function KarrierePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm uppercase tracking-[0.45em] text-brand-gold">Karriere</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Werde Teil unseres Teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Bei AC Premium Bau gestaltest du Premium-Außenbereiche mit — von der ersten Beratung bis zur Fertigstellung. Wir suchen engagierte Menschen, die mit uns wachsen wollen.
          </p>
          <a
            href="mailto:karriere@acpremiumbau.de"
            className="mt-8 inline-block rounded-md bg-brand-gold px-8 py-3.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Jetzt bewerben
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-brand-dark py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Was wir bieten</p>
            <h2 className="text-3xl font-bold text-white">Deine Vorteile bei uns</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.label} className="rounded-2xl border border-brand-gold/15 bg-white/3 p-7 hover:border-brand-gold/40 transition-colors">
                <div className="text-2xl mb-4">{b.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-2">{b.label}</h3>
                <p className="text-sm text-gray-500 leading-6">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="bg-black py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Offene Stellen</p>
            <h2 className="text-3xl font-bold text-white">Aktuelle Stellenangebote</h2>
          </div>

          <div className="space-y-6">
            {positions.map((pos) => (
              <div key={pos.title} className="rounded-2xl border border-brand-gold/15 bg-white/3 p-8 hover:border-brand-gold/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{pos.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <span className="rounded-full border border-brand-gold/30 px-3 py-1 text-xs text-brand-gold">{pos.type}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">{pos.location}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:karriere@acpremiumbau.de?subject=Bewerbung: ${encodeURIComponent(pos.title)}`}
                    className="rounded-md bg-brand-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 whitespace-nowrap"
                  >
                    Bewerben
                  </a>
                </div>

                <p className="mt-5 text-sm leading-7 text-gray-400">{pos.description}</p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Aufgaben</h4>
                    <ul className="space-y-2">
                      {pos.tasks.map((t) => (
                        <li key={t} className="flex items-start gap-2.5 text-sm text-gray-400">
                          <svg className="mt-0.5 flex-shrink-0 text-brand-gold" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Voraussetzungen</h4>
                    <ul className="space-y-2">
                      {pos.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-sm text-gray-400">
                          <svg className="mt-0.5 flex-shrink-0 text-brand-gold" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spontaneous application */}
      <section className="bg-brand-dark py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Initiativbewerbung</p>
          <h2 className="text-2xl font-bold text-white mb-4">Keine passende Stelle dabei?</h2>
          <p className="text-gray-400 text-sm leading-7 mb-8">
            Wir freuen uns immer über motivierte Bewerbungen. Schick uns deine Initiativbewerbung — wir melden uns bei dir.
          </p>
          <a
            href="mailto:karriere@acpremiumbau.de"
            className="inline-block rounded-md border border-brand-gold/50 px-7 py-3 text-sm font-medium text-brand-gold hover:bg-brand-gold hover:text-black transition-colors"
          >
            Initiativbewerbung senden
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
