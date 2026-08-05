import type { Locale } from "@/lib/i18n/config";
import { dbQuery } from "@/lib/db/query";
import type { ArticleCard, BankCard } from "@/types";

async function fetchLatestArticles(locale: Locale, limit = 8): Promise<ArticleCard[]> {
  const rows = await dbQuery<any[]>(
    `
      SELECT a.id, a.slug, at.locale, at.title, at.summary, a.featured_image_url AS featuredImageUrl,
             a.published_at AS publishedAt, a.reading_time_minutes AS readingTimeMinutes,
             a.is_breaking AS isBreaking, a.is_sponsored AS isSponsored,
             ct.title AS categoryName
      FROM articles a
      JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
      LEFT JOIN article_categories ac ON ac.article_id = a.id
      LEFT JOIN category_translations ct ON ct.category_id = ac.category_id AND ct.locale = ?
      WHERE a.status = 'published' AND a.deleted_at IS NULL
      ORDER BY a.published_at DESC
      LIMIT ?
    `,
    [locale, locale, limit]
  );

  return rows as ArticleCard[];
}

async function fetchFeaturedBank(locale: Locale): Promise<BankCard | null> {
  const rows = await dbQuery<any[]>(
    `
      SELECT b.id, b.slug, bt.name, bt.short_description AS shortDescription, b.logo_url AS logoUrl
      FROM banks b
      JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
      WHERE b.is_featured = 1 AND b.deleted_at IS NULL
      ORDER BY b.updated_at DESC
      LIMIT 1
    `,
    [locale]
  );
  return rows[0] ?? null;
}

export async function getHomepageData(locale: Locale) {
  try {
    const [latest, featuredBank] = await Promise.all([
      fetchLatestArticles(locale, 12),
      fetchFeaturedBank(locale),
    ]);

    return {
      latest,
      featured: latest[0] ?? null,
      secondary: latest.slice(1, 4),
      fintech: latest.slice(4, 8),
      guides: latest.filter((a) => a.summary.length > 0).slice(0, 4),
      mostRead: latest.slice(0, 5),
      editorsPicks: latest.slice(5, 9),
      featuredBank,
    };
  } catch {
    return {
      latest: [],
      featured: null,
      secondary: [],
      fintech: [],
      guides: [],
      mostRead: [],
      editorsPicks: [],
      featuredBank: null,
    };
  }
}
