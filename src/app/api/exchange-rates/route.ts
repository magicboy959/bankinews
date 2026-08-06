import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { exchangeRateSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

type ExchangeRateListRow = DbRow & {
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

export async function GET() {
  try {
    const rows = await dbQuery<ExchangeRateListRow[]>(
      `SELECT id, currency_name AS currencyName, currency_code AS currencyCode,
              official_buy AS officialBuy, official_sell AS officialSell,
              parallel_buy AS parallelBuy, parallel_sell AS parallelSell,
              rate_date AS rateDate, source, notes
       FROM exchange_rates
       WHERE deleted_at IS NULL
       ORDER BY rate_date DESC
       LIMIT 365`
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch rates");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = exchangeRateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid rate payload", parsed.error.flatten());
    }

    const rateId = await dbTransaction(async ({ execute }) => {
      const rateResult = await execute(
        `INSERT INTO exchange_rates
         (currency_name, currency_code, official_buy, official_sell, parallel_buy, parallel_sell, rate_date, source, notes, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
          user.id,
        ]
      );

      const createdRateId = rateResult.insertId;

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'exchange_rate_created', 'exchange_rate', ?, NOW())`,
        [user.id, createdRateId]
      );

      return createdRateId;
    });

    return created({ id: rateId });
  } catch {
    return serverError("Unable to create rate");
  }
}
