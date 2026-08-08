import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { requireAdminUser } from "@/lib/auth/guard";
import { redirect } from "next/navigation";
import { MarketingCampaignManager } from "@/components/admin/marketing-campaign-manager";

type CampaignRow = DbRow & {
  id: number;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  scheduledAt: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SubscriberCountRow = DbRow & { count: number };

export default async function AdminMarketingPage() {
  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [campaigns, activeSubscribers] = await Promise.all([
    dbQuery<CampaignRow[]>(
      `SELECT id, subject,
              html_content AS htmlContent,
              text_content AS textContent,
              scheduled_at AS scheduledAt,
              status,
              recipient_count AS recipientCount,
              sent_count AS sentCount,
              failed_count AS failedCount,
              open_count AS openCount,
              click_count AS clickCount,
              last_opened_at AS lastOpenedAt,
              last_clicked_at AS lastClickedAt,
              sent_at AS sentAt,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM marketing_campaigns
       ORDER BY created_at DESC
       LIMIT 100`
    ),
    dbQuery<SubscriberCountRow[]>(
      `SELECT COUNT(*) AS count
       FROM newsletter_subscribers
       WHERE status = 'active'`
    ),
  ]);

  return (
    <MarketingCampaignManager
      initialCampaigns={campaigns}
      activeSubscriberCount={Number(activeSubscribers[0]?.count ?? 0)}
    />
  );
}
