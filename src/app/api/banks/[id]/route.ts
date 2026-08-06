import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { bankSchema } from "@/lib/validation/schemas";

type BankDetailRow = DbRow & {
  id: number;
  slug: string;
  officialWebsite: string | null;
  headquarters: string | null;
  swiftCode: string | null;
  showOnWebsite: number | boolean;
  name: string | null;
  shortDescription: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<BankDetailRow[]>(
      `SELECT b.id, b.slug, b.official_website AS officialWebsite,
              b.headquarters, b.swift_code AS swiftCode, b.show_on_website AS showOnWebsite,
              bt.name, bt.short_description AS shortDescription
       FROM banks b
       LEFT JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
       WHERE b.id = ? AND b.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Bank not found");
    }

    return ok(rows[0]);
  } catch {
    return serverError("Unable to fetch bank");
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
    const parsed = bankSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid bank payload", parsed.error.flatten());
    }

    const updated = await dbTransaction(async ({ execute }) => {
      const bankResult = await execute(
        `UPDATE banks
         SET slug = ?, official_website = ?, headquarters = ?, swift_code = ?, show_on_website = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [
          parsed.data.slug,
          parsed.data.officialWebsite ?? null,
          parsed.data.headquarters ?? null,
          parsed.data.swiftCode ?? null,
          parsed.data.showOnWebsite ? 1 : 0,
          id,
        ]
      );

      if (bankResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO bank_translations
         (bank_id, locale, name, short_description, created_at, updated_at)
         VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           short_description = VALUES(short_description),
           updated_at = NOW()`,
        [
          id,
          parsed.data.name,
          parsed.data.shortDescription,
          id,
          parsed.data.name,
          parsed.data.shortDescription,
        ]
      );

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'bank_updated', 'bank', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Bank not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update bank");
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
      const bankResult = await execute(
        `UPDATE banks SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (bankResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'bank_deleted', 'bank', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Bank not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete bank");
  }
}
