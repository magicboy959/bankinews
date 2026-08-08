import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { dictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/utils";
import type { ArticleCard } from "@/types";

export function ArticleCardView({
  locale,
  article,
  compact = false,
  categorySlug,
}: {
  locale: Locale;
  article: ArticleCard;
  compact?: boolean;
  categorySlug?: string;
}) {
  const t = dictionary[locale];
  const href = `/${locale}/news/${article.slug}`;

  if (compact) {
    return (
      <article className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
        {article.featuredImageUrl && (
          <Link href={href} className="shrink-0">
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              loading="lazy"
              className="h-16 w-16 rounded-lg object-cover"
            />
          </Link>
        )}
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
            <Link href={href}>{article.title}</Link>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {article.publishedAt ? formatDate(article.publishedAt, locale) : "-"} · {article.readingTimeMinutes} min
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {article.featuredImageUrl ? (
        <Link href={href} className="block">
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            loading="lazy"
            className="h-44 w-full object-cover"
          />
        </Link>
      ) : (
        <div className="h-44 w-full bg-gradient-to-br from-[#0A2342] to-[#123A63]" />
      )}

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
          {article.isBreaking && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{t.labels.breaking}</span>
          )}
          {article.isSponsored && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">{t.labels.sponsored}</span>
          )}
          {article.categoryName && (
            <Link
              href={`/${locale}/category/${article.categorySlug ?? article.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 hover:bg-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {article.categoryName}
            </Link>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-900">
          <Link href={href}>{article.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{article.summary}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{article.publishedAt ? formatDate(article.publishedAt, locale) : "-"}</span>
          <span>{article.readingTimeMinutes} min</span>
        </div>
      </div>
    </article>
  );
}
