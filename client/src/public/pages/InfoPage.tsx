import PublicLayout from "../components/PublicLayout.js";
import type { InfoPageContent } from "../content/infoPages.js";

export default function InfoPage({ page }: { page: InfoPageContent }) {
  return (
    <PublicLayout>
      <section className="border-b border-brand-gold/15 bg-gradient-to-b from-black to-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">{page.eyebrow}</p>
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-6xl">{page.title}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300">{page.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-[2rem] border border-brand-gold/15 bg-white/5 p-8">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-gray-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
