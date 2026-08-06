import type { DbRow } from "@/lib/db/pool";
import { dbQuery } from "@/lib/db/query";
import { forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type SubscriberRow = DbRow & {
  id: number;
  name: string | null;
  email: string;
  preferredLanguage: "ar" | "en";
  status: "pending" | "active" | "unsubscribed";
  createdAt: string;
  updatedAt: string;
};

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<SubscriberRow[]>(
      `SELECT id, name, email,
              preferred_language AS preferredLanguage,
              status,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM newsletter_subscribers
       ORDER BY created_at DESC
       LIMIT 300`
    );

    return ok(rows);
  } catch {
    return serverError("Unable to fetch newsletter subscribers");
  }
}
