import { useState } from "react";
import PublicLayout from "../components/PublicLayout.js";
import { siteContent } from "../content/siteContent.js";
import { useLanguage } from "../i18n/LanguageProvider.js";
import { useInquiryForm } from "../hooks/useInquiryForm.js";
import { IconCheckCircle } from "../components/Icons.js";

const STEPS = [1, 2, 3] as const;

export default function OfferPage() {
  const { t } = useLanguage();
  const { isSubmitting, successMessage, errorMessage, submitFormData } = useInquiryForm();
  const [files, setFiles] = useState<FileList | null>(null);
  const [form, setForm] = useState({
    product: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
    consent: false,
  });

  const stepLabels = ["1. Produkt wählen", "2. Projektdaten", "3. Absenden"];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
    Array.from(files ?? []).forEach((f) => fd.append("files", f));
    const ok = await submitFormData("/api/inquiries/offer", fd);
    if (ok) {
      setForm({ product: "", name: "", email: "", phone: "", address: "", message: "", consent: false });
      setFiles(null);
    }
  }

  const field = "rounded-2xl border border-brand-gold/15 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-brand-gold/50 transition-colors w-full";

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-brand-gold/15 bg-gradient-to-b from-black to-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">{t.nav.offer}</p>
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-5xl">{t.pages.offerTitle}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">{t.pages.offerDescription}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        {/* Step indicator */}
        <div className="mb-10 grid grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <div key={step} className="rounded-2xl border border-brand-gold/15 bg-white/5 px-4 py-3 text-sm text-center text-gray-400">
              {stepLabels[step - 1]}
            </div>
          ))}
        </div>

        {successMessage ? (
          <div className="rounded-[2rem] border border-green-500/30 bg-green-950/30 p-10 text-center">
            <IconCheckCircle className="text-brand-gold mx-auto mb-4" size={48} />
            <p className="text-lg font-semibold text-green-400">{t.pages.offerSuccess}</p>
            <a href="/" className="mt-6 inline-block text-sm text-brand-gold hover:text-white transition-colors">
              ← Zurück zur Startseite
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-brand-gold/15 bg-white/5 p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Product */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerProduct}</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                  className={`${field} appearance-none`}
                  required
                >
                  <option value="">— Bitte wählen —</option>
                  {siteContent.products.map((p) => (
                    <option key={p.slug} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerName}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={field}
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerEmail}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={field}
                  placeholder="max@beispiel.de"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerPhone}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={field}
                  placeholder="+49 …"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerAddress}</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={field}
                  placeholder="Musterstraße 1, 12345 Stadt"
                />
              </div>

              {/* Message */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerMessage}</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className={`${field} min-h-36 resize-y`}
                  placeholder="Maße, Farbe, Besonderheiten …"
                />
              </div>

              {/* Files */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">{t.pages.offerFiles}</label>
                <div className="rounded-2xl border border-dashed border-brand-gold/20 bg-black/20 px-4 py-5">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setFiles(e.target.files)}
                    className="text-sm text-gray-400 file:mr-4 file:rounded-full file:border file:border-brand-gold/40 file:bg-transparent file:px-4 file:py-1.5 file:text-xs file:text-brand-gold hover:file:bg-brand-gold/10"
                  />
                  <p className="mt-2 text-xs text-gray-600">{t.pages.offerFilesHint}</p>
                </div>
              </div>
            </div>

            {/* Consent */}
            <label className="mt-6 flex items-start gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                className="mt-1 accent-brand-gold"
                required
              />
              <span>{t.pages.offerConsent}</span>
            </label>

            {errorMessage && <p className="mt-4 text-sm text-red-400">{t.pages.offerError}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !form.consent}
              className="mt-8 rounded-full bg-brand-gold px-8 py-3.5 font-semibold text-black shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "…" : t.pages.offerSubmit}
            </button>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
