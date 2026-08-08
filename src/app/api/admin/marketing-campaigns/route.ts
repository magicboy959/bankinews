import type { DbRow } from "@/lib/db/pool";
import { dbInsert, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { sendStoredMarketingCampaign } from "@/lib/marketing-campaigns";

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

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<CampaignRow[]>(
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
    );

    return ok(rows);
  } catch {
    return serverError("Unable to fetch marketing campaigns");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      subject?: unknown;
      htmlContent?: unknown;
      textContent?: unknown;
      scheduleAt?: unknown;
      sendNow?: unknown;
    };

    const subject = String(body.subject ?? "").trim();
    const htmlContent = String(body.htmlContent ?? "").trim();
    const textContent = String(body.textContent ?? "").trim();
    const scheduleAt = typeof body.scheduleAt === "string" ? body.scheduleAt.trim() : "";
    const sendNow = body.sendNow === true || body.sendNow === "true";

    if (subject.length < 3) {
      return badRequest("Subject is required");
    }

    if (htmlContent.length < 10) {
      return badRequest("HTML content is required");
    }

    const parsedScheduleAt = scheduleAt ? new Date(scheduleAt) : null;
    const hasScheduleAt = !!parsedScheduleAt && !Number.isNaN(parsedScheduleAt.getTime());

    if (scheduleAt && !hasScheduleAt) {
      return badRequest("scheduleAt must be a valid date and time");
    }

    const initialStatus = sendNow ? "draft" : hasScheduleAt ? "scheduled" : "draft";
    const scheduledAtValue = sendNow ? null : hasScheduleAt ? parsedScheduleAt!.toISOString().slice(0, 19).replace("T", " ") : null;

    const campaignId = await dbInsert(
      `INSERT INTO marketing_campaigns
       (subject, html_content, text_content, audience_filter, scheduled_at, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, ?, NOW(), NOW())`,
      [
        subject,
        htmlContent,
        textContent || null,
        JSON.stringify({ audience: "active_subscribers" }),
        scheduledAtValue,
        initialStatus,
        user.id,
      ]
    );

    if (!sendNow) {
      return created({ id: campaignId, status: initialStatus });
    }

    const sendResult = await sendStoredMarketingCampaign(campaignId);
    if (!sendResult.ok) {
      return sendResult.error;
    }

    return created(sendResult.data);
  } catch {
    return serverError("Unable to create campaign");
  }
}
