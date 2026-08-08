import { redirect } from "next/navigation";
import { dbQuery, dbExecute } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { verifyNewsletterUnsubscribeToken } from "@/lib/newsletter-unsubscribe";

type SubscriberRow = DbRow & {
  id: number;
  email: string;
  preferredLanguage: "ar" | "en";
  status: "pending" | "active" | "unsubscribed";
  name: string | null;
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id, token } = await searchParams;
  const subscriberId = Number(id);

  let ok = false;
  let message = "";

  if (Number.isInteger(subscriberId) && subscriberId > 0 && token) {
    const rows = await dbQuery<SubscriberRow[]>(
      `SELECT id, email, preferred_language AS preferredLanguage, status, name
       FROM newsletter_subscribers
       WHERE id = ?
       LIMIT 1`,
      [subscriberId]
    );

    const subscriber = rows[0];
    if (subscriber && verifyNewsletterUnsubscribeToken(subscriber.id, subscriber.email, token)) {
      await dbExecute(
        `UPDATE newsletter_subscribers
         SET status = 'unsubscribed', unsubscribed_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [subscriber.id]
      );
      ok = true;
    }
  }

  if (ok) {
    message = "You have been unsubscribed successfully.";
  } else {
    message = "We could not verify this unsubscribe request.";
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-black text-[#0A2342]">Newsletter Unsubscribe</h1>
      <p className="mt-4 text-slate-700">{message}</p>
      <p className="mt-6 text-sm text-slate-500">
        {ok ? "You will no longer receive campaign emails from Banki News." : "If you need help, contact our editorial team from the website."}
      </p>
      <div className="mt-8">
        <a href="/ar" className="rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white">Return to site</a>
      </div>
    </div>
  );
}
