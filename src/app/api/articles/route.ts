import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { created, ok, badRequest, forbidden, serverError } from "@/lib/http";
import { articleCreateSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";
import { estimateReadingTime, slugify } from "@/lib/utils";
import { validateEditorialWorkflow } from "@/lib/validation/editorial-workflow";

type CountRow = DbRow & {
  count: number;
};

type ArticleListRow = DbRow & {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  featuredImageUrl: string | null;
  videoUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readingTimeMinutes: number;
  isBreaking: number | boolean;
  isSponsored: number | boolean;
  title: string;
  summary: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";
  const status = searchParams.get("status") ?? "published";

  try {
    const rows = await dbQuery<ArticleListRow[]>(
      `
      SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              a.featured_image_url AS featuredImageUrl, a.video_url AS videoUrl, a.published_at AS publishedAt,
             a.updated_at AS updatedAt, a.reading_time_minutes AS readingTimeMinutes,
             a.is_breaking AS isBreaking, a.is_sponsored AS isSponsored,
             at.title, at.summary
      FROM articles a
      JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
      WHERE a.status = ? AND a.deleted_at IS NULL
      ORDER BY a.published_at DESC, a.created_at DESC
      LIMIT 100
      `,
      [locale, status]
    );

    return ok(rows);
  } catch {
    return serverError("Unable to fetch articles");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("author");
  if (!user) {
    return forbidden("You do not have permission to create articles");
  }

  try {
    const body = await request.json();
    const parsed = articleCreateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid article payload", parsed.error.flatten());
    }

    const payload = parsed.data;
    const workflowError = validateEditorialWorkflow(payload);
    if (workflowError) {
      return badRequest(workflowError);
    }

    const baseSlug = slugify(payload.title);
    const promotedFlag = payload.isFeatured || payload.isSponsored;

    const existing = await dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count FROM articles WHERE slug = ?`,
      [baseSlug]
    );

    const slug = Number(existing[0]?.count ?? 0) > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;
    const createMetadata = {
      locale: payload.locale,
      title: payload.title,
      videoUrl: payload.videoUrl ?? null,
      sourceUrl: payload.sourceUrl ?? null,
      sourceAttribution: payload.sourceAttribution ?? null,
      categoryId: payload.categoryId ?? null,
      status: payload.status,
    };

    const articleId = await dbTransaction(async ({ execute }) => {
      const articleResult = await execute(
        `
        INSERT INTO articles
        (slug, status, article_type, featured_image_url, video_url, source_url, source_attribution,
         related_bank_id, author_id, reading_time_minutes,
         is_breaking, is_sponsored, is_opinion, is_press_release,
         publish_at, expires_at, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL), NOW(), NOW())
        `,
        [
          slug,
          payload.status,
          payload.articleType,
          payload.featuredImageUrl ?? null,
          payload.videoUrl ?? null,
          payload.sourceUrl ?? null,
          payload.sourceAttribution ?? null,
          payload.relatedBankId ?? null,
          user.id,
          estimateReadingTime(payload.contentHtml),
          payload.isBreaking ? 1 : 0,
          promotedFlag ? 1 : 0,
          payload.isOpinion ? 1 : 0,
          payload.isPressRelease ? 1 : 0,
          payload.publishAt ?? null,
          payload.expiresAt ?? null,
          payload.status,
        ]
      );

      const nextArticleId = articleResult.insertId;

      await execute(
        `
        INSERT INTO article_translations
        (article_id, locale, title, summary, content_html, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [nextArticleId, payload.locale, payload.title, payload.summary, payload.contentHtml]
      );

      if (payload.categoryId) {
        await execute(
          `
          INSERT INTO article_categories (article_id, category_id)
          VALUES (?, ?)
          `,
          [nextArticleId, payload.categoryId]
        );
      }

      await execute(
        `
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, metadata, created_at)
        VALUES (?, 'article_created', 'article', ?, NULL, ?, ?, NOW())
        `,
        [user.id, nextArticleId, payload.status, JSON.stringify(createMetadata)]
      );

      return nextArticleId;
    });

    return created({ articleId, slug });
  } catch {
    return serverError("Unable to create article");
  }
}
