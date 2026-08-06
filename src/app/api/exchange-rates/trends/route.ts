import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, ok, serverError } from "@/lib/http";

type SourceType = "bank" | "exchange_company" | "all";
type Metric = "buy" | "sell";

type LatestDateRow = DbRow & {
  latestDate: string | null;
};

type TrendRow = DbRow & {
  sourceId: number;
  sourceName: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: string | number;
  lastVerifiedAt: string | Date | null;
  rateDate: string;
  buyRate: string | number | null;
  sellRate: string | number | null;
  pointUpdatedAt: string | Date | null;
};

type TrendPoint = {
  date: string;
  buyRate: number | null;
  sellRate: number | null;
  value: number | null;
};

function toNumberOrNull(value: string | number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSourceType(value: string): SourceType {
  if (value === "bank" || value === "exchange_company") {
    return value;
  }
  return "all";
}

function normalizeMetric(value: string): Metric {
  if (value === "buy") {
    return "buy";
  }
  return "sell";
}

function normalizeDays(value: string): 7 | 30 | 90 {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 90) {
    return parsed;
  }
  return 30;
}

function dateToIso(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function subtractDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currencyCode = (searchParams.get("currencyCode") ?? "").trim().toUpperCase();
  const sourceType = normalizeSourceType((searchParams.get("sourceType") ?? "all").trim());
  const metric = normalizeMetric((searchParams.get("metric") ?? "sell").trim());
  const days = normalizeDays((searchParams.get("days") ?? "30").trim());

  if (!currencyCode || currencyCode.length !== 3) {
    return badRequest("currencyCode must be a 3-letter code");
  }

  const sourceTypeFilterSql = sourceType === "all" ? "" : "AND rs.source_type = ?";
  const sourceTypeParams = sourceType === "all" ? [] : [sourceType];

  try {
    const latestDateRows = await dbQuery<LatestDateRow[]>(
      `SELECT MAX(erp.rate_date) AS latestDate
       FROM exchange_rate_points erp
       JOIN rate_sources rs ON rs.id = erp.source_id
       WHERE erp.currency_code = ?
         AND rs.is_active = 1
         ${sourceTypeFilterSql}`,
      [currencyCode, ...sourceTypeParams]
    );

    const latestDate = latestDateRows[0]?.latestDate ? dateToIso(latestDateRows[0].latestDate) : "";
    if (!latestDate) {
      return ok({
        currencyCode,
        sourceType,
        metric,
        days,
        fromDate: null,
        toDate: null,
        dates: [],
        series: [],
      });
    }

    const fromDate = subtractDays(latestDate, days - 1);

    const rows = await dbQuery<TrendRow[]>(
      `SELECT
          rs.id AS sourceId,
          rs.name AS sourceName,
          rs.source_type AS sourceType,
          rs.trust_tier AS trustTier,
          rs.trust_score AS trustScore,
          rs.last_verified_at AS lastVerifiedAt,
          erp.rate_date AS rateDate,
          erp.buy_rate AS buyRate,
          erp.sell_rate AS sellRate,
          erp.updated_at AS pointUpdatedAt
       FROM exchange_rate_points erp
       JOIN rate_sources rs ON rs.id = erp.source_id
       WHERE erp.currency_code = ?
         AND rs.is_active = 1
         AND erp.rate_date BETWEEN ? AND ?
         ${sourceTypeFilterSql}
       ORDER BY erp.rate_date ASC, rs.name ASC`,
      [currencyCode, fromDate, latestDate, ...sourceTypeParams]
    );

    const dateSet = new Set<string>();
    const grouped = new Map<number, {
      sourceId: number;
      sourceName: string;
      sourceType: TrendRow["sourceType"];
      trustTier: TrendRow["trustTier"];
      trustScore: number;
      lastVerifiedAt: string | null;
      pointMap: Map<string, TrendPoint>;
      latestPointUpdatedAt: string | null;
    }>();

    for (const row of rows) {
      const date = dateToIso(row.rateDate);
      dateSet.add(date);

      const buyRate = toNumberOrNull(row.buyRate);
      const sellRate = toNumberOrNull(row.sellRate);
      const value = metric === "buy" ? buyRate : sellRate;

      const current = grouped.get(row.sourceId) ?? {
        sourceId: row.sourceId,
        sourceName: row.sourceName,
        sourceType: row.sourceType,
        trustTier: row.trustTier,
        trustScore: toNumberOrNull(row.trustScore) ?? 0,
        lastVerifiedAt: toDateIso(row.lastVerifiedAt),
        pointMap: new Map<string, TrendPoint>(),
        latestPointUpdatedAt: null,
      };

      const pointUpdatedAtIso = toDateIso(row.pointUpdatedAt);
      if (pointUpdatedAtIso && (!current.latestPointUpdatedAt || pointUpdatedAtIso > current.latestPointUpdatedAt)) {
        current.latestPointUpdatedAt = pointUpdatedAtIso;
      }

      current.pointMap.set(date, {
        date,
        buyRate,
        sellRate,
        value,
      });
      grouped.set(row.sourceId, current);
    }

    const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    const series = Array.from(grouped.values())
      .map((entry) => {
        const points = dates.map((date) => {
          const existing = entry.pointMap.get(date);
          return (
            existing ?? {
              date,
              buyRate: null,
              sellRate: null,
              value: null,
            }
          );
        });

        const presentValues = points
          .map((point) => point.value)
          .filter((value): value is number => value !== null);
        const latestValue = points[points.length - 1]?.value ?? null;
        const firstValue = points.find((point) => point.value !== null)?.value ?? null;

        return {
          sourceId: entry.sourceId,
          sourceName: entry.sourceName,
          sourceType: entry.sourceType,
          trustTier: entry.trustTier,
          trustScore: entry.trustScore,
          lastVerifiedAt: entry.lastVerifiedAt,
          latestPointUpdatedAt: entry.latestPointUpdatedAt,
          freshnessMinutes: toFreshnessMinutes(entry.latestPointUpdatedAt),
          points,
          latestValue,
          minValue: presentValues.length ? Math.min(...presentValues) : null,
          maxValue: presentValues.length ? Math.max(...presentValues) : null,
          change: firstValue !== null && latestValue !== null ? latestValue - firstValue : null,
          pointsCount: presentValues.length,
        };
      })
      .sort((a, b) => {
        if (b.pointsCount !== a.pointsCount) {
          return b.pointsCount - a.pointsCount;
        }
        const aLatest = a.latestValue ?? -Infinity;
        const bLatest = b.latestValue ?? -Infinity;
        if (bLatest !== aLatest) {
          return bLatest - aLatest;
        }
        return a.sourceName.localeCompare(b.sourceName);
      })
      .slice(0, 6);

    return ok({
      currencyCode,
      sourceType,
      metric,
      days,
      fromDate,
      toDate: latestDate,
      dates,
      series,
    });
  } catch {
    return serverError("Unable to fetch exchange rate trends");
  }
}
