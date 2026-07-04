import PublicLayout from "../components/PublicLayout.js";
import { siteContent } from "../content/siteContent.js";
import { useLanguage } from "../i18n/LanguageProvider.js";
import ImagePlaceholder from "../components/ImagePlaceholder.js";
import { Link } from "wouter";

export default function ProductsOverviewPage() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-black py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-gold">Sortiment</p>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">{t.pages.productsTitle}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-400">{t.pages.productsDescription}</p>
        </div>
      </section>

      {/* Product grid — full-bleed overlay cards */}
      <section className="bg-brand-dark pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {siteContent.products.map((product) => (
              <Link key={product.slug} href={`/${product.slug}`}>
                <a className="group relative block overflow-hidden rounded-2xl" style={{ minHeight: 300 }}>
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <ImagePlaceholder
                      src={`/images/product-${product.slug}.jpg`}
                      alt={product.title}
                      label={product.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  {/* Dark gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold/80 mb-1">{product.category}</p>
                    <h2 className="text-xl font-bold text-white leading-tight">{product.title}</h2>
                    <div className="mt-3 overflow-hidden h-8">
                      <span className="inline-flex items-center gap-2 rounded-md bg-brand-gold px-4 py-1.5 text-xs font-bold text-black translate-y-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Mehr erfahren →
                      </span>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          {/* CTA banner */}
          <div className="mt-12 rounded-2xl border border-brand-gold/20 bg-black p-8 text-center">
            <h3 className="text-lg font-bold text-white">Kein passendes Produkt dabei?</h3>
            <p className="mt-2 text-sm text-gray-500">Wir fertigen auch individuelle Sonderlösungen – sprechen Sie uns an.</p>
            <Link href="/kontakt">
              <a className="mt-6 inline-block rounded-md bg-brand-gold px-7 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                Kostenlose Beratung anfragen
              </a>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
