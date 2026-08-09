import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";
import { ArticleCardView } from "@/components/articles/article-card";
import {
  getCategoryBySlug,
  getPublishedArticlesByCategory,
  getPublishedArticleCountByCategory,
} from "@/services/article-service";

const PAGE_SIZE = 18;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const category = await getCategoryBySlug(safeLocale, slug);

  if (!category) {
    return buildMetadata({ locale: safeLocale, title: "Category", description: "", path: `/${safeLocale}/category/${slug}` });
  }

  return buildMetadata({
    locale: safeLocale,
    title: category.title,
    description: category.description ?? (safeLocale === "ar" ? `أخبار ${category.title}` : `${category.title} news`),
    path: `/${safeLocale}/category/${slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const { page: pageParam } = await searchParams;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  const category = await getCategoryBySlug(safeLocale, slug);
  if (!category) {
    notFound();
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [articles, total] = await Promise.all([
    getPublishedArticlesByCategory(safeLocale, slug, PAGE_SIZE, offset),
    getPublishedArticleCountByCategory(safeLocale, slug),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)]">
          {safeLocale === "ar" ? "تصفح حسب الفئة" : "Browse by category"}
        </p>
        <h1 className="text-3xl font-black text-[var(--foreground)]">{category.title}</h1>
        {category.description && (
          <p className="mt-2 text-base text-[var(--text-muted)]">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-[var(--text-subtle)]">
          {safeLocale === "ar" ? `${total} مقال` : `${total} articles`}
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-[var(--text-subtle)]">
          {safeLocale === "ar" ? "لا توجد مقالات في هذه الفئة حالياً." : "No articles in this category yet."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCardView key={article.id} locale={safeLocale} article={article} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label={safeLocale === "ar" ? "تنقل بين الصفحات" : "Pagination"}
        >
          {hasPrev ? (
            <Link
              href={`/${safeLocale}/category/${slug}${page - 1 === 1 ? "" : `?page=${page - 1}`}`}
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
              href={`/${safeLocale}/category/${slug}?page=${page + 1}`}
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
      )}
    </div>
  );
}
