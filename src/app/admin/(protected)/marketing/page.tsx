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
type ContentReadinessRow = DbRow & {
  publishedArticles: number;
  publishedGuides: number;
  visibleBankProfiles: number;
  verifiedArticles: number;
  verifiedGuides: number;
  maintainedBankProfiles: number;
};

export default async function AdminMarketingPage() {
  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [campaigns, activeSubscribers, contentReadiness] = await Promise.all([
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
    dbQuery<ContentReadinessRow[]>(
      `SELECT
         (SELECT COUNT(*) FROM articles WHERE status = 'published' AND deleted_at IS NULL) AS publishedArticles,
         (SELECT COUNT(*) FROM articles WHERE status = 'published' AND article_type = 'guide' AND deleted_at IS NULL) AS publishedGuides,
         (SELECT COUNT(*) FROM banks WHERE show_on_website = 1 AND deleted_at IS NULL) AS visibleBankProfiles,
         (SELECT COUNT(*) FROM articles
          WHERE status = 'published' AND deleted_at IS NULL
            AND source_verification_status IN ('editorial_review', 'official')
            AND source_last_verified_at >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)) AS verifiedArticles,
         (SELECT COUNT(*) FROM articles
          WHERE status = 'published' AND article_type = 'guide' AND deleted_at IS NULL
            AND source_verification_status IN ('editorial_review', 'official')
            AND source_last_verified_at >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)) AS verifiedGuides,
         (SELECT COUNT(DISTINCT b.id)
          FROM banks b
          JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
          WHERE b.show_on_website = 1 AND b.deleted_at IS NULL
            AND b.official_website IS NOT NULL
            AND b.official_website NOT LIKE '%example.com%'
            AND b.last_updated_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
            AND CHAR_LENGTH(TRIM(COALESCE(bt.full_description, ''))) >= 100) AS maintainedBankProfiles`
    ),
  ]);

  return (
    <MarketingCampaignManager
      initialCampaigns={campaigns}
      activeSubscriberCount={Number(activeSubscribers[0]?.count ?? 0)}
      contentReadiness={{
        publishedArticles: Number(contentReadiness[0]?.publishedArticles ?? 0),
        publishedGuides: Number(contentReadiness[0]?.publishedGuides ?? 0),
        visibleBankProfiles: Number(contentReadiness[0]?.visibleBankProfiles ?? 0),
        verifiedArticles: Number(contentReadiness[0]?.verifiedArticles ?? 0),
        verifiedGuides: Number(contentReadiness[0]?.verifiedGuides ?? 0),
        maintainedBankProfiles: Number(contentReadiness[0]?.maintainedBankProfiles ?? 0),
      }}
    />
  );
}
