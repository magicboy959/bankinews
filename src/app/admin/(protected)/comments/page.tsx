import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { CommentAdminManager } from "@/components/admin/comment-admin-manager";

type CommentRow = DbRow & {
  id: number;
  articleId: number;
  articleSlug: string;
  articleTitle: string | null;
  name: string;
  email: string;
  comment: string;
  approvalStatus: "pending" | "approved" | "rejected" | "spam";
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};

type CountRow = DbRow & {
  count: number;
};

const DEFAULT_PAGE_SIZE = 50;
const allowedPageSizes = new Set([25, 50, 100]);
const allowedStatuses = new Set(["all", "pending", "approved", "rejected", "spam"]);
const allowedRanges = new Set(["all", "today", "7d", "30d"]);

type SearchParams = {
  status?: string;
  range?: string;
  q?: string;
  page?: string;
  size?: string;
};

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;

  const status = allowedStatuses.has(String(resolved.status ?? "all"))
    ? String(resolved.status ?? "all")
    : "all";
  const range = allowedRanges.has(String(resolved.range ?? "all"))
    ? String(resolved.range ?? "all")
    : "all";
  const query = String(resolved.q ?? "").trim().slice(0, 120);
  const pageSize = allowedPageSizes.has(Number.parseInt(String(resolved.size ?? String(DEFAULT_PAGE_SIZE)), 10))
    ? Number.parseInt(String(resolved.size ?? String(DEFAULT_PAGE_SIZE)), 10)
    : DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(1, Number.parseInt(String(resolved.page ?? "1"), 10) || 1);

  const whereParts: string[] = ["c.deleted_at IS NULL"];
  const whereParams: Array<string | number> = [];

  if (status !== "all") {
    whereParts.push("c.approval_status = ?");
    whereParams.push(status);
  }

  if (range === "today") {
    whereParts.push("c.created_at >= CURDATE()");
  } else if (range === "7d") {
    whereParts.push("c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
  } else if (range === "30d") {
    whereParts.push("c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
  }

  if (query) {
    whereParts.push("(c.name LIKE ? OR c.email LIKE ? OR c.comment LIKE ? OR a.slug LIKE ? OR at.title LIKE ?)");
    const like = `%${query}%`;
    whereParams.push(like, like, like, like, like);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  const countRows = await dbQuery<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM comments c
     INNER JOIN articles a ON a.id = c.article_id
     LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
     ${whereSql}`,
    whereParams
  );

  const totalCount = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await dbQuery<CommentRow[]>(
    `SELECT c.id,
            c.article_id AS articleId,
            a.slug AS articleSlug,
            at.title AS articleTitle,
            c.name,
            c.email,
            c.comment,
            c.approval_status AS approvalStatus,
            c.report_count AS reportCount,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt
     FROM comments c
     INNER JOIN articles a ON a.id = c.article_id
     LEFT JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
     ${whereSql}
     ORDER BY (c.approval_status = 'pending') DESC, c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, pageSize, offset]
  );

  return (
    <CommentAdminManager
      initialRows={rows}
      initialStatusFilter={status as "all" | "pending" | "approved" | "rejected" | "spam"}
      initialDateRange={range as "all" | "today" | "7d" | "30d"}
      initialQuery={query}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
    />
  );
}
