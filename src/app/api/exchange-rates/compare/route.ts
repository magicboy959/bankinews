import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, ok, serverError } from "@/lib/http";

type SourceType = "bank" | "exchange_company" | "all";
type SortMode = "buy_desc" | "buy_asc" | "sell_desc" | "sell_asc";

type DateRow = DbRow & {
  rateDate: string | null;
};

type CompareRow = DbRow & {
  sourceId: number;
  sourceName: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  buyRate: string | number | null;
  sellRate: string | number | null;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: string | number;
  lastVerifiedAt: string | Date | null;
  pointUpdatedAt: string | Date | null;
};

function toDateIso(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toFreshnessMinutes(value: string | Date | null): number | null {
  const iso = toDateIso(value);
  if (!iso) {
    return null;
  }

  const timestampMs = new Date(iso).getTime();
  const diffMs = Date.now() - timestampMs;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 0;
  }

  return Math.floor(diffMs / 60000);
}

function toNumberOrNull(value: string | number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveSortClause(sort: SortMode): string {
  switch (sort) {
    case "buy_asc":
      return "buyRate ASC";
    case "sell_desc":
      return "sellRate DESC";
    case "sell_asc":
      return "sellRate ASC";
    case "buy_desc":
    default:
      return "buyRate DESC";
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currencyCode = (searchParams.get("currencyCode") ?? "").trim().toUpperCase();
  const requestedDate = (searchParams.get("date") ?? "").trim();
  const sourceTypeParam = (searchParams.get("sourceType") ?? "all").trim() as SourceType;
  const sortParam = (searchParams.get("sort") ?? "buy_desc").trim() as SortMode;

  if (!currencyCode || currencyCode.length !== 3) {
    return badRequest("currencyCode must be a 3-letter code");
  }

  if (requestedDate && !isIsoDate(requestedDate)) {
    return badRequest("date must be in YYYY-MM-DD format");
  }

  const sourceType: SourceType = ["bank", "exchange_company", "all"].includes(sourceTypeParam)
    ? sourceTypeParam
    : "all";
  const sort: SortMode = ["buy_desc", "buy_asc", "sell_desc", "sell_asc"].includes(sortParam)
    ? sortParam
    : "buy_desc";

  const sourceTypeFilterSql = sourceType === "all" ? "" : "AND rs.source_type = ?";
  const sourceTypeParams = sourceType === "all" ? [] : [sourceType];

  try {
    let effectiveDate = requestedDate;

    if (!effectiveDate) {
      const dateRows = await dbQuery<DateRow[]>(
        `SELECT MAX(erp.rate_date) AS rateDate
         FROM exchange_rate_points erp
         JOIN rate_sources rs ON rs.id = erp.source_id
         WHERE erp.currency_code = ?
           AND rs.is_active = 1
           ${sourceTypeFilterSql}`,
        [currencyCode, ...sourceTypeParams]
      );

      effectiveDate = dateRows[0]?.rateDate ? String(dateRows[0].rateDate).slice(0, 10) : "";
    }

    if (!effectiveDate) {
      return ok({
        currencyCode,
        date: null,
        rows: [],
        summary: {
          bestBuy: null,
          bestSell: null,
          lowestBuy: null,
          lowestSell: null,
        },
      });
    }

    const sortSql = resolveSortClause(sort);
    const rows = await dbQuery<CompareRow[]>(
      `SELECT
          rs.id AS sourceId,
          rs.name AS sourceName,
          rs.source_type AS sourceType,
          rs.trust_tier AS trustTier,
          rs.trust_score AS trustScore,
          rs.last_verified_at AS lastVerifiedAt,
          erp.buy_rate AS buyRate,
          erp.sell_rate AS sellRate,
          erp.updated_at AS pointUpdatedAt
       FROM exchange_rate_points erp
       JOIN rate_sources rs ON rs.id = erp.source_id
       WHERE erp.currency_code = ?
         AND erp.rate_date = ?
         AND rs.is_active = 1
         ${sourceTypeFilterSql}
       ORDER BY ${sortSql}, rs.name ASC`,
      [currencyCode, effectiveDate, ...sourceTypeParams]
    );

    const normalizedRows = rows.map((row) => {
      const buyRate = toNumberOrNull(row.buyRate);
      const sellRate = toNumberOrNull(row.sellRate);
      return {
        sourceId: row.sourceId,
        sourceName: row.sourceName,
        sourceType: row.sourceType,
        trustTier: row.trustTier,
        trustScore: toNumberOrNull(row.trustScore) ?? 0,
        lastVerifiedAt: toDateIso(row.lastVerifiedAt),
        pointUpdatedAt: toDateIso(row.pointUpdatedAt),
        freshnessMinutes: toFreshnessMinutes(row.pointUpdatedAt),
        buyRate,
        sellRate,
        spread: buyRate !== null && sellRate !== null ? sellRate - buyRate : null,
      };
    });

    const buyCandidates = normalizedRows.filter((row) => row.buyRate !== null) as Array<
      (typeof normalizedRows)[number] & { buyRate: number }
    >;
    const sellCandidates = normalizedRows.filter((row) => row.sellRate !== null) as Array<
      (typeof normalizedRows)[number] & { sellRate: number }
    >;

    const bestBuy = buyCandidates.length
      ? buyCandidates.reduce((best, current) => (current.buyRate > best.buyRate ? current : best))
      : null;
    const lowestBuy = buyCandidates.length
      ? buyCandidates.reduce((best, current) => (current.buyRate < best.buyRate ? current : best))
      : null;
    const bestSell = sellCandidates.length
      ? sellCandidates.reduce((best, current) => (current.sellRate > best.sellRate ? current : best))
      : null;
    const lowestSell = sellCandidates.length
      ? sellCandidates.reduce((best, current) => (current.sellRate < best.sellRate ? current : best))
      : null;

    return ok({
      currencyCode,
      date: effectiveDate,
      rows: normalizedRows,
      summary: {
        bestBuy,
        bestSell,
        lowestBuy,
        lowestSell,
      },
    });
  } catch {
    return serverError("Unable to compare exchange rates");
  }
}
