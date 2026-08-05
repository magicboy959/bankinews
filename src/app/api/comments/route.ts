import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, ok, serverError } from "@/lib/http";
import { commentSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = Number(searchParams.get("articleId") ?? 0);

  if (!Number.isInteger(articleId) || articleId < 1) {
    return badRequest("Invalid article id");
  }

  try {
    const rows = await dbQuery<any[]>(
      `SELECT id, name, comment, created_at AS createdAt
       FROM comments
       WHERE article_id = ? AND approval_status = 'approved' AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [articleId]
    );

    return ok(rows);
  } catch {
    return serverError("Unable to fetch comments");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid comment payload", parsed.error.flatten());
    }

    await dbExecute(
      `INSERT INTO comments (article_id, name, email, comment, approval_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [parsed.data.articleId, parsed.data.name, parsed.data.email, parsed.data.comment]
    );

    return created({ submitted: true, status: "pending" });
  } catch {
    return serverError("Unable to submit comment");
  }
}
