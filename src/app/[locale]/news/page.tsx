import type { Metadata } from "next";
import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getPublishedArticles, getPublishedArticleCount } from "@/services/article-service";
import { ArticleCardView } from "@/components/articles/article-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo/metadata";

const PAGE_SIZE = 18;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "آخر الأخبار المصرفية" : "Latest Banking News",
    description:
      safeLocale === "ar"
        ? "تابع أحدث الأخبار المصرفية والمالية في السودان"
        : "Follow the latest banking and financial news in Sudan",
    path: `/${safeLocale}/news`,
  });
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];

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
    <div>
      <SectionHeading title={t.nav.latest} />

      {articles.length === 0 ? (
        <p className="mt-6 text-slate-500">
          {safeLocale === "ar" ? "لا توجد مقالات منشورة حالياً." : "No published articles yet."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCardView key={article.id} locale={safeLocale} article={article} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label={safeLocale === "ar" ? "تنقل بين الصفحات" : "Pagination"}>
          {hasPrev ? (
            <Link
              href={`/${safeLocale}/news${page - 1 === 1 ? "" : `?page=${page - 1}`}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {safeLocale === "ar" ? "→ السابق" : "← Prev"}
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
              {safeLocale === "ar" ? "→ السابق" : "← Prev"}
            </span>
          )}

          <span className="px-3 text-sm text-slate-600">
            {safeLocale === "ar" ? `${page} / ${totalPages}` : `${page} of ${totalPages}`}
          </span>

          {hasNext ? (
            <Link
              href={`/${safeLocale}/news?page=${page + 1}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {safeLocale === "ar" ? "← التالي" : "Next →"}
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
              {safeLocale === "ar" ? "← التالي" : "Next →"}
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
