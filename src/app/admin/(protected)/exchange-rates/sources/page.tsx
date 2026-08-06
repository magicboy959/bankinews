import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { RateSourceAdminManager } from "@/components/admin/rate-source-admin-manager";

type RateSourceRow = DbRow & {
  id: number;
  name: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  isActive: number;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: number;
  lastVerifiedAt: string | null;
  updatedAt: string;
  rateCount: number;
  latestRateDate: string | null;
};

function toText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function toPage(value: string | string[] | undefined): number {
  const parsed = Number(toText(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminExchangeRateSourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = toText(query.q).trim();
  const sourceType = toText(query.type).trim();
  const active = toText(query.active).trim();
  const page = toPage(query.page);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const filters: string[] = ["1=1"];
  const params: Array<string | number> = [];

  if (q) {
    filters.push("rs.name LIKE ?");
    params.push(`%${q}%`);
  }

  if (["bank", "exchange_company", "central_bank", "other"].includes(sourceType)) {
    filters.push("rs.source_type = ?");
    params.push(sourceType);
  }

  if (active === "active") {
    filters.push("rs.is_active = 1");
  } else if (active === "inactive") {
    filters.push("rs.is_active = 0");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const countRows = await dbQuery<Array<DbRow & { total: number }>>(
    `SELECT COUNT(*) AS total
     FROM rate_sources rs
     ${whereClause}`,
    params
  );
  const totalCount = countRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const safeOffset = (safePage - 1) * pageSize;

  const rows = await dbQuery<RateSourceRow[]>(
    `SELECT
        rs.id,
        rs.name,
        rs.source_type AS sourceType,
        rs.is_active AS isActive,
        rs.trust_tier AS trustTier,
        rs.trust_score AS trustScore,
        rs.last_verified_at AS lastVerifiedAt,
        rs.updated_at AS updatedAt,
        COALESCE(stats.rateCount, 0) AS rateCount,
        stats.latestRateDate AS latestRateDate
     FROM rate_sources rs
     LEFT JOIN (
        SELECT source, COUNT(*) AS rateCount, MAX(rate_date) AS latestRateDate
        FROM exchange_rates
        WHERE deleted_at IS NULL
        GROUP BY source
     ) stats ON stats.source = rs.name
     ${whereClause}
     ORDER BY rs.updated_at DESC, rs.name ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, safeOffset]
  );

  return (
    <RateSourceAdminManager
      initialSources={rows.map((row) => ({
        id: row.id,
        name: row.name,
        sourceType: row.sourceType,
        isActive: Boolean(row.isActive),
        trustTier: row.trustTier,
        trustScore: Number(row.trustScore),
        lastVerifiedAt: row.lastVerifiedAt ? String(row.lastVerifiedAt).slice(0, 10) : null,
        updatedAt: String(row.updatedAt),
        rateCount: Number(row.rateCount),
        latestRateDate: row.latestRateDate ? String(row.latestRateDate).slice(0, 10) : null,
      }))}
      totalCount={totalCount}
      currentPage={safePage}
      totalPages={totalPages}
      filters={{
        q,
        sourceType: sourceType || "all",
        active: active || "all",
      }}
    />
  );
}
