import { dbExecute } from "@/lib/db/query";
import { NextResponse } from "next/server";
import { verifyMarketingCampaignTrackingToken } from "@/lib/marketing-campaign-tracking";

function safeRedirectTarget(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    const url = new URL(decoded, process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.bankinews.com");
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const campaignId = Number(url.searchParams.get("campaignId"));
  const subscriberId = Number(url.searchParams.get("subscriberId"));
  const token = url.searchParams.get("token") ?? "";
  const targetUrl = safeRedirectTarget(url.searchParams.get("url"));

  if (!Number.isInteger(campaignId) || campaignId < 1 || !Number.isInteger(subscriberId) || subscriberId < 1 || !targetUrl) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.bankinews.com", 302);
  }

  try {
    const email = String(url.searchParams.get("email") ?? "");
    if (email && verifyMarketingCampaignTrackingToken(campaignId, subscriberId, email, token)) {
      await dbExecute(
        `INSERT INTO marketing_campaign_events
         (campaign_id, subscriber_id, subscriber_email, event_type, target_url, user_agent, ip_address, created_at)
         VALUES (?, ?, ?, 'click', ?, ?, ?, NOW())`,
        [
          campaignId,
          subscriberId,
          email,
          targetUrl,
          request.headers.get("user-agent")?.slice(0, 512) ?? null,
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) ?? null,
        ]
      );

      await dbExecute(
        `UPDATE marketing_campaigns
         SET click_count = click_count + 1, last_clicked_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [campaignId]
      );
    }
  } catch {
    // ignore tracking failures
  }

  return NextResponse.redirect(targetUrl, 302);
}
