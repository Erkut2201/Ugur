import { useState, useRef, useEffect } from "react";
import PublicLayout from "../components/PublicLayout.js";
import { siteContent } from "../content/siteContent.js";
import { useLanguage } from "../i18n/LanguageProvider.js";
import ImagePlaceholder from "../components/ImagePlaceholder.js";
import { IconPin, IconPhone, IconMail } from "../components/Icons.js";
import { useCompany } from "../hooks/useCompany.js";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-white hover:text-brand-gold transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm">{question}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`flex-shrink-0 text-brand-gold transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {open && <div className="pb-5 text-sm leading-7 text-gray-400">{answer}</div>}
    </div>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  const { data: company } = useCompany();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoad = () => {
    if (videoRef.current) videoRef.current.playbackRate = 0.75;
  };

  return (
    <PublicLayout>
      {/* ── VIDEO HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden bg-black flex items-center">
        {/* Background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/Überdachung Startseite.mp4"
          autoPlay
          muted
          loop
          playsInline
          onLoadedMetadata={handleVideoLoad}
          style={{ opacity: 0.55, filter: "brightness(0.65)" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* Content */}
        <div className="relative mx-auto max-w-7xl w-full px-6 py-32 md:py-48">
          <p className="text-sm uppercase tracking-[0.5em] text-brand-gold mb-6">Premium Outdoor Living</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] text-white md:text-7xl">
            {t.home.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
            {t.home.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/angebot-anfragen"
              className="rounded-md bg-brand-gold px-8 py-3.5 font-semibold text-black shadow-xl transition hover:opacity-90 text-sm"
            >
              Angebot einholen
            </a>
            <a
              href="/produkte"
              className="rounded-md border border-white/40 px-8 py-3.5 text-sm font-medium text-white transition hover:border-brand-gold hover:text-brand-gold"
            >
              Produkte entdecken
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap gap-8 border-t border-white/10 pt-8">
            {[
              { label: "10 Jahre", sub: "Garantie" },
              { label: "Made in DE", sub: "Qualität" },
              { label: "1.000+", sub: "Projekte" },
              { label: "Kostenlos", sub: "Beratung" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xl font-bold text-brand-gold">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUKTE – Cards wie Referenz (Bild + Overlay + Button) ──── */}
      <section className="bg-brand-dark py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Sortiment</p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">Unsere Produkte</h2>
            </div>
            <a href="/produkte" className="text-sm text-brand-gold hover:text-white transition-colors hidden md:block">
              Alle Produkte →
            </a>
          </div>

          {/* 4-column grid like reference */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {siteContent.products.map((product) => (
              <a
                key={product.slug}
                href={`/${product.slug}`}
                className="group relative block overflow-hidden rounded-xl"
                style={{ minHeight: 320 }}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <ImagePlaceholder
                    src={`/images/product-${product.slug}.jpg`}
                    alt={product.title}
                    label={product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-bold text-white">{product.title}</h3>
                  <div className="mt-3 overflow-hidden">
                    <span className="inline-flex items-center gap-2 rounded-md bg-brand-gold px-4 py-2 text-xs font-bold text-black translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Mehr erfahren →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── WEINOR PARTNER ───────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#C8A96E' }} className="overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 min-h-[440px]">
            {/* Text */}
            <div className="flex flex-col justify-center px-8 py-16 lg:px-16">
              <span className="mb-6 inline-block rounded-full border border-black/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: 'rgba(0,0,0,0.6)' }}>
                Offizieller Weinor Partner
              </span>
              <h2 className="text-3xl font-black leading-tight md:text-4xl" style={{ color: '#000' }}>
                Deutsche Qualität.<br />Seit über 60 Jahren.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7" style={{ color: 'rgba(0,0,0,0.65)' }}>
                Als zertifizierter Weinor Partner bieten wir Ihnen Markisen und Überdachungen
                vom führenden deutschen Hersteller — fachgerecht geplant, individuell angepasst
                und professionell montiert.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/produkte" className="rounded-md px-6 py-3 text-sm font-bold transition" style={{ backgroundColor: '#000', color: '#C8A96E' }}>
                  Weinor Produkte
                </a>
                <a href="/kontakt" className="rounded-md border border-black/30 px-6 py-3 text-sm font-semibold transition hover:bg-black/10" style={{ color: '#000' }}>
                  Beratung anfragen
                </a>
              </div>
            </div>
            {/* Image */}
            <div className="relative min-h-[280px] overflow-hidden">
              <ImagePlaceholder
                src="/images/product-terrassenueberdachung.jpg"
                alt="Weinor Partner"
                label="Weinor Partner – Terrassenüberdachung"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-brand-gold/15" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 GRÜNDE (USP) ───────────────────────────────────────────── */}
      <section className="bg-brand-dark py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Unsere Stärken</p>
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-white md:text-5xl">
              6 Gründe, warum Kunden uns vertrauen.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[
              { n: "01", title: "Bestes Preis-Leistungs-Verhältnis", text: "Wir sind nicht 'billig', sondern stets günstig — und bieten Ihnen ein faires Preis-Leistungs-Verhältnis ohne Abstriche." },
              { n: "02", title: "Maßgefertigte Produktion", text: "Unsere Produkte fertigen wir in Deutschland nach strengen Qualitätskriterien — individuell für Sie gemessen und gebaut." },
              { n: "03", title: "Zertifizierte Qualität & Sicherheit", text: "Wir verwenden ausschließlich zertifizierte Aluminiumprofile und halten höchste Sicherheitsstandards ein." },
              { n: "04", title: "All-in-One Service", text: "Von der ersten Beratung über die Planung bis zur fertigen Montage — alles professionell aus einer Hand." },
              { n: "05", title: "Fachmännische Montage", text: "Unsere erfahrenen Monteure arbeiten nach allen gesetzlichen und technischen Vorgaben — sicher und termingerecht." },
              { n: "06", title: "10 Jahre Vorteilsgarantie", text: "Wir stehen hinter unserer Arbeit — mit bis zu 10 Jahren Garantie auf unsere Produkte und Leistungen." },
            ].map((item) => (
              <div key={item.n} className="group border-t border-white/8 px-2 py-8 transition-colors hover:bg-white/2 xl:px-6">
                <span className="text-6xl font-black leading-none text-brand-gold/15 transition-colors group-hover:text-brand-gold/35">
                  {item.n}
                </span>
                <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER MARQUEE ──────────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-white/8 bg-black py-6">
        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          {[...Array(3)].flatMap((_, gi) =>
            ["Würth", "Weinor", "Roma Rollladen", "Somfy Motors", "Serge Ferrari"].map((name, i) => (
              <span key={`${gi}-${i}`} className="flex-shrink-0 px-10 text-xs font-bold uppercase tracking-[0.4em] text-white/25 transition-colors hover:text-brand-gold">
                {name}
                <span className="ml-10 text-brand-gold/25">✦</span>
              </span>
            ))
          )}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }`}</style>
      </section>

      {/* ── FAQ + KONTAKT ─────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-20">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">
          {/* FAQ */}
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">{t.home.faqEyebrow}</p>
            <h2 className="text-3xl font-bold text-white mb-8">{t.home.faqTitle}</h2>
            <div>
              {siteContent.faqKeys.map((key) => {
                const item = t.faq[key];
                return <FaqItem key={key} question={item.q} answer={item.a} />;
              })}
            </div>
          </div>

          {/* Kontakt-Card */}
          <div className="rounded-2xl border border-brand-gold/20 bg-black p-8 flex flex-col">
            <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">{t.home.contactEyebrow}</p>
            <h3 className="text-2xl font-bold text-white">{t.home.contactTitle}</h3>
            <p className="mt-4 text-sm leading-7 text-gray-400">{t.home.contactDescription}</p>

            <div className="mt-8 space-y-4 text-sm flex-1">
              {company?.address && (
                <a href={`https://maps.google.com/?q=${company.mapsQuery}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-400 hover:text-brand-gold transition-colors">
                  <IconPin className="mt-0.5 flex-shrink-0 text-brand-gold" size={16} />
                  {company.address}
                </a>
              )}
              {company?.phone && (
                <a href={`tel:${company.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-brand-gold transition-colors">
                  <IconPhone className="flex-shrink-0 text-brand-gold" size={16} />
                  {company.phone}
                </a>
              )}
              {company?.email && (
                <a href={`mailto:${company.email}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-brand-gold transition-colors">
                  <IconMail className="flex-shrink-0 text-brand-gold" size={16} />
                  {company.email}
                </a>
              )}
            </div>

            <a href="/kontakt"
              className="mt-8 block rounded-md bg-brand-gold px-6 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90">
              {t.home.contactCta}
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}



