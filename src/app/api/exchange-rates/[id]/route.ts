import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { exchangeRateSchema } from "@/lib/validation/schemas";

type ExchangeRateDetailRow = DbRow & {
  id: number;
  currencyName: string;
  currencyCode: string;
  officialBuy: number | null;
  officialSell: number | null;
  parallelBuy: number | null;
  parallelSell: number | null;
  rateDate: string;
  source: string;
  notes: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<ExchangeRateDetailRow[]>(
      `SELECT id, currency_name AS currencyName, currency_code AS currencyCode,
              official_buy AS officialBuy, official_sell AS officialSell,
              parallel_buy AS parallelBuy, parallel_sell AS parallelSell,
              rate_date AS rateDate, source, notes
       FROM exchange_rates
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Rate not found");
    }

    return ok(rows[0]);
  } catch {
    return serverError("Unable to fetch rate");
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
    const parsed = exchangeRateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid rate payload", parsed.error.flatten());
    }

    const updated = await dbTransaction(async ({ execute }) => {
      const rateResult = await execute(
        `UPDATE exchange_rates
         SET currency_name = ?, currency_code = ?, official_buy = ?, official_sell = ?,
             parallel_buy = ?, parallel_sell = ?, rate_date = ?, source = ?, notes = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [
          parsed.data.currencyName,
          parsed.data.currencyCode,
          parsed.data.officialBuy ?? null,
          parsed.data.officialSell ?? null,
          parsed.data.parallelBuy ?? null,
          parsed.data.parallelSell ?? null,
          parsed.data.rateDate,
          parsed.data.source,
          parsed.data.notes ?? null,
          id,
        ]
      );

      if (rateResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'exchange_rate_updated', 'exchange_rate', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Rate not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update rate");
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
      const rateResult = await execute(
        `UPDATE exchange_rates SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (rateResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'exchange_rate_deleted', 'exchange_rate', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Rate not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete rate");
  }
}
