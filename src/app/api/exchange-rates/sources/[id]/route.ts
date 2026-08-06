import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { rateSourceAdminSchema } from "@/lib/validation/schemas";

type RateSourceDetailRow = DbRow & {
  id: number;
  name: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  isActive: number;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: number;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const rows = await dbQuery<RateSourceDetailRow[]>(
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
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Rate source not found");
    }

    const row = rows[0];
    return ok({
      id: row.id,
      name: row.name,
      sourceType: row.sourceType,
      isActive: Boolean(row.isActive),
      trustTier: row.trustTier,
      trustScore: Number(row.trustScore),
      lastVerifiedAt: row.lastVerifiedAt ? String(row.lastVerifiedAt).slice(0, 10) : null,
      updatedAt: String(row.updatedAt),
    });
  } catch {
    return serverError("Unable to fetch rate source");
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
    const parsed = rateSourceAdminSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid rate source payload", parsed.error.flatten());
    }

    const updated = await dbTransaction(async ({ execute }) => {
      const result = await execute(
        `UPDATE rate_sources
         SET trust_tier = ?, trust_score = ?, last_verified_at = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          parsed.data.trustTier,
          parsed.data.trustScore,
          parsed.data.lastVerifiedAt ? `${parsed.data.lastVerifiedAt} 00:00:00` : null,
          parsed.data.isActive ? 1 : 0,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'exchange_rate_source_updated', 'rate_source', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Rate source not found");
    }

    return ok({ id: Number(id), updated: true });
  } catch {
    return serverError("Unable to update rate source");
  }
}
