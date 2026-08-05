import { dbQuery } from "@/lib/db/query";
import { badRequest, ok, serverError } from "@/lib/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const locale = searchParams.get("locale") ?? "ar";

  if (q.length < 2) {
    return badRequest("Search query must be at least 2 characters");
  }

  try {
    const articles = await dbQuery<any[]>(
      `SELECT a.id, a.slug, at.title, at.summary
       FROM articles a
       JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
       WHERE a.status = 'published' AND a.deleted_at IS NULL
         AND (at.title LIKE CONCAT('%', ?, '%') OR at.content_html LIKE CONCAT('%', ?, '%'))
       ORDER BY a.published_at DESC
       LIMIT 20`,
      [locale, q, q]
    );

    const banks = await dbQuery<any[]>(
      `SELECT b.id, b.slug, bt.name
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.deleted_at IS NULL AND bt.name LIKE CONCAT('%', ?, '%')
       LIMIT 10`,
      [locale, q]
    );

    return ok({ query: q, articles, banks });
  } catch {
    return serverError("Unable to search");
  }
}
