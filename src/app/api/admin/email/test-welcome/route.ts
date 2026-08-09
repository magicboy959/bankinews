import { forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { sendSmtpEmail } from "@/lib/email/smtp";
import { getNewsletterWelcomeMessage } from "@/lib/email/newsletter-welcome";
import type { Locale } from "@/lib/i18n/config";

type TestWelcomeRequest = {
  locale?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLocale(value: unknown): Locale {
  return cleanText(value) === "en" ? "en" : "ar";
}

export async function POST(request: Request) {
  const user = await requireRole("administrator");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as TestWelcomeRequest;
    const locale = normalizeLocale(body.locale);
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://bankinews.com").replace(/\/$/, "");
    const message = getNewsletterWelcomeMessage(locale, siteUrl);

    const result = await sendSmtpEmail({
      to: user.email,
      subject: `[Test] ${message.subject}`,
      html: message.html,
      text: message.text,
    });

    if (!result.sent) {
      return serverError("SMTP is not configured. Set EMAIL_OUTGOING_HOST, EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_FROM.");
    }

    return ok({ sent: true, to: user.email, locale });
  } catch {
    return serverError("Unable to send welcome email test");
  }
}
