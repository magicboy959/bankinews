import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { bankSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    const rows = await dbQuery<any[]>(
      `SELECT b.id, b.slug, b.logo_url AS logoUrl, b.official_website AS officialWebsite,
              b.customer_service_numbers AS customerServiceNumbers, b.headquarters,
              b.swift_code AS swiftCode, bt.name, bt.short_description AS shortDescription
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.deleted_at IS NULL
       ORDER BY bt.name ASC`,
      [locale]
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch banks");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = bankSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid bank payload", parsed.error.flatten());
    }

    await dbExecute(
      `INSERT INTO banks
       (slug, official_website, headquarters, swift_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        parsed.data.slug,
        parsed.data.officialWebsite ?? null,
        parsed.data.headquarters ?? null,
        parsed.data.swiftCode ?? null,
      ]
    );

    const createdBank = await dbQuery<any[]>(`SELECT id FROM banks WHERE slug = ? LIMIT 1`, [parsed.data.slug]);

    await dbExecute(
      `INSERT INTO bank_translations
       (bank_id, locale, name, short_description, created_at, updated_at)
       VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())`,
      [
        createdBank[0]?.id,
        parsed.data.name,
        parsed.data.shortDescription,
        createdBank[0]?.id,
        parsed.data.name,
        parsed.data.shortDescription,
      ]
    );

    return created({ id: createdBank[0]?.id });
  } catch {
    return serverError("Unable to create bank");
  }
}
