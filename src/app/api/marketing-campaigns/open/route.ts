import { dbExecute } from "@/lib/db/query";
import { NextResponse } from "next/server";
import { verifyMarketingCampaignTrackingToken } from "@/lib/marketing-campaign-tracking";

const pixel = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const campaignId = Number(url.searchParams.get("campaignId"));
  const subscriberId = Number(url.searchParams.get("subscriberId"));
  const token = url.searchParams.get("token") ?? "";

  if (!Number.isInteger(campaignId) || campaignId < 1 || !Number.isInteger(subscriberId) || subscriberId < 1) {
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  try {
    const email = String(url.searchParams.get("email") ?? "");
    if (email && verifyMarketingCampaignTrackingToken(campaignId, subscriberId, email, token)) {
      await dbExecute(
        `INSERT INTO marketing_campaign_events
         (campaign_id, subscriber_id, subscriber_email, event_type, user_agent, ip_address, created_at)
         VALUES (?, ?, ?, 'open', ?, ?, NOW())`,
        [
          campaignId,
          subscriberId,
          email,
          request.headers.get("user-agent")?.slice(0, 512) ?? null,
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) ?? null,
        ]
      );

      await dbExecute(
        `UPDATE marketing_campaigns
         SET open_count = open_count + 1, last_opened_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [campaignId]
      );
    }
  } catch {
    // ignore tracking failures
  }

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
