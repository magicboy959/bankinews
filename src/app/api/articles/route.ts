import { dbExecute, dbQuery } from "@/lib/db/query";
import { created, ok, badRequest, forbidden, serverError } from "@/lib/http";
import { articleCreateSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";
import { estimateReadingTime, slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";
  const status = searchParams.get("status") ?? "published";

  try {
    const rows = await dbQuery<any[]>(
      `
      SELECT a.id, a.slug, a.status, a.article_type AS articleType,
             a.featured_image_url AS featuredImageUrl, a.published_at AS publishedAt,
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
    const baseSlug = slugify(payload.title);

    const existing = await dbQuery<any[]>(
      `SELECT COUNT(*) AS count FROM articles WHERE slug = ?`,
      [baseSlug]
    );

    const slug = Number(existing[0]?.count ?? 0) > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

    await dbExecute(
      `
      INSERT INTO articles
      (slug, status, article_type, featured_image_url, author_id, reading_time_minutes,
       is_breaking, is_sponsored, is_opinion, is_press_release, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL), NOW(), NOW())
      `,
      [
        slug,
        payload.status,
        payload.articleType,
        payload.featuredImageUrl ?? null,
        user.id,
        estimateReadingTime(payload.contentHtml),
        payload.isBreaking ? 1 : 0,
        payload.isSponsored ? 1 : 0,
        payload.isOpinion ? 1 : 0,
        payload.isPressRelease ? 1 : 0,
        payload.status,
      ]
    );

    const article = await dbQuery<any[]>(`SELECT id FROM articles WHERE slug = ? LIMIT 1`, [slug]);
    const articleId = article[0]?.id;

    await dbExecute(
      `
      INSERT INTO article_translations
      (article_id, locale, title, summary, content_html, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [articleId, payload.locale, payload.title, payload.summary, payload.contentHtml]
    );

    await dbExecute(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, created_at)
      VALUES (?, 'article_created', 'article', ?, NULL, ?, NOW())
      `,
      [user.id, articleId, payload.status]
    );

    return created({ articleId, slug });
  } catch {
    return serverError("Unable to create article");
  }
}
