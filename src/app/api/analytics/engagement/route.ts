import { dbExecute } from "@/lib/db/query";
import { badRequest, created, serverError } from "@/lib/http";

const allowedEventNames = new Set([
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "dwell_30",
  "dwell_90",
  "dwell_180",
  "share_facebook",
  "share_x",
  "share_linkedin",
  "share_whatsapp",
  "share_native",
  "copy_link",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articleId = Number(body?.articleId);
    const eventName = String(body?.eventName ?? "").trim();
    const progressPercent = body?.progressPercent == null ? null : Number(body.progressPercent);
    const secondsOnPage = body?.secondsOnPage == null ? null : Number(body.secondsOnPage);
    const localeRaw = String(body?.locale ?? "").trim().toLowerCase();
    const locale = localeRaw === "ar" || localeRaw === "en" ? localeRaw : null;

    if (!Number.isInteger(articleId) || articleId < 1) {
      return badRequest("Invalid articleId");
    }

    if (!allowedEventNames.has(eventName)) {
      return badRequest("Invalid eventName");
    }

    if (progressPercent != null && (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100)) {
      return badRequest("Invalid progressPercent");
    }

    if (secondsOnPage != null && (!Number.isInteger(secondsOnPage) || secondsOnPage < 0 || secondsOnPage > 60 * 60 * 6)) {
      return badRequest("Invalid secondsOnPage");
    }

    await dbExecute(
      `INSERT INTO article_engagement_events
       (article_id, event_name, progress_percent, seconds_on_page, locale, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [articleId, eventName, progressPercent, secondsOnPage, locale]
    );

    return created({ tracked: true });
  } catch {
    return serverError("Unable to track engagement event");
  }
}