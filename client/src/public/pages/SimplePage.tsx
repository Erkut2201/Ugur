import PublicLayout from "../components/PublicLayout.js";
import { useLanguage } from "../i18n/LanguageProvider.js";

export default function SimplePage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">{eyebrow}</p>
        <h1 className="mt-6 text-4xl font-semibold text-white md:text-6xl">{title}</h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300">{description}</p>
        <div className="mt-12 rounded-[2rem] border border-brand-gold/15 bg-white/5 p-8 text-sm leading-7 text-gray-400">
          {t.pages.placeholder}
        </div>
      </section>
    </PublicLayout>
  );
}
