import type { RowDataPacket } from "mysql2/promise";
import { dbTransaction } from "@/lib/db/query";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type Params = {
  id: string;
};

const allowedStatuses = new Set(["pending", "approved", "rejected", "spam"]);

type CommentAuditRow = RowDataPacket & {
  id: number;
  articleId: number;
  approvalStatus: string;
};

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;
  const commentId = Number(id);

  if (!Number.isInteger(commentId) || commentId < 1) {
    return badRequest("Invalid comment id");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    const status = String(body.status ?? "").trim();

    if (!allowedStatuses.has(status)) {
      return badRequest("Invalid status");
    }

    const updated = await dbTransaction(async ({ query, execute }) => {
      const rows = await query<CommentAuditRow[]>(
        `SELECT id, article_id AS articleId, approval_status AS approvalStatus
         FROM comments
         WHERE id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [commentId]
      );

      const previous = rows[0];
      if (!previous) {
        return false;
      }

      await execute(
        `UPDATE comments
         SET approval_status = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [status, commentId]
      );

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, new_status, metadata, created_at)
         VALUES (?, 'comment_moderated', 'comment', ?, ?, ?, ?, NOW())`,
        [
          user.id,
          commentId,
          previous.approvalStatus,
          status,
          JSON.stringify({
            articleId: previous.articleId,
            changes: {
              approvalStatus: { from: previous.approvalStatus, to: status },
            },
          }),
        ]
      );

      return true;
    });

    if (!updated) {
      return notFound("Comment not found");
    }

    return ok({ id: commentId, status });
  } catch {
    return serverError("Unable to update comment status");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;
  const commentId = Number(id);

  if (!Number.isInteger(commentId) || commentId < 1) {
    return badRequest("Invalid comment id");
  }

  try {
    const deleted = await dbTransaction(async ({ query, execute }) => {
      const rows = await query<CommentAuditRow[]>(
        `SELECT id, article_id AS articleId, approval_status AS approvalStatus
         FROM comments
         WHERE id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [commentId]
      );

      const previous = rows[0];
      if (!previous) {
        return false;
      }

      await execute(
        `UPDATE comments
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [commentId]
      );

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, previous_status, metadata, created_at)
         VALUES (?, 'comment_deleted', 'comment', ?, ?, ?, NOW())`,
        [
          user.id,
          commentId,
          previous.approvalStatus,
          JSON.stringify({ articleId: previous.articleId, deleted: true }),
        ]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Comment not found");
    }

    return ok({ deleted: true, id: commentId });
  } catch {
    return serverError("Unable to delete comment");
  }
}
