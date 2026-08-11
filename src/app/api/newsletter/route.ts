import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, serverError } from "@/lib/http";
import type { Locale } from "@/lib/i18n/config";
import { newsletterSchema } from "@/lib/validation/schemas";
import { sendSmtpEmail } from "@/lib/email/smtp";
import { getNewsletterWelcomeMessageWithUnsubscribe } from "@/lib/email/newsletter-welcome";

type SubscriberRow = {
  id: number;
  email: string;
  preferredLanguage: Locale;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid subscription payload", parsed.error.flatten());
    }

    const token = crypto.randomUUID();

    await dbExecute(
      `
      INSERT INTO newsletter_subscribers
      (name, email, preferred_language, consent_at, status, double_opt_in_token, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), 'pending', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      preferred_language = VALUES(preferred_language),
      consent_at = VALUES(consent_at),
      status = 'pending',
      double_opt_in_token = VALUES(double_opt_in_token),
      updated_at = NOW()
      `,
      [parsed.data.name ?? null, parsed.data.email, parsed.data.preferredLanguage, token]
    );

    const subscriberRows = await dbQuery<SubscriberRow[]>(
      `SELECT id, email, preferred_language AS preferredLanguage
       FROM newsletter_subscribers
       WHERE email = ?
       LIMIT 1`,
      [parsed.data.email]
    );

    const subscriber = subscriberRows[0];
    if (!subscriber) {
      return serverError("Unable to load subscription record");
    }

    const preferredLocale: Locale = parsed.data.preferredLanguage === "en" ? "en" : "ar";
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.bankinews.com").replace(/\/$/, "");
    const message = getNewsletterWelcomeMessageWithUnsubscribe(preferredLocale, siteUrl, subscriber);

    let confirmationEmailSent = false;
    let confirmationEmailReason: "sent" | "missing_smtp_config" | "failed" = "failed";

    try {
      const result = await sendSmtpEmail({
        to: parsed.data.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      confirmationEmailSent = result.sent;
      confirmationEmailReason = result.sent ? "sent" : "missing_smtp_config";
    } catch {
      confirmationEmailSent = false;
      confirmationEmailReason = "failed";
    }

    return created({
      status: "pending",
      tokenPreview: token.slice(0, 8),
      confirmationEmailSent,
      confirmationEmailReason,
    });
  } catch {
    return serverError("Unable to subscribe");
  }
}
