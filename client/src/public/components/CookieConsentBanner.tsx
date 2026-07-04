import { useState } from "react";
import { useCookieConsent } from "../hooks/useCookieConsent.js";

export default function CookieConsentBanner() {
  const { showBanner, acceptAll, acceptNecessary, updateConsent } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-brand-dark text-white shadow-2xl">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <p className="font-bold text-base mb-1">Wir verwenden Cookies</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Wir setzen notwendige Cookies ein, damit diese Website funktioniert. Mit Ihrer Einwilligung
              nutzen wir weitere Cookies für funktionale Zwecke. Mehr dazu in unserer{" "}
              <a href="/datenschutz" className="underline hover:text-brand-gold">
                Datenschutzerklärung
              </a>
              .
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 border-t border-gray-600 pt-4">
                {/* Necessary – always on */}
                <label className="flex items-start gap-3 cursor-not-allowed opacity-70">
                  <input type="checkbox" checked disabled className="mt-1 accent-brand-gold" />
                  <div>
                    <div className="text-sm font-semibold">Notwendig</div>
                    <div className="text-xs text-gray-400">Session, Sicherheit (CSRF). Immer aktiv.</div>
                  </div>
                </label>

                {/* Functional */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={functional}
                    onChange={(e) => setFunctional(e.target.checked)}
                    className="mt-1 accent-brand-gold"
                  />
                  <div>
                    <div className="text-sm font-semibold">Funktional</div>
                    <div className="text-xs text-gray-400">Spracheinstellung speichern.</div>
                  </div>
                </label>

                {/* Analytics – placeholder for future */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 accent-brand-gold"
                  />
                  <div>
                    <div className="text-sm font-semibold">Analytik</div>
                    <div className="text-xs text-gray-400">Anonyme Nutzungsstatistiken (z. B. Plausible).</div>
                  </div>
                </label>

                {/* Marketing – placeholder */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-1 accent-brand-gold"
                  />
                  <div>
                    <div className="text-sm font-semibold">Marketing</div>
                    <div className="text-xs text-gray-400">Werbung und Kampagnen-Tracking.</div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-brand-gold hover:opacity-90 rounded text-sm font-semibold text-black transition-colors"
            >
              Alle akzeptieren
            </button>

            {showDetails ? (
              <button
                onClick={() => updateConsent({ necessary: true, functional, analytics, marketing })}
                className="px-4 py-2 bg-white text-brand-dark hover:bg-gray-100 rounded text-sm font-semibold transition-colors"
              >
                Auswahl speichern
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
              >
                Einstellungen
              </button>
            )}

            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-gray-400 hover:text-white text-xs transition-colors"
            >
              Nur notwendige
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
