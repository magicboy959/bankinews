import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import type { DbRow } from "@/lib/db/pool";
import { withConnection } from "@/lib/db/pool";
import { requireAdminUser } from "@/lib/auth/guard";
import { DashboardAdminManager } from "@/components/admin/dashboard-admin-manager";

type CountRow = DbRow & {
  count: number;
};

type ArticleRow = DbRow & {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  title: string | null;
  updatedAt: string;
  publishAt: string | null;
  isBreaking: number | boolean;
  isFeatured: number | boolean;
};

type PopularRow = DbRow & {
  id: number;
  title: string;
  views: number;
};

type JobAlertRow = DbRow & {
  id: number;
  title: string;
  applicationDeadline: string;
};

type RateAlertRow = DbRow & {
  id: number;
  currencyCode: string;
  rateDate: string;
};

type MessageAlertRow = DbRow & {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
};

type OptionRow = DbRow & {
  id: number;
  name: string;
};

type SubscriberRow = DbRow & {
  id: number;
  name: string | null;
  email: string;
  preferredLanguage: "ar" | "en";
  status: "pending" | "active" | "unsubscribed";
  createdAt: string;
};

type MediaRow = DbRow & {
  id: number;
  fileName: string;
  url: string;
  createdAt: string;
};

type MarketingOverviewRow = DbRow & {
  campaignCount: number;
  sentTotal: number;
  openTotal: number;
  clickTotal: number;
  sentCampaigns: number;
};

type EngagementOverviewRow = DbRow & {
  avgScrollPercent: number;
  completionRate: number;
  avgDwellSeconds: number;
  eventCount: number;
};

type TopEngagedArticleRow = DbRow & {
  id: number;
  title: string;
  maxScroll: number;
  maxDwellSeconds: number;
  events: number;
};

type EngagementRange = "7d" | "30d" | "90d";

function normalizeEngagementRange(value: string | undefined): EngagementRange {
  if (value === "7d" || value === "90d") {
    return value;
  }

  return "30d";
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ engagementRange?: string }>;
}) {
  const params = await searchParams;
  const engagementRange = normalizeEngagementRange(params.engagementRange);
  const engagementRangeDays = engagementRange === "7d" ? 7 : engagementRange === "90d" ? 90 : 30;

  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const dashboardData = await withConnection(async (conn) => {
    const query = async <T = DbRow[]>(sql: string, params: Array<string | number | boolean | Date | Buffer | null> = []): Promise<T> => {
      const [rows] = await conn.query<RowDataPacket[]>(sql, params);
      return rows as unknown as T;
    };

    const publishedToday = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status = 'published' AND DATE(published_at) = CURDATE() AND deleted_at IS NULL`
    );
    const draftsWaitingReview = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status IN ('draft', 'review') AND deleted_at IS NULL`
    );
    const scheduledPosts = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status = 'scheduled' AND deleted_at IS NULL`
    );
    const expiredJobsCount = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM jobs
       WHERE status <> 'archived' AND application_deadline < CURDATE() AND deleted_at IS NULL`
    );
    const ratesNeedingUpdates = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM exchange_rates
       WHERE rate_date < DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND deleted_at IS NULL`
    );
    const messagesNeedResponse = await query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM contact_messages
       WHERE status IN ('new', 'in_review')`
    );
    const articleRows = await query<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_featured AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.deleted_at IS NULL
       ORDER BY a.updated_at DESC
       LIMIT 60`
     );
     const draftRows = await query<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_featured AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.status IN ('draft', 'review') AND a.deleted_at IS NULL
       ORDER BY a.updated_at DESC
       LIMIT 20`
     );
     const scheduledRows = await query<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_featured AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.status = 'scheduled' AND a.deleted_at IS NULL
       ORDER BY a.publish_at ASC, a.updated_at DESC
       LIMIT 20`
     );
     const popularRows = await query<PopularRow[]>(
      `SELECT a.id,
              COALESCE(at.title, a.slug) AS title,
              COUNT(av.id) AS views
       FROM article_views av
       JOIN articles a ON a.id = av.article_id AND a.deleted_at IS NULL
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       GROUP BY a.id, title
       ORDER BY views DESC
       LIMIT 10`
     );
     const expiredJobs = await query<JobAlertRow[]>(
      `SELECT j.id,
              COALESCE(jt.title, j.slug) AS title,
              j.application_deadline AS applicationDeadline
       FROM jobs j
       LEFT JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = 'ar'
       WHERE j.status <> 'archived' AND j.application_deadline < CURDATE() AND j.deleted_at IS NULL
       ORDER BY j.application_deadline ASC
       LIMIT 10`
     );
     const staleRates = await query<RateAlertRow[]>(
      `SELECT id, currency_code AS currencyCode, rate_date AS rateDate
       FROM exchange_rates
       WHERE rate_date < DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND deleted_at IS NULL
       ORDER BY rate_date ASC
       LIMIT 10`
     );
     const pendingMessages = await query<MessageAlertRow[]>(
      `SELECT id, subject, status, created_at AS createdAt
       FROM contact_messages
       WHERE status IN ('new', 'in_review')
       ORDER BY created_at ASC
       LIMIT 10`
     );
     const bankOptions = await query<OptionRow[]>(
      `SELECT b.id, bt.name
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
       WHERE b.deleted_at IS NULL
       ORDER BY bt.name ASC`
     );
     const categoryOptions = await query<OptionRow[]>(
      `SELECT c.id, ct.title AS name
       FROM categories c
       JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ar'
       WHERE c.deleted_at IS NULL
       ORDER BY ct.title ASC`
     );
     const subscribers = await query<SubscriberRow[]>(
      `SELECT id, name, email,
              preferred_language AS preferredLanguage,
              status,
              created_at AS createdAt
       FROM newsletter_subscribers
       ORDER BY created_at DESC
       LIMIT 120`
     );
     const recentMedia = await query<MediaRow[]>(
      `SELECT id, file_name AS fileName, url, created_at AS createdAt
       FROM media
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 30`
     );
     const marketingOverview = await query<MarketingOverviewRow[]>(
      `SELECT COUNT(*) AS campaignCount,
              COALESCE(SUM(sent_count), 0) AS sentTotal,
              COALESCE(SUM(open_count), 0) AS openTotal,
              COALESCE(SUM(click_count), 0) AS clickTotal,
              COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) AS sentCampaigns
       FROM marketing_campaigns`
    );
    const engagementOverview = await query<EngagementOverviewRow[]>(
      `SELECT
          COALESCE(AVG(CASE WHEN event_name LIKE 'scroll_%' THEN progress_percent END), 0) AS avgScrollPercent,
          COALESCE(
            100 * SUM(CASE WHEN event_name = 'scroll_100' THEN 1 ELSE 0 END) /
            NULLIF(SUM(CASE WHEN event_name = 'scroll_25' THEN 1 ELSE 0 END), 0),
            0
          ) AS completionRate,
          COALESCE(AVG(CASE WHEN event_name LIKE 'dwell_%' THEN seconds_on_page END), 0) AS avgDwellSeconds,
          COUNT(*) AS eventCount
       FROM article_engagement_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${engagementRangeDays} DAY)`
    );
    const topEngagedArticles = await query<TopEngagedArticleRow[]>(
      `SELECT
          a.id,
          COALESCE(at.title, a.slug) AS title,
          COALESCE(MAX(CASE WHEN aee.event_name LIKE 'scroll_%' THEN aee.progress_percent END), 0) AS maxScroll,
          COALESCE(MAX(CASE WHEN aee.event_name LIKE 'dwell_%' THEN aee.seconds_on_page END), 0) AS maxDwellSeconds,
          COUNT(*) AS events
       FROM article_engagement_events aee
       JOIN articles a ON a.id = aee.article_id AND a.deleted_at IS NULL
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE aee.created_at >= DATE_SUB(NOW(), INTERVAL ${engagementRangeDays} DAY)
       GROUP BY a.id, title
       ORDER BY (COALESCE(MAX(CASE WHEN aee.event_name LIKE 'scroll_%' THEN aee.progress_percent END), 0)
         + LEAST(COALESCE(MAX(CASE WHEN aee.event_name LIKE 'dwell_%' THEN aee.seconds_on_page END), 0) / 3, 100)) DESC,
         events DESC
       LIMIT 8`
    );

    return {
      publishedToday,
      draftsWaitingReview,
      scheduledPosts,
      expiredJobsCount,
      ratesNeedingUpdates,
      messagesNeedResponse,
      articleRows,
      draftRows,
      scheduledRows,
      popularRows,
      expiredJobs,
      staleRates,
      pendingMessages,
      bankOptions,
      categoryOptions,
      subscribers,
      recentMedia,
      marketingOverview,
      engagementOverview,
      topEngagedArticles,
    };
  });

  return (
    <DashboardAdminManager
      summary={{
        publishedToday: Number(dashboardData.publishedToday[0]?.count ?? 0),
        draftsWaitingReview: Number(dashboardData.draftsWaitingReview[0]?.count ?? 0),
        scheduledPosts: Number(dashboardData.scheduledPosts[0]?.count ?? 0),
        expiredJobs: Number(dashboardData.expiredJobsCount[0]?.count ?? 0),
        ratesNeedingUpdates: Number(dashboardData.ratesNeedingUpdates[0]?.count ?? 0),
        messagesNeedResponse: Number(dashboardData.messagesNeedResponse[0]?.count ?? 0),
      }}
      articleRows={dashboardData.articleRows}
      draftRows={dashboardData.draftRows}
      scheduledRows={dashboardData.scheduledRows}
      popularRows={dashboardData.popularRows.map((row) => ({ ...row, views: Number(row.views) }))}
      expiredJobs={dashboardData.expiredJobs}
      staleRates={dashboardData.staleRates}
      pendingMessages={dashboardData.pendingMessages}
      bankOptions={dashboardData.bankOptions}
      categoryOptions={dashboardData.categoryOptions}
      initialSubscribers={dashboardData.subscribers}
      recentMedia={dashboardData.recentMedia}
      marketingOverview={{
        campaignCount: Number(dashboardData.marketingOverview[0]?.campaignCount ?? 0),
        sentTotal: Number(dashboardData.marketingOverview[0]?.sentTotal ?? 0),
        openTotal: Number(dashboardData.marketingOverview[0]?.openTotal ?? 0),
        clickTotal: Number(dashboardData.marketingOverview[0]?.clickTotal ?? 0),
        sentCampaigns: Number(dashboardData.marketingOverview[0]?.sentCampaigns ?? 0),
      }}
      engagementOverview={{
        avgScrollPercent: Number(dashboardData.engagementOverview[0]?.avgScrollPercent ?? 0),
        completionRate: Number(dashboardData.engagementOverview[0]?.completionRate ?? 0),
        avgDwellSeconds: Number(dashboardData.engagementOverview[0]?.avgDwellSeconds ?? 0),
        eventCount: Number(dashboardData.engagementOverview[0]?.eventCount ?? 0),
      }}
      engagementRange={engagementRange}
      topEngagedArticles={dashboardData.topEngagedArticles.map((row) => ({
        id: Number(row.id),
        title: row.title,
        maxScroll: Number(row.maxScroll ?? 0),
        maxDwellSeconds: Number(row.maxDwellSeconds ?? 0),
        events: Number(row.events ?? 0),
      }))}
    />
  );
}
