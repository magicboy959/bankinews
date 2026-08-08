import type { Locale } from "@/lib/i18n/config";
import { dbQuery } from "@/lib/db/query";
import type { ArticleCard } from "@/types";

type ArticleCorrectionHistoryItem = {
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export async function getPublishedArticles(locale: Locale, limit = 20, offset = 0): Promise<ArticleCard[]> {
  try {
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
        LIMIT ? OFFSET ?
      `,
      [locale, locale, limit, offset]
    );

    return rows as ArticleCard[];
  } catch {
    return [];
  }
}

export async function getPublishedArticleCount(locale: Locale): Promise<number> {
  try {
    const rows = await dbQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
       FROM articles a
       JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
       WHERE a.status = 'published' AND a.deleted_at IS NULL`,
      [locale]
    );
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

export async function getArticleBySlug(locale: Locale, slug: string) {
  try {
    const rows = await dbQuery<any[]>(
      `
        SELECT a.id, a.slug, a.article_type AS articleType, a.featured_image_url AS featuredImageUrl,
           a.video_url AS videoUrl,
               a.published_at AS publishedAt, a.updated_at AS updatedAt,
           a.source_url AS sourceUrl, a.source_attribution AS sourceAttribution,
               a.reading_time_minutes AS readingTimeMinutes,
               a.is_breaking AS isBreaking, a.is_sponsored AS isSponsored,
               a.is_opinion AS isOpinion, a.is_press_release AS isPressRelease,
               at.title, at.summary, at.content_html AS contentHtml,
               au.display_name AS authorName,
               bt.name AS relatedBankName
        FROM articles a
        JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
        LEFT JOIN authors au ON au.id = a.author_id
        LEFT JOIN banks b ON b.id = a.related_bank_id
        LEFT JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
        WHERE a.slug = ? AND a.status = 'published' AND a.deleted_at IS NULL
        LIMIT 1
      `,
      [locale, locale, slug]
    );

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedArticleLocalesBySlug(slug: string): Promise<Locale[]> {
  try {
    const rows = await dbQuery<Array<{ locale: string }>>(
      `
        SELECT at.locale
        FROM articles a
        JOIN article_translations at ON at.article_id = a.id
        WHERE a.slug = ? AND a.status = 'published' AND a.deleted_at IS NULL
      `,
      [slug]
    );

    return rows
      .map((row) => row.locale)
      .filter((locale): locale is Locale => locale === "ar" || locale === "en");
  } catch {
    return [];
  }
}

export async function getArticleCorrectionHistory(articleId: number): Promise<ArticleCorrectionHistoryItem[]> {
  try {
    const rows = await dbQuery<any[]>(
      `SELECT action, previous_status AS previousStatus, new_status AS newStatus,
              metadata, created_at AS createdAt
       FROM audit_logs
       WHERE entity_type = 'article' AND entity_id = ?
         AND action IN ('article_created', 'article_updated', 'article_deleted')
       ORDER BY created_at DESC
       LIMIT 10`,
      [articleId]
    );

    return rows.map((row) => ({
      action: String(row.action),
      previousStatus: row.previousStatus ?? null,
      newStatus: row.newStatus ?? null,
      createdAt: String(row.createdAt),
      metadata: row.metadata
        ? typeof row.metadata === "string"
          ? (JSON.parse(row.metadata) as Record<string, unknown>)
          : (row.metadata as Record<string, unknown>)
        : null,
    }));
  } catch {
    return [];
  }
}
