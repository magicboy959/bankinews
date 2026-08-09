"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Props = {
  articleId: number;
  locale: "ar" | "en";
  slug: string;
  title: string;
  readingTimeMinutes: number;
  children: ReactNode;
};

type DensityMode = "default" | "comfortable";

export function ArticleReaderExperience({ articleId, locale, slug, title, readingTimeMinutes, children }: Props) {
  const startTimeRef = useRef<number | null>(null);
  const sentMilestonesRef = useRef<Set<number>>(new Set());
  const sentDwellRef = useRef<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [density, setDensity] = useState<DensityMode>("default");
  const [fontBoost, setFontBoost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);

  function getStartTime() {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    return startTimeRef.current;
  }

  function getShareUrl() {
    if (typeof window !== "undefined") {
      return window.location.href;
    }

    return `/${locale}/news/${slug}`;
  }

  async function sendEngagementEvent(payload: {
    articleId: number;
    eventName: string;
    progressPercent?: number;
    secondsOnPage?: number;
    locale: "ar" | "en";
  }) {
    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/engagement", blob);
      return;
    }

    await fetch("/api/analytics/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (progress >= milestone && !sentMilestonesRef.current.has(milestone)) {
        sentMilestonesRef.current.add(milestone);
        void sendEngagementEvent({
          articleId,
          eventName: `scroll_${milestone}`,
          progressPercent: milestone,
          secondsOnPage: Math.max(1, Math.round((Date.now() - getStartTime()) / 1000)),
          locale,
        });
      }
    }
  }, [articleId, locale, progress]);

  useEffect(() => {
    const dwellMilestones = [30, 90, 180];
    const intervalId = window.setInterval(() => {
      const secondsOnPage = Math.max(1, Math.round((Date.now() - getStartTime()) / 1000));
      for (const point of dwellMilestones) {
        if (secondsOnPage >= point && !sentDwellRef.current.has(point)) {
          sentDwellRef.current.add(point);
          void sendEngagementEvent({
            articleId,
            eventName: `dwell_${point}`,
            progressPercent: Math.round(progress),
            secondsOnPage,
            locale,
          });
        }
      }
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [articleId, locale, progress]);

  useEffect(() => {
    function updateProgress() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }

      const next = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      setProgress(next);
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  async function copyLink() {
    const target = getShareUrl();
    await navigator.clipboard.writeText(target);
    void sendEngagementEvent({ articleId, eventName: "copy_link", progressPercent: Math.round(progress), locale });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function nativeShare() {
    const target = getShareUrl();
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, url: target });
      void sendEngagementEvent({ articleId, eventName: "share_native", progressPercent: Math.round(progress), locale });
    } catch {
      // Ignore user cancellation.
    }
  }

  const currentUrl = `/${locale}/news/${slug}`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareButtons = [
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "border-[#1877F2] bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
      eventName: "share_facebook",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M13.5 22v-8.5h2.9l.4-3.2h-3.3V3.8c0-.9.3-1.6 1.6-1.6h1.7V.1c-.3 0-1.3-.1-2.4-.1-2.5 0-4.2 1.5-4.2 4.4v2.5H7v3.2h2.8V22h3.7Z" />
        </svg>
      ),
    },
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "border-slate-800 bg-slate-900/10 text-slate-800 hover:bg-slate-900 hover:text-white",
      eventName: "share_x",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.7L23.3 22h-5.9l-4.7-6.1L7.3 22H4.2l7.2-8.2L.7 2h6.1l4.2 5.6L18.9 2Zm-1 18h1.2L6.2 4H4.9l13 16Z" />
        </svg>
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: "border-[#0A66C2] bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white",
      eventName: "share_linkedin",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.5h2.88V18H5.5V9.5Zm4.6 0h2.76v1.16h.04c.39-.74 1.33-1.52 2.74-1.52 2.93 0 3.47 1.93 3.47 4.43V18H16.3v-7.7c0-1.83-.03-4.19-2.55-4.19-2.56 0-2.95 2-2.95 4.07V18H10.1V9.5Z" />
        </svg>
      ),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: "border-[#25D366] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white",
      eventName: "share_whatsapp",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M19.1 4.9A9.2 9.2 0 0 0 4.9 19.1L3 21l1.9-1.9a9.2 9.2 0 1 0 14.2-14.2ZM12 19.4c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-1.1.3 0-1.1-.2-.3a7.6 7.6 0 1 1 5.8 2.4Zm4.1-5.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.1-.5.7-.6.8-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.5-.9-.6-.5-1-1.1-1.1-1.3-.1-.2 0-.3.1-.4l.3-.3c.1-.1.2-.2.3-.3.1-.1.1-.2.2-.3.1-.1 0-.2 0-.3-.1-.1-.5-1.2-.7-1.6-.1-.4-.2-.3-.4-.3h-.4c-.2 0-.4.1-.5.2-.2.2-.7.7-.7 1.7 0 1 .8 2 .9 2.1.1.2 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.6.4 0 1.3-.5 1.5-1 .2-.5.2-.9.1-1l-.3-.2Z" />
        </svg>
      ),
    },
  ];

  const readingMinutesLeft = useMemo(() => {
    const remaining = readingTimeMinutes * (1 - progress / 100);
    return Math.max(1, Math.ceil(remaining));
  }, [progress, readingTimeMinutes]);

  return (
    <div>
      <div className="article-progress-bar" style={{ width: `${progress}%` }} aria-hidden="true" />

      <section className="article-reader-toolbar mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="article-reader-status text-xs font-semibold text-slate-600 dark:text-slate-300">
            {locale === "ar"
              ? `التقدم ${Math.round(progress)}% • متبق تقريبا ${readingMinutesLeft} دقيقة`
              : `${Math.round(progress)}% read • about ${readingMinutesLeft} min left`}
          </div>

          <div className="article-reader-actions flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDensity((prev) => (prev === "default" ? "comfortable" : "default"))}
              className="article-reader-action rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {density === "default"
                ? locale === "ar"
                  ? "قراءة مريحة"
                  : "Comfortable reading"
                : locale === "ar"
                  ? "قراءة افتراضية"
                  : "Default reading"}
            </button>
            <button
              type="button"
              onClick={() => setFontBoost((prev) => !prev)}
              className="article-reader-action rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {fontBoost
                ? locale === "ar"
                  ? "حجم خط عادي"
                  : "Normal text"
                : locale === "ar"
                  ? "تكبير الخط"
                  : "Larger text"}
            </button>
          </div>
        </div>

      </section>

      <div
        className={`article-reader-surface ${density === "comfortable" ? "article-reader-comfort" : ""} ${fontBoost ? "article-reader-large" : ""}`}
      >
        {children}
      </div>

      <div className="article-share-area mt-8 flex justify-end">
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={() => setSharePanelOpen((prev) => !prev)}
            className="article-share-toggle inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            aria-expanded={sharePanelOpen}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14V4ZM5 5h7v2H7v10h10v-5h2v7H5V5Z" />
            </svg>
            <span>{copied ? (locale === "ar" ? "تم النسخ" : "Copied") : locale === "ar" ? "مشاركة" : "Share"}</span>
          </button>

          {sharePanelOpen ? (
            <div className="article-share-panel mt-3 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-2 py-2 shadow-sm backdrop-blur">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "مشاركة" : "Share"}
              </span>

              <div className="article-share-buttons flex flex-wrap items-center gap-2">
                {shareButtons.map((button) => (
                  <a
                    key={button.key}
                    href={button.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      void sendEngagementEvent({ articleId, eventName: button.eventName, progressPercent: Math.round(progress), locale });
                    }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[var(--surface)]/90 text-base shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${button.className}`}
                    aria-label={button.label}
                  >
                    {button.icon}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={nativeShare}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--surface)]/90 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label={locale === "ar" ? "مشاركة" : "Share"}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14V4ZM5 5h7v2H7v10h10v-5h2v7H5V5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--surface)]/90 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label={locale === "ar" ? "نسخ الرابط" : "Copy link"}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M10 7H7a3 3 0 0 0 0 6h3a3 3 0 0 0 3-3 1 1 0 1 0-2 0 1 1 0 0 1-1 1H7a1 1 0 0 1 0-2h3a1 1 0 1 0 0-2Zm7-3h-3a3 3 0 0 0-3 3 1 1 0 1 0 2 0 1 1 0 0 1 1-1h3a1 1 0 0 1 0 2h-3a1 1 0 1 0 0 2h3a3 3 0 0 0 0-6Zm-7 10h3a3 3 0 0 0 0-6h-3a3 3 0 0 0 0 6Zm0-2a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2H10Z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
