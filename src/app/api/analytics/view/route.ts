import { dbExecute } from "@/lib/db/query";
import { badRequest, created, serverError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articleId = Number(body?.articleId);

    if (!Number.isInteger(articleId) || articleId < 1) {
      return badRequest("Invalid articleId");
    }

    await dbExecute(
      `INSERT INTO article_views (article_id, viewed_at, created_at)
       VALUES (?, NOW(), NOW())`,
      [articleId]
    );

    return created({ tracked: true });
  } catch {
    return serverError("Unable to track view");
  }
}
