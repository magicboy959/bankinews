import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { distributionChannels, formatFacebookPost, formatTelegramPost, type DistributionChannel, type SocialPost } from "@/lib/social-distribution";

type ArticleRow = DbRow & { title: string; summary: string; slug: string };

const previewSchema = z.object({
  articleId: z.number().int().positive(),
  locale: z.enum(["ar", "en"]).default("ar"),
  channels: z.array(z.enum(distributionChannels)).min(1),
  textMode: z.enum(["ai", "custom"]),
  customText: z.string().max(5000).optional(),
});

function cleanJson(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function withArticleUrl(text: string, url: string, channel: DistributionChannel) {
  if (channel === "telegram") return formatTelegramPost(text, url, 1024);
  if (channel === "facebook") return formatFacebookPost(text, url);
  const joined = text.includes(url) ? text : `${text.trim()}\n\n${url}`;
  return channel === "x" ? joined.slice(0, 280) : joined;
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) return forbidden();

  try {
    const parsed = previewSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Invalid distribution preview", parsed.error.flatten());

    const rows = await dbQuery<ArticleRow[]>(
      `SELECT a.slug, at.title, at.summary
       FROM articles a
       JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
       WHERE a.id = ? AND a.deleted_at IS NULL
       LIMIT 1`,
      [parsed.data.locale, parsed.data.articleId]
    );
    const article = rows[0];
    if (!article) return badRequest("Article or translation not found.");

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.bankinews.com").replace(/\/$/, "");
    const articleUrl = `${baseUrl}/${parsed.data.locale}/news/${article.slug}`;

    if (parsed.data.textMode === "custom") {
      const customText = parsed.data.customText?.trim();
      if (!customText) return badRequest("Custom social text is required.");
      return ok({
        articleUrl,
        posts: parsed.data.channels.map((channel) => ({ channel, text: withArticleUrl(customText, articleUrl, channel) })),
      });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "replace_me") return badRequest("Banki AI is not configured.");
    const model = (process.env.GOOGLE_AI_TEXT_MODEL || "gemini-3.6-flash").replace(/^models\//, "");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You write accurate social posts for Banki News. Never add facts not present in the supplied title and summary. Return JSON only: an object whose keys are the requested channel names and values are platform-appropriate post text. Keep X text short enough to leave room for a URL. Do not label ordinary news as breaking or sponsored." }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify({ locale: parsed.data.locale, channels: parsed.data.channels, title: article.title, summary: article.summary }) }] }],
        generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!response.ok) return serverError(json.error?.message || "Banki AI social generation failed.");
    const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    let generated: Record<string, unknown>;
    try {
      generated = JSON.parse(cleanJson(content)) as Record<string, unknown>;
    } catch {
      return serverError("Banki AI returned invalid social text.");
    }

    const posts: SocialPost[] = parsed.data.channels.map((channel) => ({
      channel,
      text: withArticleUrl(typeof generated[channel] === "string" ? generated[channel] : `${article.title}\n${article.summary}`, articleUrl, channel),
    }));
    return ok({ articleUrl, posts });
  } catch {
    return serverError("Unable to preview social posts.");
  }
}
