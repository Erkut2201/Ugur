// client/src/components/Layout.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth.js";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/inquiries", label: "Anfragen", icon: "📩" },
  { href: "/customers", label: "Kunden", icon: "👥" },
  { href: "/quotes", label: "Angebote", icon: "📋" },
  { href: "/invoices", label: "Rechnungen", icon: "🧾" },
  { href: "/protocols", label: "Abnahmeprotokolle", icon: "✅" },
  { href: "/services", label: "Leistungskatalog", icon: "🔧" },
  { href: "/documents", label: "Dokumentenarchiv", icon: "📁" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark text-white flex flex-col shadow-xl transform transition-transform duration-200 md:relative md:translate-x-0 md:flex-shrink-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo area */}
        <div className="p-5 border-b border-gray-700 flex items-start justify-between">
          <div>
            <div className="text-brand-red font-black text-lg leading-tight">KONZEPT</div>
            <div className="font-bold text-white text-xl">Terrasse BW</div>
            <div className="text-xs text-gray-400 mt-1">Büroverwaltung</div>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-white p-1 mt-1 text-xl leading-none"
            onClick={() => setMenuOpen(false)}
            aria-label="Menü schließen"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon }) => {
            const isDashboard = href === "/dashboard";
            const isActive = isDashboard
              ? location === "/" || location === "/dashboard" || location === "/admin"
              : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-red text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2 truncate">{user?.email}</div>
          <button
            onClick={() => logout()}
            className="w-full text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors text-left"
          >
            🚪 Abmelden
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-brand-dark text-white px-4 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-gray-300 hover:text-white text-2xl leading-none px-1"
            aria-label="Menü öffnen"
          >
            ☰
          </button>
          <span className="text-sm font-bold tracking-wide">Planungsbüro Dietzel</span>
          <div className="w-8" />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
