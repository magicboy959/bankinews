import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { categorySchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    const rows = await dbQuery<any[]>(
      `SELECT c.id, c.slug, ct.title, ct.description
       FROM categories c
       JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = ?
       WHERE c.deleted_at IS NULL
       ORDER BY ct.title ASC`,
      [locale]
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch categories");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await dbExecute(`INSERT INTO categories (slug, created_at, updated_at) VALUES (?, NOW(), NOW())`, [parsed.data.slug]);
    const createdCategory = await dbQuery<any[]>(`SELECT id FROM categories WHERE slug = ? LIMIT 1`, [parsed.data.slug]);

    await dbExecute(
      `INSERT INTO category_translations (category_id, locale, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [createdCategory[0]?.id, parsed.data.locale, parsed.data.title, parsed.data.description ?? null]
    );

    return created({ id: createdCategory[0]?.id });
  } catch {
    return serverError("Unable to create category");
  }
}
