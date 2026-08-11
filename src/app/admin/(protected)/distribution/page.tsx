import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { getDistributionChannelStatus } from "@/lib/social-distribution";
import { SocialPublisherManager } from "@/components/admin/social-publisher-manager";

type ArticleOption = DbRow & {
  id: number;
  slug: string;
  status: string;
  title: string;
  featuredImageUrl: string | null;
};

type DistributionRow = DbRow & {
  id: number;
  articleId: number;
  articleTitle: string;
  locale: "ar" | "en";
  textMode: "ai" | "custom";
  status: "pending" | "partial" | "published" | "failed";
  editorName: string | null;
  createdAt: string;
  completedAt: string | null;
};

type DistributionItemRow = DbRow & {
  distributionId: number;
  channel: "website" | "facebook" | "instagram" | "x" | "telegram" | "whatsapp_channel" | "linkedin";
  status: "pending" | "published" | "failed" | "manual_required" | "skipped";
  externalUrl: string | null;
  errorMessage: string | null;
};

export default async function DistributionPage() {
  const [articles, distributions, items] = await Promise.all([dbQuery<ArticleOption[]>(
    `SELECT a.id, a.slug, a.status, a.featured_image_url AS featuredImageUrl, at.title
     FROM articles a
     JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
     WHERE a.deleted_at IS NULL AND a.status IN ('draft','review','scheduled','published')
     ORDER BY a.updated_at DESC
     LIMIT 100`
  ), dbQuery<DistributionRow[]>(
    `SELECT d.id, d.article_id AS articleId, COALESCE(at.title, a.slug) AS articleTitle,
            d.locale, d.text_mode AS textMode, d.status, u.display_name AS editorName,
            d.created_at AS createdAt, d.completed_at AS completedAt
     FROM article_distributions d
     JOIN articles a ON a.id = d.article_id
     LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = d.locale
     LEFT JOIN users u ON u.id = d.created_by
     ORDER BY d.created_at DESC
     LIMIT 20`
  ), dbQuery<DistributionItemRow[]>(
    `SELECT i.distribution_id AS distributionId, i.channel, i.status,
            i.external_url AS externalUrl, i.error_message AS errorMessage
     FROM article_distribution_items i
     JOIN (SELECT id FROM article_distributions ORDER BY created_at DESC LIMIT 20) recent ON recent.id = i.distribution_id
     ORDER BY i.id ASC`
  )]);

  const history = distributions.map((distribution) => ({
    ...distribution,
    createdAt: String(distribution.createdAt),
    completedAt: distribution.completedAt ? String(distribution.completedAt) : null,
    items: items.filter((item) => Number(item.distributionId) === Number(distribution.id)),
  }));

  return <SocialPublisherManager articles={articles} channelStatus={getDistributionChannelStatus()} history={history} />;
}
