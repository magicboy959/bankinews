import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { productSchema } from "@/lib/validation/schemas";

type ProductDetailRow = DbRow & {
  id: number;
  slug: string;
  bankId: number;
  category: string;
  officialSourceUrl: string | null;
  name: string | null;
  description: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<ProductDetailRow[]>(
      `SELECT p.id, p.slug, p.bank_id AS bankId, p.product_category AS category,
              p.official_source_url AS officialSourceUrl, pt.name, pt.description
       FROM products p
       LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ar'
       WHERE p.id = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Product not found");
    }

    return ok(rows[0]);
  } catch {
    return serverError("Unable to fetch product");
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
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid product payload", parsed.error.flatten());
    }

    const updated = await dbTransaction(async ({ execute }) => {
      const productResult = await execute(
        `UPDATE products
         SET slug = ?, bank_id = ?, product_category = ?, official_source_url = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [
          parsed.data.slug,
          parsed.data.bankId,
          parsed.data.category,
          parsed.data.officialSourceUrl ?? null,
          id,
        ]
      );

      if (productResult.affectedRows === 0) {
        return false;
      }

      const shortDescription = parsed.data.description.slice(0, 900);

      await execute(
        `INSERT INTO product_translations
         (product_id, locale, name, short_description, description, created_at, updated_at)
         VALUES (?, 'ar', ?, ?, ?, NOW(), NOW()), (?, 'en', ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           short_description = VALUES(short_description),
           description = VALUES(description),
           updated_at = NOW()`,
        [
          id,
          parsed.data.name,
          shortDescription,
          parsed.data.description,
          id,
          parsed.data.name,
          shortDescription,
          parsed.data.description,
        ]
      );

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'product_updated', 'product', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Product not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update product");
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
      const productResult = await execute(
        `UPDATE products SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (productResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'product_deleted', 'product', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Product not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete product");
  }
}
