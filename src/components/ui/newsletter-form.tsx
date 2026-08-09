"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";

type NewsletterFormProps = {
  locale: Locale;
  tone?: "footer" | "surface";
  showName?: boolean;
  buttonLabel?: string;
  emailPlaceholder?: string;
  onSuccess?: () => void;
};

export function NewsletterForm({
  locale,
  tone = "footer",
  showName = true,
  buttonLabel,
  emailPlaceholder,
  onSuccess,
}: NewsletterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const isFooter = tone === "footer";

  const inputClass = isFooter
    ? "w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
    : "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:border-[color:var(--accent)] focus:outline-none";
  const consentClass = isFooter ? "flex items-center gap-2 text-xs text-slate-300" : "flex items-center gap-2 text-xs text-[var(--text-muted)]";
  const successClass = isFooter ? "text-xs text-emerald-300" : "text-xs text-emerald-700 dark:text-emerald-300";
  const errorClass = isFooter ? "text-xs text-red-300" : "text-xs text-red-700 dark:text-red-300";

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
    onSuccess?.();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      {showName ? (
        <input
          type="text"
          placeholder={locale === "ar" ? "الاسم (اختياري)" : "Name (optional)"}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ) : null}
      <input
        type="email"
        placeholder={emailPlaceholder ?? (locale === "ar" ? "البريد الإلكتروني" : "Email address")}
        className={inputClass}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label className={consentClass}>
        <input type="checkbox" className="accent-cyan-500" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        {locale === "ar" ? "أوافق على سياسة الخصوصية" : "I agree to the privacy policy"}
      </label>
      <button type="submit" disabled={status === "loading"} className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60">
        {status === "loading" ? (locale === "ar" ? "جاري الإرسال..." : "Submitting...") : buttonLabel ?? (locale === "ar" ? "اشترك" : "Subscribe")}
      </button>
      {status === "success" && <p className={successClass}>{locale === "ar" ? "تم الإرسال. يرجى تأكيد الاشتراك من البريد." : "Submitted. Please confirm from your inbox."}</p>}
      {status === "error" && <p className={errorClass}>{locale === "ar" ? "تعذر الإرسال." : "Submission failed."}</p>}
    </form>
  );
}
