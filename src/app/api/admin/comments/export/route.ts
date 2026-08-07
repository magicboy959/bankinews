import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { forbidden, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

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

const allowedStatuses = new Set(["all", "pending", "approved", "rejected", "spam"]);
const allowedRanges = new Set(["all", "today", "7d", "30d"]);

type SearchParams = {
  status?: string;
  range?: string;
  q?: string;
  ids?: string;
};

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildFilters(searchParams: URLSearchParams) {
  const rawIds = String(searchParams.get("ids") ?? "").trim();
  const rawStatus = String(searchParams.get("status") ?? "all");
  const rawRange = String(searchParams.get("range") ?? "all");
  const rawQuery = String(searchParams.get("q") ?? "").trim().slice(0, 120);

  const ids = rawIds
    ? Array.from(
        new Set(
          rawIds
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        )
      )
    : [];

  const status = allowedStatuses.has(rawStatus) ? rawStatus : "all";
  const range = allowedRanges.has(rawRange) ? rawRange : "all";
  const query = rawQuery;

  const whereParts: string[] = ["c.deleted_at IS NULL"];
  const whereParams: Array<string | number> = [];

  if (ids.length > 0) {
    whereParts.push(`c.id IN (${ids.map(() => "?").join(", ")})`);
    whereParams.push(...ids);
  } else {
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
      const like = `%${query}%`;
      whereParts.push("(c.name LIKE ? OR c.email LIKE ? OR c.comment LIKE ? OR a.slug LIKE ? OR at.title LIKE ?)");
      whereParams.push(like, like, like, like, like);
    }
  }

  return {
    ids,
    status,
    range,
    query,
    whereSql: whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "",
    whereParams,
  };
}

export async function GET(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const { ids, whereSql, whereParams, status, range, query } = buildFilters(searchParams);

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
       ORDER BY (c.approval_status = 'pending') DESC, c.created_at DESC`,
      whereParams
    );

    const header = [
      "id",
      "articleSlug",
      "articleTitle",
      "name",
      "email",
      "comment",
      "approvalStatus",
      "reportCount",
      "createdAt",
      "updatedAt",
    ];

    const csvLines = [
      ["# Filtered comments export"],
      ["# selected_ids", ids.length > 0 ? ids.join("|") : ""],
      ["# status", status],
      ["# range", range],
      ["# query", query],
      header,
      ...rows.map((row) => [
        row.id,
        row.articleSlug,
        row.articleTitle ?? "",
        row.name,
        row.email,
        row.comment,
        row.approvalStatus,
        row.reportCount,
        row.createdAt,
        row.updatedAt,
      ]),
    ].map((line) => line.map(escapeCsv).join(","));

    const csv = `\ufeff${csvLines.join("\n")}`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="comments-export.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return serverError("Unable to export comments");
  }
}
