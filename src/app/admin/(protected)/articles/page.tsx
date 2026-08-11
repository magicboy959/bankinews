import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { ArticleAdminManager } from "@/components/admin/article-admin-manager";

type ArticleRow = DbRow & {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  title: string | null;
  publishedAt: string | null;
  updatedAt: string;
  sourceVerificationStatus: "unverified" | "editorial_review" | "official";
  sourceLastVerifiedAt: string | null;
};

export default async function AdminArticlesPage() {
  const rows = await dbQuery<ArticleRow[]>(
    `SELECT a.id, a.slug, a.status, a.article_type AS articleType,
            at.title, a.published_at AS publishedAt, a.updated_at AS updatedAt,
            a.source_verification_status AS sourceVerificationStatus,
            a.source_last_verified_at AS sourceLastVerifiedAt
     FROM articles a
     LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
     WHERE a.deleted_at IS NULL
     ORDER BY a.updated_at DESC
     LIMIT 50`
  );

  return <ArticleAdminManager initialRows={rows} />;
}
