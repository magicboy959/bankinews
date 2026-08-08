import { dbQuery } from "@/lib/db/query";
import { ok, serverError } from "@/lib/http";
import { sendStoredMarketingCampaign } from "@/lib/marketing-campaigns";

type DueCampaignRow = {
  id: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const providedSecret = url.searchParams.get("secret")?.trim() ?? "";

  if (expectedSecret && providedSecret !== expectedSecret) {
    return serverError("Unauthorized cron request");
  }

  try {
    const rows = await dbQuery<DueCampaignRow[]>(
      `SELECT id
       FROM marketing_campaigns
       WHERE status = 'scheduled'
         AND scheduled_at IS NOT NULL
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC, id ASC
       LIMIT 20`
    );

    const results: Array<{ id: number; status: string; sentCount: number; failedCount: number }> = [];

    for (const row of rows) {
      const result = await sendStoredMarketingCampaign(row.id);
      if (result.ok) {
        results.push({
          id: result.data.id,
          status: result.data.status,
          sentCount: result.data.sentCount,
          failedCount: result.data.failedCount,
        });
      }
    }

    return ok({ processed: rows.length, results });
  } catch {
    return serverError("Unable to process scheduled campaigns");
  }
}
