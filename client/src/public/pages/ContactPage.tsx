import { useState } from "react";
import PublicLayout from "../components/PublicLayout.js";
import { useLanguage } from "../i18n/LanguageProvider.js";
import { useInquiryForm } from "../hooks/useInquiryForm.js";
import { useCompany } from "../hooks/useCompany.js";
import { IconPin, IconPhone, IconMail, IconMap } from "../components/Icons.js";

export default function ContactPage() {
  const { t } = useLanguage();
  const { data: company } = useCompany();
  const { isSubmitting, successMessage, errorMessage, submitJson } = useInquiryForm();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submitJson("/api/inquiries/contact", form);
    if (ok) setForm({ name: "", email: "", phone: "", message: "", consent: false });
  }

  const field = "rounded-2xl border border-brand-gold/15 bg-black/30 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-brand-gold/50 transition-colors w-full";

  return (
    <PublicLayout>
      <section className="border-b border-brand-gold/15 bg-gradient-to-b from-black to-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">{t.nav.contact}</p>
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-5xl">{t.pages.contactTitle}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">{t.pages.contactDescription}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-brand-gold/15 bg-white/5 p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Direkter Kontakt</h2>
            <div className="space-y-4 text-sm">
              {company?.address && (
                <a
                  href={`https://maps.google.com/?q=${company.mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-300 hover:text-brand-gold transition-colors"
                >
                  <IconPin className="mt-0.5 flex-shrink-0 text-brand-gold" size={16} />
                  {company.address}
                </a>
              )}
              {company?.phone && (
                <a
                  href={`tel:${company.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-gold transition-colors"
                >
                  <IconPhone className="flex-shrink-0 text-brand-gold" size={16} />
                  {company.phone}
                </a>
              )}
              {company?.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-brand-gold transition-colors"
                >
                  <IconMail className="flex-shrink-0 text-brand-gold" size={16} />
                  {company.email}
                </a>
              )}
            </div>
          </div>
          {/* Map placeholder */}
          <div className="aspect-[4/3] rounded-[2rem] border border-brand-gold/10 bg-black/30 flex flex-col items-center justify-center gap-3">
            <IconMap className="text-brand-gold/40" size={36} />
            <span className="text-xs text-gray-600">Kartenintegration folgt</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-brand-gold/15 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-white mb-8">{t.pages.contactTitle}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.pages.contactName}</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={field}
                placeholder="Max Mustermann"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.pages.contactEmail}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={field}
                placeholder="max@beispiel.de"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t.pages.contactPhone}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={field}
                placeholder="+49 …"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t.pages.contactMessage}</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className={`${field} min-h-36 resize-y`}
                placeholder="Wie können wir Ihnen helfen?"
                required
              />
            </div>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
              className="mt-1 accent-brand-gold"
              required
            />
            <span>{t.pages.contactConsent}</span>
          </label>
          {successMessage && <p className="mt-4 text-sm text-green-400">{t.pages.contactSuccess}</p>}
          {errorMessage && <p className="mt-4 text-sm text-red-400">{t.pages.contactError}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !form.consent}
            className="mt-8 rounded-full bg-brand-gold px-7 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "…" : t.pages.contactSubmit}
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}


