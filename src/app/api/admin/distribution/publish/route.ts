import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { dbExecute, dbInsert, dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { distributionChannels, publishToChannel, type DistributionArticle } from "@/lib/social-distribution";

type ArticleRow = DbRow & {
  slug: string;
  title: string;
  summary: string;
  featuredImageUrl: string | null;
  status: string;
  sourceUrl: string | null;
  sourceVerificationStatus: string;
  sourceLastVerifiedAt: string | null;
};

const publishSchema = z.object({
  articleId: z.number().int().positive(),
  locale: z.enum(["ar", "en"]).default("ar"),
  textMode: z.enum(["ai", "custom"]),
  customText: z.string().max(5000).optional().nullable(),
  posts: z.array(z.object({ channel: z.enum(distributionChannels), text: z.string().min(1).max(10000) })).min(1),
});

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) return forbidden();

  try {
    const parsed = publishSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Invalid publishing request", parsed.error.flatten());
    const rows = await dbQuery<ArticleRow[]>(
      `SELECT a.slug, a.status, a.featured_image_url AS featuredImageUrl,
              a.source_url AS sourceUrl, a.source_verification_status AS sourceVerificationStatus,
              a.source_last_verified_at AS sourceLastVerifiedAt, at.title, at.summary
       FROM articles a
       JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
       WHERE a.id = ? AND a.deleted_at IS NULL
       LIMIT 1`,
      [parsed.data.locale, parsed.data.articleId]
    );
    const row = rows[0];
    if (!row) return badRequest("Article or translation not found.");

    const wantsWebsite = parsed.data.posts.some((post) => post.channel === "website");
    if (wantsWebsite && (!row.featuredImageUrl || !row.sourceUrl || row.sourceVerificationStatus === "unverified" || !row.sourceLastVerifiedAt)) {
      return badRequest("Website publishing requires an image, source URL, completed source verification, and verification date.");
    }

    const distributionId = await dbInsert(
      `INSERT INTO article_distributions (article_id, locale, text_mode, custom_text, status, created_by, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
      [parsed.data.articleId, parsed.data.locale, parsed.data.textMode, parsed.data.customText ?? null, user.id]
    );

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const makeAbsolute = (value: string | null) => value ? new URL(value, `${baseUrl}/`).toString() : null;
    const article: DistributionArticle = {
      title: row.title,
      summary: row.summary,
      url: `${baseUrl}/${parsed.data.locale}/news/${row.slug}`,
      imageUrl: makeAbsolute(row.featuredImageUrl),
    };

    const results = [];
    for (const post of parsed.data.posts) {
      let result;
      if (post.channel === "website") {
        await dbExecute(`UPDATE articles SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = ?`, [parsed.data.articleId]);
        result = { channel: "website" as const, status: "published" as const, externalUrl: article.url };
      } else {
        result = await publishToChannel(post.channel, article, post.text);
      }
      results.push(result);
      await dbExecute(
        `INSERT INTO article_distribution_items
         (distribution_id, channel, social_text, status, external_id, external_url, error_message, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL), NOW(), NOW())`,
        [distributionId, post.channel, post.text, result.status, result.externalId ?? null, result.externalUrl ?? null, result.error ?? null, result.status]
      );
    }

    const publishedCount = results.filter((result) => result.status === "published").length;
    const failedCount = results.filter((result) => result.status === "failed").length;
    const finalStatus = failedCount === 0 ? "published" : publishedCount > 0 ? "partial" : "failed";
    await dbExecute(`UPDATE article_distributions SET status = ?, completed_at = NOW() WHERE id = ?`, [finalStatus, distributionId]);

    return ok({ distributionId, status: finalStatus, results });
  } catch {
    return serverError("Unable to publish distribution.");
  }
}
