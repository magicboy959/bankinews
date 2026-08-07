import type { RowDataPacket } from "mysql2/promise";
import { dbTransaction } from "@/lib/db/query";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

const allowedStatuses = new Set(["pending", "approved", "rejected", "spam"]);

type CommentRow = RowDataPacket & {
  id: number;
  articleId: number;
  approvalStatus: string;
};

function sanitizeIds(rawIds: unknown): number[] {
  const inputIds = Array.isArray(rawIds) ? rawIds : [];
  return Array.from(
    new Set(
      inputIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
}

export async function PUT(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      ids?: unknown;
      status?: unknown;
    };

    const status = String(body.status ?? "").trim();
    if (!allowedStatuses.has(status)) {
      return badRequest("Invalid status");
    }

    const ids = sanitizeIds(body.ids);

    if (!ids.length) {
      return badRequest("At least one valid comment id is required");
    }

    if (ids.length > 200) {
      return badRequest("Too many comments selected. Please select up to 200.");
    }

    const result = await dbTransaction(async ({ query, execute }) => {
      const placeholders = ids.map(() => "?").join(", ");
      const comments = await query<CommentRow[]>(
        `SELECT id, article_id AS articleId, approval_status AS approvalStatus
         FROM comments
         WHERE deleted_at IS NULL AND id IN (${placeholders})`,
        ids
      );

      if (!comments.length) {
        return { updatedCount: 0 };
      }

      const targetIds = comments.map((row) => row.id);
      const targetPlaceholders = targetIds.map(() => "?").join(", ");

      await execute(
        `UPDATE comments
         SET approval_status = ?, updated_at = NOW()
         WHERE deleted_at IS NULL AND id IN (${targetPlaceholders})`,
        [status, ...targetIds]
      );

      for (const row of comments) {
        await execute(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, metadata, created_at)
           VALUES (?, 'comment_moderated', 'comment', ?, ?, ?, ?, NOW())`,
          [
            user.id,
            row.id,
            row.approvalStatus,
            status,
            JSON.stringify({
              articleId: row.articleId,
              changes: {
                approvalStatus: { from: row.approvalStatus, to: status },
              },
              bulkAction: true,
            }),
          ]
        );
      }

      return { updatedCount: targetIds.length };
    });

    return ok({ updated: result.updatedCount, status });
  } catch {
    return serverError("Unable to bulk update comment statuses");
  }
}

export async function DELETE(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    const ids = sanitizeIds(body.ids);

    if (!ids.length) {
      return badRequest("At least one valid comment id is required");
    }

    if (ids.length > 200) {
      return badRequest("Too many comments selected. Please select up to 200.");
    }

    const result = await dbTransaction(async ({ query, execute }) => {
      const placeholders = ids.map(() => "?").join(", ");
      const comments = await query<CommentRow[]>(
        `SELECT id, article_id AS articleId, approval_status AS approvalStatus
         FROM comments
         WHERE deleted_at IS NULL AND id IN (${placeholders})`,
        ids
      );

      if (!comments.length) {
        return { deletedCount: 0 };
      }

      const targetIds = comments.map((row) => row.id);
      const targetPlaceholders = targetIds.map(() => "?").join(", ");

      await execute(
        `UPDATE comments
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE deleted_at IS NULL AND id IN (${targetPlaceholders})`,
        targetIds
      );

      for (const row of comments) {
        await execute(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, metadata, created_at)
           VALUES (?, 'comment_deleted', 'comment', ?, ?, ?, NOW())`,
          [
            user.id,
            row.id,
            row.approvalStatus,
            JSON.stringify({ articleId: row.articleId, deleted: true, bulkAction: true }),
          ]
        );
      }

      return { deletedCount: targetIds.length };
    });

    return ok({ deleted: result.deletedCount });
  } catch {
    return serverError("Unable to bulk delete comments");
  }
}
