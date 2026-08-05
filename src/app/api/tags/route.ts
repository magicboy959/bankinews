import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { tagSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    const rows = await dbQuery<any[]>(
      `SELECT t.id, t.slug, tt.title
       FROM tags t
       JOIN tag_translations tt ON tt.tag_id = t.id AND tt.locale = ?
       WHERE t.deleted_at IS NULL
       ORDER BY tt.title ASC`,
      [locale]
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch tags");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await dbExecute(`INSERT INTO tags (slug, created_at, updated_at) VALUES (?, NOW(), NOW())`, [parsed.data.slug]);
    const createdTag = await dbQuery<any[]>(`SELECT id FROM tags WHERE slug = ? LIMIT 1`, [parsed.data.slug]);

    await dbExecute(
      `INSERT INTO tag_translations (tag_id, locale, title, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [createdTag[0]?.id, parsed.data.locale, parsed.data.title]
    );

    return created({ id: createdTag[0]?.id });
  } catch {
    return serverError("Unable to create tag");
  }
}
