import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { productSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    const rows = await dbQuery<any[]>(
      `SELECT p.id, p.slug, p.product_category AS category, p.official_source_url AS officialSourceUrl,
              bt.name AS bankName, pt.name, pt.short_description AS shortDescription
       FROM products p
       JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       JOIN banks b ON b.id = p.bank_id
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE p.deleted_at IS NULL
       ORDER BY p.updated_at DESC`,
      [locale, locale]
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch products");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid product payload", parsed.error.flatten());
    }

    await dbExecute(
      `INSERT INTO products
       (slug, bank_id, product_category, official_source_url, last_verified_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURDATE(), NOW(), NOW())`,
      [parsed.data.slug, parsed.data.bankId, parsed.data.category, parsed.data.officialSourceUrl ?? null]
    );

    const createdProduct = await dbQuery<any[]>(`SELECT id FROM products WHERE slug = ? LIMIT 1`, [parsed.data.slug]);

    await dbExecute(
      `INSERT INTO product_translations
       (product_id, locale, name, short_description, description, created_at, updated_at)
       VALUES (?, 'ar', ?, ?, ?, NOW(), NOW()), (?, 'en', ?, ?, ?, NOW(), NOW())`,
      [
        createdProduct[0]?.id,
        parsed.data.name,
        parsed.data.description,
        parsed.data.description,
        createdProduct[0]?.id,
        parsed.data.name,
        parsed.data.description,
        parsed.data.description,
      ]
    );

    return created({ id: createdProduct[0]?.id });
  } catch {
    return serverError("Unable to create product");
  }
}
