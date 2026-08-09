import { dbExecute, dbInsert, dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { created, ok, badRequest, forbidden, serverError } from "@/lib/http";
import { articleCreateSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";
import { estimateReadingTime, slugify } from "@/lib/utils";
import { validateEditorialWorkflow } from "@/lib/validation/editorial-workflow";

type CountRow = DbRow & {
  count: number;
};

type AuthorRow = DbRow & {
  id: number;
};

type ExistsRow = DbRow & {
  found: number;
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

async function resolveAuthorId(user: { id: number; name: string }): Promise<number> {
  const rows = await dbQuery<AuthorRow[]>(
    `SELECT id
     FROM authors
     WHERE user_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [user.id]
  );

  if (rows[0]?.id) {
    return Number(rows[0].id);
  }

  return dbInsert(
    `INSERT INTO authors
     (user_id, display_name, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [user.id, user.name || "BankiNews Editor"]
  );
}

function getArticleCreateErrorMessage(error: unknown): string {
  const candidate = error as { code?: string; message?: string };
  const code = candidate?.code;
  const message = candidate?.message ?? "";

  if (code === "ER_DUP_ENTRY") {
    return "An article with this slug already exists. Change the title or regenerate the slug.";
  }

  if (code === "ER_NO_REFERENCED_ROW_2" || message.includes("foreign key constraint")) {
    return "Unable to create article because a selected category, bank, or author record is missing in production.";
  }

  if (code === "WARN_DATA_TRUNCATED" || code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" || message.includes("Data truncated")) {
    return "Unable to create article because one field has a value not accepted by the production database. Check article type, status, dates, and URLs.";
  }

  if (code === "ER_DATA_TOO_LONG") {
    return "Unable to create article because one field is too long for the production database.";
  }

  if (code === "ER_BAD_FIELD_ERROR") {
    return "Unable to create article because production database columns do not match the app code. Run the latest migrations.";
  }

  if (code === "ER_NO_DEFAULT_FOR_FIELD") {
    return "Unable to create article because production requires a database field the app is not sending.";
  }

  const diagnostic = [code, message].filter(Boolean).join(": ").slice(0, 220);
  return diagnostic
    ? `Unable to create article. Database said: ${diagnostic}`
    : "Unable to create article. Check required fields, selected category/bank, and image/source URLs.";
}

function resolveArticleSlug(payload: { slug?: string | null; title: string }) {
  const requestedSlug = payload.slug?.trim();
  if (requestedSlug) {
    return requestedSlug;
  }

  const generated = slugify(payload.title);
  if (/^[a-z0-9-]+$/.test(generated)) {
    return generated;
  }

  return `article-${Date.now()}`;
}

async function writeArticleAuditLog(userId: number, articleId: number, status: string, metadata: unknown) {
  try {
    await dbExecute(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, metadata, created_at)
      VALUES (?, 'article_created', 'article', ?, NULL, ?, ?, NOW())
      `,
      [userId, articleId, status, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error("article_create_audit_failed", error);
  }
}

async function relatedRecordExists(tableName: "banks" | "categories", id: number): Promise<boolean> {
  const rows = await dbQuery<ExistsRow[]>(
    `SELECT 1 AS found
     FROM ${tableName}
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );

  return rows.length > 0;
}

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

    if (payload.categoryId && !(await relatedRecordExists("categories", payload.categoryId))) {
      return badRequest("Selected category no longer exists. Choose another category or leave it blank.");
    }

    if (payload.relatedBankId && !(await relatedRecordExists("banks", payload.relatedBankId))) {
      return badRequest("Selected related bank no longer exists. Choose another bank or leave it blank.");
    }

    const baseSlug = resolveArticleSlug(payload);
    const promotedFlag = payload.isFeatured || payload.isSponsored;
    const authorId = await resolveAuthorId(user);

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL), NOW(), NOW())
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
          authorId,
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

      return nextArticleId;
    });

    await writeArticleAuditLog(user.id, articleId, payload.status, createMetadata);

    return created({ articleId, slug });
  } catch (error) {
    console.error("article_create_failed", error);
    return serverError(getArticleCreateErrorMessage(error));
  }
}
