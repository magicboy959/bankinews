import type { Metadata } from "next";
import Link from "next/link";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils";
import { getPublishedArticleCount, getPublishedArticles } from "@/services/article-service";

const PAGE_SIZE = 16;
const AD_AFTER_INDEXES = new Set([4, 10]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "خلاصة الأخبار المصرفية" : "Banking News Feed",
    description:
      safeLocale === "ar"
        ? "خلاصة مرتبة لأحدث أخبار البنوك والخدمات المالية في السودان"
        : "A structured feed of the latest banking and financial news in Sudan",
    path: `/${safeLocale}/feeds`,
  });
}

export default async function FeedsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [articles, total] = await Promise.all([
    getPublishedArticles(safeLocale, PAGE_SIZE, offset),
    getPublishedArticleCount(safeLocale),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 border-b border-[var(--border)] pb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#005F73]">
          {safeLocale === "ar" ? "بنكي نيوز" : "BankiNews"}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
          {safeLocale === "ar" ? "خلاصة الأخبار" : "News Feed"}
        </h1>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text-muted)]">
          {safeLocale === "ar" ? "لا توجد مواد منشورة حالياً." : "No published items yet."}
        </p>
      ) : (
        <ol className="feed-list space-y-4" aria-label={safeLocale === "ar" ? "خلاصة الأخبار" : "News feed"}>
          {articles.map((article, index) => {
            const href = `/${safeLocale}/news/${article.slug}`;
            const isSponsored = article.isSponsored === true || article.isSponsored === 1;

            return (
              <li key={article.id} className="feed-item space-y-4">
                <article
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] transition hover:border-[color:var(--accent)]/40"
                  itemScope
                  itemType="https://schema.org/NewsArticle"
                >
                  <Link href={href} className="grid gap-4 sm:grid-cols-[144px_1fr]">
                    {article.featuredImageUrl ? (
                      <img
                        src={article.featuredImageUrl}
                        alt={article.title}
                        loading="lazy"
                        className="hidden h-28 w-36 rounded-lg object-cover sm:block"
                        itemProp="image"
                      />
                    ) : (
                      <span className="hidden h-28 w-36 rounded-lg bg-gradient-to-br from-[#0A2342] to-[#123A63] sm:block" />
                    )}
                    <span className="min-w-0">
                      <span className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
                        {article.categoryName ? (
                          <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-[var(--text-muted)]">
                            {article.categoryName}
                          </span>
                        ) : null}
                        {isSponsored ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                            {safeLocale === "ar" ? "محتوى برعاية" : "Sponsored"}
                          </span>
                        ) : null}
                      </span>
                      <span className="block break-words text-lg font-black leading-6 text-[var(--foreground)]" itemProp="headline">
                        {article.title}
                      </span>
                      <span className="mt-2 block break-words text-sm leading-6 text-[var(--text-muted)]" itemProp="description">
                        {article.summary}
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-subtle)]">
                        <time dateTime={article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined} itemProp="datePublished">
                          {article.publishedAt ? formatDate(article.publishedAt, safeLocale) : "-"}
                        </time>
                        <span aria-hidden="true">•</span>
                        <span>
                          {safeLocale === "ar"
                            ? `${article.readingTimeMinutes} دقائق قراءة`
                            : `${article.readingTimeMinutes} min read`}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <meta itemProp="url" content={href} />
                </article>

                {AD_AFTER_INDEXES.has(index + 1) ? (
                  <div className="feed-ad">
                    <AdSenseUnit
                      className="rounded-xl border-x"
                      label={safeLocale === "ar" ? "إعلان" : "Advertisement"}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label={safeLocale === "ar" ? "تنقل بين الصفحات" : "Pagination"}>
          {hasPrev ? (
            <Link
              href={`/${safeLocale}/feeds${page - 1 === 1 ? "" : `?page=${page - 1}`}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
            >
              {safeLocale === "ar" ? "→ السابق" : "← Prev"}
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-subtle)]">
              {safeLocale === "ar" ? "→ السابق" : "← Prev"}
            </span>
          )}

          <span className="px-3 text-sm text-[var(--text-muted)]">
            {safeLocale === "ar" ? `${page} / ${totalPages}` : `${page} of ${totalPages}`}
          </span>

          {hasNext ? (
            <Link
              href={`/${safeLocale}/feeds?page=${page + 1}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
            >
              {safeLocale === "ar" ? "← التالي" : "Next →"}
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-subtle)]">
              {safeLocale === "ar" ? "← التالي" : "Next →"}
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
