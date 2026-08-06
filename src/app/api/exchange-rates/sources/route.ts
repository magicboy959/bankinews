import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

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

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<RateSourceRow[]>(
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

    return ok(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        sourceType: row.sourceType,
        isActive: Boolean(row.isActive),
        trustTier: row.trustTier,
        trustScore: Number(row.trustScore),
        lastVerifiedAt: row.lastVerifiedAt ? String(row.lastVerifiedAt).slice(0, 10) : null,
        updatedAt: String(row.updatedAt),
      }))
    );
  } catch {
    return serverError("Unable to fetch rate sources");
  }
}
