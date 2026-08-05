import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { articleCreateSchema } from "@/lib/validation/schemas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<any[]>(
      `
      SELECT a.id, a.slug, a.status, a.article_type AS articleType,
             a.featured_image_url AS featuredImageUrl,
             at.locale, at.title, at.summary, at.content_html AS contentHtml
      FROM articles a
      LEFT JOIN article_translations at ON at.article_id = a.id
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

    await dbExecute(
      `UPDATE articles
       SET status = ?, article_type = ?, featured_image_url = ?,
           is_breaking = ?, is_sponsored = ?, is_opinion = ?, is_press_release = ?,
           updated_at = NOW(), published_at = IF(? = 'published' AND published_at IS NULL, NOW(), published_at)
       WHERE id = ? AND deleted_at IS NULL`,
      [
        payload.status,
        payload.articleType,
        payload.featuredImageUrl ?? null,
        payload.isBreaking ? 1 : 0,
        payload.isSponsored ? 1 : 0,
        payload.isOpinion ? 1 : 0,
        payload.isPressRelease ? 1 : 0,
        payload.status,
        id,
      ]
    );

    await dbExecute(
      `UPDATE article_translations
       SET title = ?, summary = ?, content_html = ?, updated_at = NOW()
       WHERE article_id = ? AND locale = ?`,
      [payload.title, payload.summary, payload.contentHtml, id, payload.locale]
    );

    await dbExecute(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, created_at)
      VALUES (?, 'article_updated', 'article', ?, NULL, ?, NOW())
      `,
      [user.id, id, payload.status]
    );

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
    await dbExecute(`UPDATE articles SET deleted_at = NOW() WHERE id = ?`, [id]);
    await dbExecute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES (?, 'article_deleted', 'article', ?, NOW())`,
      [user.id, id]
    );
    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete article");
  }
}
