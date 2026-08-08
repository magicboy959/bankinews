"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";

export function ContactForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
      consent: form.get("consent") === "on",
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <input name="fullName" required placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" />
      <input name="email" type="email" required placeholder={locale === "ar" ? "البريد الإلكتروني" : "Email"} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" />
      <input name="phone" placeholder={locale === "ar" ? "الهاتف (اختياري)" : "Phone (optional)"} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" />
      <input name="subject" required placeholder={locale === "ar" ? "الموضوع" : "Subject"} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" />
      <textarea name="message" required placeholder={locale === "ar" ? "الرسالة" : "Message"} className="md:col-span-2 min-h-40 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" />
      <label className="md:col-span-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <input type="checkbox" name="consent" required />
        {locale === "ar" ? "أوافق على معالجة البيانات" : "I consent to data processing"}
      </label>
      <button className="md:col-span-2 w-fit rounded-md bg-[#0A2342] px-4 py-2 font-semibold text-white" type="submit" disabled={status === "loading"}>
        {status === "loading" ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") : locale === "ar" ? "إرسال" : "Send"}
      </button>
      {status === "success" && <p className="md:col-span-2 text-sm text-emerald-700">{locale === "ar" ? "تم إرسال رسالتك." : "Your message has been sent."}</p>}
      {status === "error" && <p className="md:col-span-2 text-sm text-red-700">{locale === "ar" ? "تعذر إرسال الرسالة." : "Failed to send message."}</p>}
    </form>
  );
}
