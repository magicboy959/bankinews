import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { dictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/utils";
import type { ArticleCard } from "@/types";

export function ArticleCardView({
  locale,
  article,
  compact = false,
}: {
  locale: Locale;
  article: ArticleCard;
  compact?: boolean;
}) {
  const t = dictionary[locale];
  const href = `/${locale}/news/${article.slug}`;
  const isBreaking = article.isBreaking === true || article.isBreaking === 1;
  const isSponsored = article.isSponsored === true || article.isSponsored === 1;
  const readingTime = locale === "ar" ? `${article.readingTimeMinutes} دقائق قراءة` : `${article.readingTimeMinutes} min read`;

  if (compact) {
    return (
      <article className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-[0_10px_30px_rgba(2,6,23,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40 hover:shadow-[0_16px_36px_rgba(2,6,23,0.12)]">
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
          <h3 className="break-words text-sm font-bold leading-5 text-[var(--foreground)] sm:line-clamp-2">
            <Link href={href}>{article.title}</Link>
          </h3>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            {article.publishedAt ? formatDate(article.publishedAt, locale) : "-"} · {readingTime}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_10px_30px_rgba(2,6,23,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40 hover:shadow-[0_16px_36px_rgba(2,6,23,0.12)]">
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
          {isBreaking ? (
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{t.labels.breaking}</span>
          ) : null}
          {isSponsored ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">{t.labels.sponsored}</span>
          ) : null}
          {article.categoryName && (
            <Link
              href={`/${locale}/category/${article.categorySlug ?? article.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)]"
            >
              {article.categoryName}
            </Link>
          )}
        </div>

        <h3 className="break-words text-base font-extrabold leading-snug text-[var(--foreground)] sm:line-clamp-2">
          <Link href={href}>{article.title}</Link>
        </h3>
        <p className="mt-2 break-words text-sm leading-5 text-[var(--text-muted)] sm:line-clamp-2">{article.summary}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span>{article.publishedAt ? formatDate(article.publishedAt, locale) : "-"}</span>
          <span>{readingTime}</span>
        </div>
      </div>
    </article>
  );
}
