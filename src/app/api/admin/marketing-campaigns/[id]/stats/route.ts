import type { DbRow } from "@/lib/db/pool";
import { dbQuery } from "@/lib/db/query";
import { forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type CampaignStatsRow = DbRow & {
  id: number;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CampaignStatsPayload = CampaignStatsRow & {
  openRate: number;
  clickRate: number;
};

type CampaignEventRow = DbRow & {
  id: number;
  eventType: "open" | "click";
  subscriberEmail: string;
  targetUrl: string | null;
  createdAt: string;
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
  const campaignId = Number(id);

  if (!Number.isInteger(campaignId) || campaignId < 1) {
    return notFound("Campaign not found");
  }

  try {
    const [campaignRows, eventRows] = await Promise.all([
      dbQuery<CampaignStatsRow[]>(
        `SELECT id, subject, status, recipient_count AS recipientCount, sent_count AS sentCount,
                failed_count AS failedCount, open_count AS openCount, click_count AS clickCount,
                last_opened_at AS lastOpenedAt, last_clicked_at AS lastClickedAt,
                sent_at AS sentAt, scheduled_at AS scheduledAt,
                created_at AS createdAt, updated_at AS updatedAt
         FROM marketing_campaigns
         WHERE id = ?
         LIMIT 1`,
        [campaignId]
      ),
      dbQuery<CampaignEventRow[]>(
        `SELECT id,
                event_type AS eventType,
                subscriber_email AS subscriberEmail,
                target_url AS targetUrl,
                created_at AS createdAt
         FROM marketing_campaign_events
         WHERE campaign_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 20`,
        [campaignId]
      ),
    ]);

    const campaign = campaignRows[0];
    if (!campaign) {
      return notFound("Campaign not found");
    }

    const openRate = campaign.sentCount > 0 ? Number(((campaign.openCount / campaign.sentCount) * 100).toFixed(1)) : 0;
    const clickRate = campaign.sentCount > 0 ? Number(((campaign.clickCount / campaign.sentCount) * 100).toFixed(1)) : 0;

    return ok({
      campaign: {
        ...campaign,
        openRate,
        clickRate,
      } satisfies CampaignStatsPayload,
      recentEvents: eventRows,
    });
  } catch {
    return serverError("Unable to fetch campaign stats");
  }
}