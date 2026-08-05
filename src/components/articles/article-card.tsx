import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { dictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/utils";
import type { ArticleCard } from "@/types";

export function ArticleCardView({ locale, article }: { locale: Locale; article: ArticleCard }) {
  const t = dictionary[locale];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex gap-2 text-xs font-bold uppercase tracking-wide">
        {article.isBreaking && <span className="rounded bg-red-100 px-2 py-1 text-red-700">{t.labels.breaking}</span>}
        {article.isSponsored && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">{t.labels.sponsored}</span>}
      </div>
      <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900">
        <Link href={`/${locale}/news/${article.slug}`}>{article.title}</Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{article.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{article.publishedAt ? formatDate(article.publishedAt, locale) : "-"}</span>
        <span>{article.readingTimeMinutes} min</span>
      </div>
    </article>
  );
}
