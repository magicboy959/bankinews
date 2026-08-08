import { createHmac } from "node:crypto";
import type { Locale } from "@/lib/i18n/config";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://bankinews.com").replace(/\/$/, "");
}

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for newsletter unsubscribe links");
  }
  return secret;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildNewsletterUnsubscribeToken(subscriberId: number, email: string) {
  const payload = `${subscriberId}:${normalizeEmail(email)}`;
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifyNewsletterUnsubscribeToken(subscriberId: number, email: string, token: string) {
  if (!token) {
    return false;
  }

  const expected = buildNewsletterUnsubscribeToken(subscriberId, email);
  return expected.length === token.length && createHmac("sha256", getSecret()).update(`${subscriberId}:${normalizeEmail(email)}`).digest("hex") === token;
}

export function buildNewsletterUnsubscribeUrl(subscriberId: number, email: string) {
  const token = buildNewsletterUnsubscribeToken(subscriberId, email);
  return `${getBaseUrl()}/unsubscribe?id=${subscriberId}&token=${token}`;
}

export function appendUnsubscribeFooter(
  html: string,
  text: string,
  subscriber: { id: number; email: string; preferredLanguage: Locale }
) {
  const unsubscribeUrl = buildNewsletterUnsubscribeUrl(subscriber.id, subscriber.email);

  const htmlFooter = subscriber.preferredLanguage === "ar"
    ? `<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />
       <p style="font-size:12px;line-height:1.8;color:#64748b;">
         إذا لم ترغب في الاستمرار في تلقي هذه الرسائل يمكنك إلغاء الاشتراك من هنا:
         <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">إلغاء الاشتراك</a>
       </p>`
    : `<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />
       <p style="font-size:12px;line-height:1.8;color:#64748b;">
         If you no longer want these emails, you can unsubscribe here:
         <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">Unsubscribe</a>
       </p>`;

  const textFooter = subscriber.preferredLanguage === "ar"
    ? `\n\n---\nإلغاء الاشتراك: ${unsubscribeUrl}`
    : `\n\n---\nUnsubscribe: ${unsubscribeUrl}`;

  return {
    html: `${html}${htmlFooter}`,
    text: `${text}${textFooter}`,
    unsubscribeUrl,
  };
}
