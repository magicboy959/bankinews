import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getHomepageData } from "@/services/homepage-service";
import { ArticleCardView } from "@/components/articles/article-card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const data = await getHomepageData(safeLocale);

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase text-red-700">{t.labels.breaking}</p>
        <div className="text-sm text-slate-700">
          {data.featured ? data.featured.title : safeLocale === "ar" ? "لا توجد أخبار عاجلة حالياً" : "No breaking item at the moment"}
        </div>
      </section>

      {data.featured && (
        <section className="rounded-2xl bg-[#0A2342] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">{t.labels.latest}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{data.featured.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">{data.featured.summary}</p>
        </section>
      )}

      <section>
        <SectionHeading title={t.labels.latest} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.latest.map((article) => (
            <ArticleCardView key={article.id} locale={safeLocale} article={article} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionHeading title={t.labels.mostRead} />
          <div className="space-y-3">
            {data.mostRead.map((article) => (
              <ArticleCardView key={`most-${article.id}`} locale={safeLocale} article={article} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeading title={t.labels.editorsPicks} />
          <div className="space-y-3">
            {data.editorsPicks.map((article) => (
              <ArticleCardView key={`pick-${article.id}`} locale={safeLocale} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <SectionHeading title={t.labels.featuredBank} />
        {data.featuredBank ? (
          <div>
            <p className="text-lg font-bold text-slate-900">{data.featuredBank.name}</p>
            <p className="mt-2 text-sm text-slate-600">{data.featuredBank.shortDescription}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{safeLocale === "ar" ? "لا يوجد بنك مميز حالياً" : "No featured bank yet"}</p>
        )}
      </section>
    </div>
  );
}
