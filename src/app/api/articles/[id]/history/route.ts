import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type HistoryRow = DbRow & {
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  metadata: unknown;
  createdAt: string;
  editorName: string | null;
};

function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

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
    const rows = await dbQuery<HistoryRow[]>(
      `SELECT al.action,
              al.previous_status AS previousStatus,
              al.new_status AS newStatus,
              al.metadata,
              al.created_at AS createdAt,
              u.display_name AS editorName
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity_type = 'article'
         AND al.entity_id = ?
         AND al.action IN ('article_created', 'article_updated', 'article_deleted')
       ORDER BY al.created_at DESC
       LIMIT 25`,
      [id]
    );

    return ok(
      rows.map((row) => ({
        action: row.action,
        previousStatus: row.previousStatus,
        newStatus: row.newStatus,
        metadata: parseMetadata(row.metadata),
        createdAt: String(row.createdAt),
        editorName: row.editorName,
      }))
    );
  } catch {
    return serverError("Unable to fetch article history");
  }
}
