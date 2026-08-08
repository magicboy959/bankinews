import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { articleCreateSchema } from "@/lib/validation/schemas";
import { validateEditorialWorkflow } from "@/lib/validation/editorial-workflow";

type ArticleDetailRow = DbRow & {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  featuredImageUrl: string | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  relatedBankId: number | null;
  categoryId: number | null;
  publishAt: string | null;
  expiresAt: string | null;
  isBreaking: number | boolean;
  isSponsored: number | boolean;
  isOpinion: number | boolean;
  isPressRelease: number | boolean;
  locale: string | null;
  title: string | null;
  summary: string | null;
  contentHtml: string | null;
};

type ArticlePreviousRow = DbRow & {
  status: string;
  articleType: string;
  featuredImageUrl: string | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  relatedBankId: number | null;
  publishAt: string | null;
  expiresAt: string | null;
  isBreaking: number | boolean;
  isSponsored: number | boolean;
  isOpinion: number | boolean;
  isPressRelease: number | boolean;
  locale: string | null;
  title: string | null;
  summary: string | null;
  contentHtml: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<ArticleDetailRow[]>(
      `
      SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              a.featured_image_url AS featuredImageUrl,
              a.source_url AS sourceUrl,
              a.source_attribution AS sourceAttribution,
              a.related_bank_id AS relatedBankId,
              ac.category_id AS categoryId,
              a.publish_at AS publishAt,
              a.expires_at AS expiresAt,
              a.is_breaking AS isBreaking,
              a.is_sponsored AS isSponsored,
              a.is_opinion AS isOpinion,
              a.is_press_release AS isPressRelease,
             at.locale, at.title, at.summary, at.content_html AS contentHtml
      FROM articles a
      LEFT JOIN article_translations at ON at.article_id = a.id
      LEFT JOIN (
        SELECT article_id, MIN(category_id) AS category_id
        FROM article_categories
        GROUP BY article_id
      ) ac ON ac.article_id = a.id
      WHERE a.id = ? AND a.deleted_at IS NULL
      `,
      [id]
    );

    if (!rows.length) {
      return notFound("Article not found");
    }

    return ok(rows);
  } catch {
    return serverError("Unable to fetch article");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

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

    const promotedFlag = payload.isFeatured || payload.isSponsored;

    const updated = await dbTransaction(async ({ query, execute }) => {
      const previousRows = await query<ArticlePreviousRow[]>(
        `SELECT a.status, a.article_type AS articleType, a.featured_image_url AS featuredImageUrl,
                a.source_url AS sourceUrl, a.source_attribution AS sourceAttribution,
                a.related_bank_id AS relatedBankId, a.publish_at AS publishAt, a.expires_at AS expiresAt,
                a.is_breaking AS isBreaking, a.is_sponsored AS isSponsored,
                a.is_opinion AS isOpinion, a.is_press_release AS isPressRelease,
                at.locale, at.title, at.summary, at.content_html AS contentHtml
         FROM articles a
         LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
         WHERE a.id = ?
         LIMIT 1`,
        [payload.locale, id]
      );

      const previous = previousRows[0] ?? null;
      const articleResult = await execute(
        `UPDATE articles
         SET status = ?, article_type = ?, featured_image_url = ?,
             source_url = ?, source_attribution = ?, related_bank_id = ?,
             is_breaking = ?, is_sponsored = ?, is_opinion = ?, is_press_release = ?,
             publish_at = ?, expires_at = ?,
             updated_at = NOW(),
             published_at = IF(? = 'published', IFNULL(published_at, NOW()), NULL)
         WHERE id = ? AND deleted_at IS NULL`,
        [
          payload.status,
          payload.articleType,
          payload.featuredImageUrl ?? null,
          payload.sourceUrl ?? null,
          payload.sourceAttribution ?? null,
          payload.relatedBankId ?? null,
          payload.isBreaking ? 1 : 0,
          promotedFlag ? 1 : 0,
          payload.isOpinion ? 1 : 0,
          payload.isPressRelease ? 1 : 0,
          payload.publishAt ?? null,
          payload.expiresAt ?? null,
          payload.status,
          id,
        ]
      );

      if (articleResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO article_translations
         (article_id, locale, title, summary, content_html, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           summary = VALUES(summary),
           content_html = VALUES(content_html),
           updated_at = NOW()`,
        [id, payload.locale, payload.title, payload.summary, payload.contentHtml]
      );

      await execute(`DELETE FROM article_categories WHERE article_id = ?`, [id]);
      if (payload.categoryId) {
        await execute(
          `INSERT INTO article_categories (article_id, category_id)
           VALUES (?, ?)`,
          [id, payload.categoryId]
        );
      }

      const updateMetadata = {
        locale: payload.locale,
        changes: {
          status: { from: previous?.status ?? null, to: payload.status },
          articleType: { from: previous?.articleType ?? null, to: payload.articleType },
          title: { from: previous?.title ?? null, to: payload.title },
          summary: { from: previous?.summary ?? null, to: payload.summary },
          sourceUrl: { from: previous?.sourceUrl ?? null, to: payload.sourceUrl ?? null },
          sourceAttribution: { from: previous?.sourceAttribution ?? null, to: payload.sourceAttribution ?? null },
          featuredImageUrl: { from: previous?.featuredImageUrl ?? null, to: payload.featuredImageUrl ?? null },
          publishAt: { from: previous?.publishAt ?? null, to: payload.publishAt ?? null },
          expiresAt: { from: previous?.expiresAt ?? null, to: payload.expiresAt ?? null },
          isBreaking: { from: previous?.isBreaking ?? null, to: payload.isBreaking ? 1 : 0 },
          isSponsored: { from: previous?.isSponsored ?? null, to: promotedFlag ? 1 : 0 },
          isOpinion: { from: previous?.isOpinion ?? null, to: payload.isOpinion ? 1 : 0 },
          isPressRelease: { from: previous?.isPressRelease ?? null, to: payload.isPressRelease ? 1 : 0 },
          relatedBankId: { from: previous?.relatedBankId ?? null, to: payload.relatedBankId ?? null },
          categoryId: { from: previous?.categoryId ?? null, to: payload.categoryId ?? null },
        },
      };

      await execute(
        `
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, metadata, created_at)
        VALUES (?, 'article_updated', 'article', ?, ?, ?, ?, NOW())
        `,
        [user.id, id, previous?.status ?? null, payload.status, JSON.stringify(updateMetadata)]
      );

      return true;
    });

    if (!updated) {
      return notFound("Article not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update article");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("administrator");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const deleted = await dbTransaction(async ({ execute }) => {
      const articleResult = await execute(
        `UPDATE articles SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (articleResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (?, 'article_deleted', 'article', ?, ?, NOW())`,
        [user.id, id, JSON.stringify({ deleted: true })]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Article not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete article");
  }
}
