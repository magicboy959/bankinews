"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, preferredLanguage: locale, consent }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
    setName("");
    setConsent(false);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input
        type="text"
        placeholder={locale === "ar" ? "الاسم (اختياري)" : "Name (optional)"}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder={locale === "ar" ? "البريد الإلكتروني" : "Email address"}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        {locale === "ar" ? "أوافق على سياسة الخصوصية" : "I agree to the privacy policy"}
      </label>
      <button type="submit" disabled={status === "loading"} className="rounded-md bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {status === "loading" ? (locale === "ar" ? "جاري الإرسال..." : "Submitting...") : locale === "ar" ? "اشترك" : "Subscribe"}
      </button>
      {status === "success" && <p className="text-xs text-emerald-700">{locale === "ar" ? "تم الإرسال. يرجى تأكيد الاشتراك من البريد." : "Submitted. Please confirm from your inbox."}</p>}
      {status === "error" && <p className="text-xs text-red-700">{locale === "ar" ? "تعذر الإرسال." : "Submission failed."}</p>}
    </form>
  );
}
