import PublicLayout from "../components/PublicLayout.js";
import type { ProductPageContent } from "../content/products.js";
import { useLanguage } from "../i18n/LanguageProvider.js";
import ImagePlaceholder from "../components/ImagePlaceholder.js";
import { IconCheck, IconCheckCircle } from "../components/Icons.js";
import { Link } from "wouter";
import { productPages } from "../content/products.js";

export default function ProductPage({ product }: { product: ProductPageContent }) {
  const { t } = useLanguage();

  const related = productPages
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => (a.category === product.category ? -1 : b.category === product.category ? 1 : 0))
    .slice(0, 3);

  return (
    <PublicLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <ImagePlaceholder
            src={`/images/product-${product.slug}.jpg`}
            alt={product.title}
            label={product.title}
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl w-full px-6 py-28 md:py-36">
          <p className="text-sm uppercase tracking-[0.45em] text-brand-gold">{product.category}</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">
            {product.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">{product.intro}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/angebot-anfragen">
              <a className="rounded-md bg-brand-gold px-8 py-3.5 text-sm font-semibold text-black transition hover:opacity-90">
                Angebot anfragen
              </a>
            </Link>
            <Link href="/kontakt">
              <a className="rounded-md border border-white/30 px-8 py-3.5 text-sm font-medium text-white transition hover:border-brand-gold hover:text-brand-gold">
                Beratung vereinbaren
              </a>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {product.highlights.map((h) => (
              <span key={h} className="flex items-center gap-2 rounded-full border border-brand-gold/25 bg-black/50 px-4 py-2 text-xs text-brand-gold backdrop-blur">
                <span className="h-1 w-1 rounded-full bg-brand-gold" />
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIONS (echter Inhalt von der Referenzseite) ──────────────── */}
      {product.sections && product.sections.length > 0 && (
        <section className="bg-brand-dark py-20">
          <div className="mx-auto max-w-5xl px-6 space-y-16">
            {product.sections.map((section, i) => (
              <div key={i} className="border-b border-white/8 pb-14 last:border-0 last:pb-0">
                <div className="flex items-start gap-4 mb-6">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-brand-gold/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.heading}</h2>
                </div>
                <p className="text-gray-400 leading-8 text-sm ml-9">{section.text}</p>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-5 ml-9 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-3 text-sm text-gray-300">
                        <IconCheck className="flex-shrink-0 text-brand-gold" size={14} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HIGHLIGHTS + BENEFITS (wenn keine sections) ─────────────────── */}
      {(!product.sections || product.sections.length === 0) && (
        <section className="bg-brand-dark py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Highlights</p>
                <ul className="space-y-3">
                  {product.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
                      <IconCheckCircle className="flex-shrink-0 text-brand-gold" size={18} />
                      <span className="text-sm font-medium text-white">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Vorteile</p>
                <ul className="space-y-3">
                  {product.benefits.map((item) => (
                    <li key={item} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
                      <IconCheck className="flex-shrink-0 text-brand-gold" size={16} />
                      <span className="text-sm text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── VORTEILE ÜBERSICHT ───────────────────────────────────────────── */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">
            {product.advantageTitle ?? "Ihre Vorteile auf einen Blick"}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 rounded-xl border border-brand-gold/12 bg-white/3 p-4">
                <IconCheckCircle className="mt-0.5 flex-shrink-0 text-brand-gold" size={16} />
                <span className="text-sm text-gray-300">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERIE ──────────────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Galerie</p>
          <h2 className="text-2xl font-bold text-white mb-8">{product.title} in der Praxis</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2 aspect-[16/9] rounded-2xl overflow-hidden">
              <ImagePlaceholder
                src={`/images/product-${product.slug}.jpg`}
                alt={`${product.title} – Hauptbild`}
                label={`${product.title} – Detail 1`}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="flex flex-col gap-4">
              {[2, 3].map((n) => (
                <div key={n} className="flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 140 }}>
                  <ImagePlaceholder
                    label={`${product.title} – Detail ${n}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#C8A96E' }} className="py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold" style={{ color: '#000' }}>Interesse an {product.title}?</h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'rgba(0,0,0,0.65)' }}>
            Fordern Sie jetzt Ihr persönliches Angebot an — kostenlos und unverbindlich.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/angebot-anfragen">
              <a className="rounded-md px-8 py-3.5 text-sm font-bold transition" style={{ backgroundColor: '#000', color: '#C8A96E' }}>
                Kostenloses Angebot anfordern
              </a>
            </Link>
            <Link href="/kontakt">
              <a className="rounded-md border px-8 py-3.5 text-sm font-semibold transition" style={{ borderColor: 'rgba(0,0,0,0.3)', color: '#000' }}>
                Rückruf vereinbaren
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ÄHNLICHE PRODUKTE ────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-gold mb-3">Weitere Produkte</p>
          <h2 className="text-2xl font-bold text-white mb-8">Das könnte Sie auch interessieren</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/${p.slug}`}>
                <a className="group relative block overflow-hidden rounded-2xl" style={{ minHeight: 220 }}>
                  <div className="absolute inset-0">
                    <ImagePlaceholder
                      src={`/images/product-${p.slug}.jpg`}
                      alt={p.title}
                      label={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs text-brand-gold/80 uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-base font-bold text-white">{p.title}</h3>
                    <span className="mt-2 inline-flex items-center text-xs text-brand-gold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Mehr erfahren →
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}




