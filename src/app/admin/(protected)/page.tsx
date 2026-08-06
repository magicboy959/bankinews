import { redirect } from "next/navigation";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
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

export default async function AdminOverviewPage() {
  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [
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
  ] = await Promise.all([
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status = 'published' AND DATE(published_at) = CURDATE() AND deleted_at IS NULL`
    ),
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status IN ('draft', 'review') AND deleted_at IS NULL`
    ),
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM articles
       WHERE status = 'scheduled' AND deleted_at IS NULL`
    ),
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM jobs
       WHERE status <> 'archived' AND application_deadline < CURDATE() AND deleted_at IS NULL`
    ),
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM exchange_rates
       WHERE rate_date < DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND deleted_at IS NULL`
    ),
    dbQuery<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM contact_messages
       WHERE status IN ('new', 'in_review')`
    ),
    dbQuery<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_sponsored AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.deleted_at IS NULL
       ORDER BY a.updated_at DESC
       LIMIT 60`
    ),
    dbQuery<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_sponsored AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.status IN ('draft', 'review') AND a.deleted_at IS NULL
       ORDER BY a.updated_at DESC
       LIMIT 20`
    ),
    dbQuery<ArticleRow[]>(
      `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
              at.title,
              a.updated_at AS updatedAt,
              a.publish_at AS publishAt,
              a.is_breaking AS isBreaking,
              a.is_sponsored AS isFeatured
       FROM articles a
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       WHERE a.status = 'scheduled' AND a.deleted_at IS NULL
       ORDER BY a.publish_at ASC, a.updated_at DESC
       LIMIT 20`
    ),
    dbQuery<PopularRow[]>(
      `SELECT a.id,
              COALESCE(at.title, a.slug) AS title,
              COUNT(av.id) AS views
       FROM article_views av
       JOIN articles a ON a.id = av.article_id AND a.deleted_at IS NULL
       LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
       GROUP BY a.id, title
       ORDER BY views DESC
       LIMIT 10`
    ),
    dbQuery<JobAlertRow[]>(
      `SELECT j.id,
              COALESCE(jt.title, j.slug) AS title,
              j.application_deadline AS applicationDeadline
       FROM jobs j
       LEFT JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = 'ar'
       WHERE j.status <> 'archived' AND j.application_deadline < CURDATE() AND j.deleted_at IS NULL
       ORDER BY j.application_deadline ASC
       LIMIT 10`
    ),
    dbQuery<RateAlertRow[]>(
      `SELECT id, currency_code AS currencyCode, rate_date AS rateDate
       FROM exchange_rates
       WHERE rate_date < DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND deleted_at IS NULL
       ORDER BY rate_date ASC
       LIMIT 10`
    ),
    dbQuery<MessageAlertRow[]>(
      `SELECT id, subject, status, created_at AS createdAt
       FROM contact_messages
       WHERE status IN ('new', 'in_review')
       ORDER BY created_at ASC
       LIMIT 10`
    ),
    dbQuery<OptionRow[]>(
      `SELECT b.id, bt.name
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
       WHERE b.deleted_at IS NULL
       ORDER BY bt.name ASC`
    ),
    dbQuery<OptionRow[]>(
      `SELECT c.id, ct.title AS name
       FROM categories c
       JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'ar'
       WHERE c.deleted_at IS NULL
       ORDER BY ct.title ASC`
    ),
    dbQuery<SubscriberRow[]>(
      `SELECT id, name, email,
              preferred_language AS preferredLanguage,
              status,
              created_at AS createdAt
       FROM newsletter_subscribers
       ORDER BY created_at DESC
       LIMIT 120`
    ),
    dbQuery<MediaRow[]>(
      `SELECT id, file_name AS fileName, url, created_at AS createdAt
       FROM media
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 30`
    ),
  ]);

  return (
    <DashboardAdminManager
      summary={{
        publishedToday: Number(publishedToday[0]?.count ?? 0),
        draftsWaitingReview: Number(draftsWaitingReview[0]?.count ?? 0),
        scheduledPosts: Number(scheduledPosts[0]?.count ?? 0),
        expiredJobs: Number(expiredJobsCount[0]?.count ?? 0),
        ratesNeedingUpdates: Number(ratesNeedingUpdates[0]?.count ?? 0),
        messagesNeedResponse: Number(messagesNeedResponse[0]?.count ?? 0),
      }}
      articleRows={articleRows}
      draftRows={draftRows}
      scheduledRows={scheduledRows}
      popularRows={popularRows.map((row) => ({ ...row, views: Number(row.views) }))}
      expiredJobs={expiredJobs}
      staleRates={staleRates}
      pendingMessages={pendingMessages}
      bankOptions={bankOptions}
      categoryOptions={categoryOptions}
      initialSubscribers={subscribers}
      recentMedia={recentMedia}
    />
  );
}