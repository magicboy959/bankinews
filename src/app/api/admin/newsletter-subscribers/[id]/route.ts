import { dbExecute } from "@/lib/db/query";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

const allowedStatuses = new Set(["pending", "active", "unsubscribed"]);

type Params = {
  id: string;
};

export async function PUT(
  request: Request,
  context: { params: Promise<Params> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;
  const subscriberId = Number(id);

  if (!Number.isInteger(subscriberId) || subscriberId < 1) {
    return badRequest("Invalid subscriber id");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
    };

    const status = String(body.status ?? "").trim();
    if (!allowedStatuses.has(status)) {
      return badRequest("Invalid status");
    }

    await dbExecute(
      `UPDATE newsletter_subscribers
       SET status = ?, updated_at = NOW(),
           subscribed_at = IF(? = 'active' AND subscribed_at IS NULL, NOW(), subscribed_at),
           unsubscribed_at = IF(? = 'unsubscribed', NOW(), NULL)
       WHERE id = ?`,
      [status, status, status, subscriberId]
    );

    return ok({ id: subscriberId, status });
  } catch {
    return serverError("Unable to update subscriber");
  }
}
