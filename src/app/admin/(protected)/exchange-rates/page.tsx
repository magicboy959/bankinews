import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { ExchangeRateAdminManager } from "@/components/admin/exchange-rate-admin-manager";

type RateRow = DbRow & {
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

type RateSourceRow = DbRow & {
  id: number;
  name: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  isActive: number;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: number;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

export default async function AdminExchangeRatesPage() {
  const rows = await dbQuery<RateRow[]>(
    `SELECT id, currency_name AS currencyName, currency_code AS currencyCode,
            official_buy AS officialBuy, official_sell AS officialSell,
            parallel_buy AS parallelBuy, parallel_sell AS parallelSell,
            rate_date AS rateDate, source, notes
     FROM exchange_rates
     WHERE deleted_at IS NULL
     ORDER BY rate_date DESC
     LIMIT 100`
  );

  const sourceRows = await dbQuery<RateSourceRow[]>(
    `SELECT
        id,
        name,
        source_type AS sourceType,
        is_active AS isActive,
        trust_tier AS trustTier,
        trust_score AS trustScore,
        last_verified_at AS lastVerifiedAt,
        updated_at AS updatedAt
     FROM rate_sources
     ORDER BY updated_at DESC, name ASC
     LIMIT 500`
  );

  return (
    <ExchangeRateAdminManager
      initialRows={rows}
      initialSources={sourceRows.map((row) => ({
        id: row.id,
        name: row.name,
        sourceType: row.sourceType,
        isActive: Boolean(row.isActive),
        trustTier: row.trustTier,
        trustScore: Number(row.trustScore),
        lastVerifiedAt: row.lastVerifiedAt ? String(row.lastVerifiedAt).slice(0, 10) : null,
        updatedAt: String(row.updatedAt),
      }))}
    />
  );
}