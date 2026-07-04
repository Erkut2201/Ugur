import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ConsentState {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface ConsentContextValue {
  consentGiven: boolean;
  consent: ConsentState;
  acceptAll: () => void;
  acceptNecessary: () => void;
  updateConsent: (state: ConsentState) => void;
  showBanner: boolean;
  closeBanner: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

const STORAGE_KEY = "kt_cookie_consent";

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true, // always true
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed.consent);
        setConsentGiven(true);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  function saveConsent(state: ConsentState) {
    const data = { consent: state, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsent(state);
    setConsentGiven(true);
    setShowBanner(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, functional: true, analytics: true, marketing: true });
  }

  function acceptNecessary() {
    saveConsent({ necessary: true, functional: false, analytics: false, marketing: false });
  }

  function updateConsent(state: ConsentState) {
    saveConsent({ ...state, necessary: true });
  }

  function closeBanner() {
    setShowBanner(false);
  }

  return (
    <ConsentContext.Provider
      value={{ consentGiven, consent, acceptAll, acceptNecessary, updateConsent, showBanner, closeBanner }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
