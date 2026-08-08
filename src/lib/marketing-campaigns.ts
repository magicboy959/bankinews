import { dbExecute, dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, notFound, serverError } from "@/lib/http";
import { sendSmtpEmail } from "@/lib/email/smtp";
import { appendUnsubscribeFooter } from "@/lib/newsletter-unsubscribe";
import { appendMarketingCampaignTrackingHtml } from "@/lib/marketing-campaign-tracking";

type CampaignRow = DbRow & {
  id: number;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
};

type SubscriberRow = DbRow & {
  id: number;
  name: string | null;
  email: string;
  preferredLanguage: "ar" | "en";
};

export type MarketingCampaignSendResult = {
  id: number;
  subject: string;
  status: "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
};

export function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function sendStoredMarketingCampaign(campaignId: number): Promise<
  | { ok: true; data: MarketingCampaignSendResult }
  | { ok: false; error: Response }
> {
  const campaigns = await dbQuery<CampaignRow[]>(
    `SELECT id, subject, html_content AS htmlContent, text_content AS textContent,
            status, recipient_count AS recipientCount, sent_count AS sentCount, failed_count AS failedCount
     FROM marketing_campaigns
     WHERE id = ?
     LIMIT 1`,
    [campaignId]
  );

  const campaign = campaigns[0];
  if (!campaign) {
    return { ok: false, error: notFound("Marketing campaign not found") };
  }

  if (campaign.status === "sending") {
    return { ok: false, error: badRequest("Campaign is already sending") };
  }

  const subscribers = await dbQuery<SubscriberRow[]>(
    `SELECT id, name, email, preferred_language AS preferredLanguage
     FROM newsletter_subscribers
     WHERE status = 'active'
     ORDER BY created_at ASC`
  );

  if (!subscribers.length) {
    await dbExecute(
      `UPDATE marketing_campaigns
       SET status = 'failed', recipient_count = 0, sent_count = 0, failed_count = 0, updated_at = NOW()
       WHERE id = ?`,
      [campaignId]
    );

    return { ok: false, error: badRequest("No active newsletter subscribers found") };
  }

  await dbExecute(
    `UPDATE marketing_campaigns
     SET status = 'sending', recipient_count = ?, updated_at = NOW()
     WHERE id = ?`,
    [subscribers.length, campaignId]
  );

  const textContent = campaign.textContent?.trim() || htmlToText(campaign.htmlContent);
  let sentCount = 0;
  let failedCount = 0;

  for (const subscriber of subscribers) {
    try {
      const footer = appendUnsubscribeFooter(campaign.htmlContent, textContent, {
        id: subscriber.id,
        email: subscriber.email,
        preferredLanguage: subscriber.preferredLanguage,
      });
      const trackedHtml = appendMarketingCampaignTrackingHtml(footer.html, campaignId, {
        id: subscriber.id,
        email: subscriber.email,
      });

      await sendSmtpEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html: trackedHtml,
        text: footer.text,
      });
      sentCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  const finalStatus = failedCount > 0 ? "failed" : "sent";
  await dbExecute(
    `UPDATE marketing_campaigns
     SET status = ?, sent_count = ?, failed_count = ?, sent_at = IF(? = 'sent', NOW(), sent_at), updated_at = NOW()
     WHERE id = ?`,
    [finalStatus, sentCount, failedCount, finalStatus, campaignId]
  );

  return {
    ok: true,
    data: {
      id: campaignId,
      subject: campaign.subject,
      status: finalStatus,
      recipientCount: subscribers.length,
      sentCount,
      failedCount,
    },
  };
}
