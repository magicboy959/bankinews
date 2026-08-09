"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { NewsletterForm } from "@/components/ui/newsletter-form";

const STORAGE_KEY = "bankinews.newsletterPromptDismissedAt";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function NewsletterBottomSheet({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shouldShow = true;

    try {
      const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
      shouldShow = !dismissedAt || Date.now() - dismissedAt > WEEK_MS;
    } catch {
      shouldShow = true;
    }

    if (!shouldShow) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; closing the sheet for this session is enough.
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto max-h-[52vh] max-w-3xl overflow-auto rounded-t-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[0_-18px_60px_rgba(2,6,23,0.22)] sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              {locale === "ar" ? "لا إزعاج. لا حشو. فقط المهم." : "No noise. No filler. Only what matters."}
            </p>
            <h2 className="mt-1 text-xl font-black text-[var(--foreground)]">
              {locale === "ar" ? "اشترك مجانا" : "Subscribe free"}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
          >
            {locale === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>

        <NewsletterForm
          locale={locale}
          tone="surface"
          showName={false}
          buttonLabel={locale === "ar" ? "اشترك مجانا" : "Subscribe free"}
          emailPlaceholder={locale === "ar" ? "ادخل الايميل" : "Enter your email"}
          onSuccess={dismiss}
        />
      </div>
    </div>
  );
}
