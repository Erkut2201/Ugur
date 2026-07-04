import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "../i18n/LanguageProvider.js";
import { useCompany } from "../hooks/useCompany.js";
import { productPages } from "../content/products.js";

const productNav = productPages.map((p) => ({ href: `/${p.slug}`, label: p.title }));

const companyNav = [
  { href: "/unternehmen", label: "Über uns" },
  { href: "/galerie", label: "Galerie" },
  { href: "/aktionen", label: "Aktionen" },
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutzerklärung" },
  { href: "/agb", label: "AGB" },
];

function DropdownMenu({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: { href: string; label: string }[];
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = items.some((i) => currentPath === i.href || currentPath.startsWith(i.href));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm transition hover:text-white ${active ? "text-white" : "text-gray-300"}`}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 min-w-[220px] rounded-xl border border-brand-gold/15 bg-black/95 py-2 shadow-2xl backdrop-blur z-50">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 text-sm transition hover:text-brand-gold hover:bg-white/5 ${
                  currentPath === item.href ? "text-brand-gold" : "text-gray-300"
                }`}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useLanguage();
  const { data: company } = useCompany();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const [mobileCompany, setMobileCompany] = useState(false);

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">

          {/* Logo */}
          <Link href="/">
            <a className="flex items-end gap-1 select-none">
              <div className="leading-none">
                <div className="text-base font-bold tracking-tight text-white">Konzept</div>
                <div className="text-base font-bold tracking-tight text-brand-gold">Terrasse</div>
              </div>
            </a>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="/">
              <a className={`text-sm transition hover:text-white ${location === "/" ? "text-white" : "text-gray-300"}`}>
                Startseite
              </a>
            </Link>
            <DropdownMenu label="Produkte" items={productNav} currentPath={location} />
            <DropdownMenu label="Unternehmen" items={companyNav} currentPath={location} />
            <Link href="/aktionen">
              <a className={`text-sm transition hover:text-white ${location === "/aktionen" ? "text-white" : "text-gray-300"}`}>
                Aktionen
              </a>
            </Link>
            <Link href="/karriere">
              <a className={`text-sm transition hover:text-white ${location === "/karriere" ? "text-white" : "text-gray-300"}`}>
                Karriere
              </a>
            </Link>
            <Link href="/kontakt">
              <a className={`text-sm transition hover:text-white ${location === "/kontakt" ? "text-white" : "text-gray-300"}`}>
                Kontakt
              </a>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <div className="hidden rounded-full border border-brand-gold/30 p-0.5 text-xs lg:flex">
              <button
                type="button"
                onClick={() => setLocale("de")}
                className={`rounded-full px-2.5 py-1 transition ${locale === "de" ? "bg-brand-gold text-black font-semibold" : "text-gray-400"}`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded-full px-2.5 py-1 transition ${locale === "en" ? "bg-brand-gold text-black font-semibold" : "text-gray-400"}`}
              >
                EN
              </button>
            </div>

            {/* Search icon */}
            <button type="button" className="hidden text-gray-400 hover:text-white transition lg:block" aria-label="Suche">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* CTA button */}
            <Link href="/angebot-anfragen">
              <a className="rounded-md bg-brand-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 whitespace-nowrap">
                Angebot einholen
              </a>
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="text-gray-300 hover:text-white transition lg:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-black/95 px-6 py-4 lg:hidden">
            <div className="space-y-1">
              <Link href="/"><a onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-gray-300 hover:text-brand-gold">Startseite</a></Link>

              <div>
                <button
                  type="button"
                  onClick={() => setMobileProducts((v) => !v)}
                  className="flex w-full items-center justify-between py-2.5 text-sm text-gray-300 hover:text-brand-gold"
                >
                  Produkte
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileProducts ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileProducts && (
                  <div className="ml-3 mt-1 border-l border-brand-gold/20 pl-4 space-y-1">
                    {productNav.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-brand-gold">{item.label}</a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setMobileCompany((v) => !v)}
                  className="flex w-full items-center justify-between py-2.5 text-sm text-gray-300 hover:text-brand-gold"
                >
                  Unternehmen
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileCompany ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileCompany && (
                  <div className="ml-3 mt-1 border-l border-brand-gold/20 pl-4 space-y-1">
                    {companyNav.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-400 hover:text-brand-gold">{item.label}</a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/aktionen"><a onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-gray-300 hover:text-brand-gold">Aktionen</a></Link>
              <Link href="/karriere"><a onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-gray-300 hover:text-brand-gold">Karriere</a></Link>
              <Link href="/kontakt"><a onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-gray-300 hover:text-brand-gold">Kontakt</a></Link>

              <div className="pt-3">
                <Link href="/angebot-anfragen">
                  <a onClick={() => setMobileOpen(false)} className="block w-full rounded-md bg-brand-gold py-2.5 text-center text-sm font-semibold text-black">
                    Angebot einholen
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-gold/15 bg-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div>
            <div className="mb-1 text-lg font-bold text-white">Konzept</div>
            <div className="mb-4 text-lg font-bold text-brand-gold">Terrasse</div>
            <p className="text-sm leading-6 text-gray-500">{t.footer.brandText}</p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Produkte</h3>
            <ul className="space-y-2 text-sm">
              {productPages.slice(0, 6).map((p) => (
                <li key={p.slug}><Link href={`/${p.slug}`}><a className="text-gray-500 hover:text-brand-gold transition-colors">{p.title}</a></Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Unternehmen</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/unternehmen"><a className="text-gray-500 hover:text-brand-gold transition-colors">Über uns</a></Link></li>
              <li><Link href="/galerie"><a className="text-gray-500 hover:text-brand-gold transition-colors">Galerie</a></Link></li>
              <li><Link href="/aktionen"><a className="text-gray-500 hover:text-brand-gold transition-colors">Aktionen</a></Link></li>
              <li><Link href="/karriere"><a className="text-gray-500 hover:text-brand-gold transition-colors">Karriere</a></Link></li>
              <li><Link href="/kontakt"><a className="text-gray-500 hover:text-brand-gold transition-colors">Kontakt</a></Link></li>
              <li><Link href="/impressum"><a className="text-gray-500 hover:text-brand-gold transition-colors">Impressum</a></Link></li>
              <li><Link href="/datenschutz"><a className="text-gray-500 hover:text-brand-gold transition-colors">Datenschutz</a></Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">Kontakt</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              {company?.address && <li>{company.address}</li>}
              {company?.phone && (
                <li><a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-brand-gold transition-colors">{company.phone}</a></li>
              )}
              {company?.email && (
                <li><a href={`mailto:${company.email}`} className="hover:text-brand-gold transition-colors">{company.email}</a></li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5">
          <p className="text-center text-xs text-gray-700">
            © {new Date().getFullYear()} {company?.name ?? "Konzept Terrasse"} · {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}





