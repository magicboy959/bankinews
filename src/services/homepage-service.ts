import type { Locale } from "@/lib/i18n/config";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import type { ArticleCard, BankCard } from "@/types";

type HomepageSectionRow = DbRow & {
  sectionKey: string;
  enabled: number | boolean;
  configJson: unknown;
};

type HeroSlideConfig = {
  id?: string;
  title?: string;
  summary?: string;
  imageUrl?: string;
  href?: string;
  eyebrow?: string;
  ctaLabel?: string;
};

function normalizeJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
}

function normalizeHeroSlides(value: unknown) {
  const normalized = normalizeJson(value);
  const slides =
    normalized && typeof normalized === "object" && Array.isArray((normalized as { slides?: unknown[] }).slides)
      ? (normalized as { slides: HeroSlideConfig[] }).slides
      : [];

  return slides
    .map((slide, index) => ({
      id: slide.id?.trim() || `hero-${index + 1}`,
      title: slide.title?.trim() || "",
      summary: slide.summary?.trim() || "",
      imageUrl: slide.imageUrl?.trim() || "",
      href: slide.href?.trim() || "",
      eyebrow: slide.eyebrow?.trim() || undefined,
      ctaLabel: slide.ctaLabel?.trim() || undefined,
    }))
    .filter((slide) => slide.title && slide.summary && slide.imageUrl && slide.href);
}

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

async function fetchHeroSlides(locale: Locale, latest: ArticleCard[]) {
  const rows = await dbQuery<HomepageSectionRow[]>(
    `SELECT section_key AS sectionKey, enabled, config_json AS configJson
     FROM homepage_sections
     WHERE section_key = 'hero_carousel'
     LIMIT 1`
  );

  const row = rows[0];
  if (row && (row.enabled === 1 || row.enabled === true)) {
    const configuredSlides = normalizeHeroSlides(row.configJson);
    if (configuredSlides.length) {
      return configuredSlides;
    }
  }

  return latest
    .filter((article) => article.featuredImageUrl)
    .slice(0, 3)
    .map((article, index) => ({
      id: `article-${article.id}`,
      title: article.title,
      summary: article.summary,
      imageUrl: article.featuredImageUrl as string,
      href: `/${locale}/news/${article.slug}`,
      eyebrow: index === 0 ? (locale === "ar" ? "الأبرز الآن" : "Lead Story") : locale === "ar" ? "أحدث الأخبار" : "Latest Update",
      ctaLabel: locale === "ar" ? "اقرأ التفاصيل" : "Read details",
    }));
}

export async function getHomepageData(locale: Locale) {
  try {
    const [latest, featuredBank] = await Promise.all([
      fetchLatestArticles(locale, 12),
      fetchFeaturedBank(locale),
    ]);

    const heroSlides = await fetchHeroSlides(locale, latest);

    return {
      latest,
      heroSlides,
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
      heroSlides: [],
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
