import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { dictionary } from "@/lib/i18n/dictionary";
import { getArticleBySlug, getPublishedArticles } from "@/services/article-service";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleCardView } from "@/components/articles/article-card";
import { formatDate } from "@/lib/utils";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const article = await getArticleBySlug(safeLocale, slug);

  if (!article) {
    notFound();
  }

  const related = (await getPublishedArticles(safeLocale, 6)).filter((a) => a.slug !== slug);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <article className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
          {article.isSponsored && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">{t.labels.sponsored}</span>}
          {article.isOpinion && <span className="rounded bg-cyan-100 px-2 py-1 text-cyan-700">{t.labels.opinion}</span>}
          {article.isPressRelease && <span className="rounded bg-slate-200 px-2 py-1 text-slate-700">{t.labels.pressRelease}</span>}
        </div>

        <h1 className="text-3xl font-black text-slate-900">{article.title}</h1>
        <p className="mt-3 text-lg text-slate-600">{article.summary}</p>

        <div className="mt-4 text-sm text-slate-500">
          {article.publishedAt ? formatDate(article.publishedAt, safeLocale) : "-"}
          <span className="mx-2">•</span>
          {article.readingTimeMinutes} min
        </div>

        <div className="mt-8">
          <ArticleContent html={article.contentHtml} />
        </div>
      </article>

      <aside>
        <h2 className="mb-4 text-xl font-black text-[#0A2342]">{t.labels.mostRead}</h2>
        <div className="space-y-3">
          {related.map((card) => (
            <ArticleCardView key={card.id} locale={safeLocale} article={card} />
          ))}
        </div>
      </aside>
    </div>
  );
}
