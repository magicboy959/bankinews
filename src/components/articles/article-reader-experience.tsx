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
  const startTimeRef = useRef<number>(Date.now());
  const sentMilestonesRef = useRef<Set<number>>(new Set());
  const sentDwellRef = useRef<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [density, setDensity] = useState<DensityMode>("default");
  const [fontBoost, setFontBoost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

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
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [slug]);

  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (progress >= milestone && !sentMilestonesRef.current.has(milestone)) {
        sentMilestonesRef.current.add(milestone);
        void sendEngagementEvent({
          articleId,
          eventName: `scroll_${milestone}`,
          progressPercent: milestone,
          secondsOnPage: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
          locale,
        });
      }
    }
  }, [articleId, locale, progress]);

  useEffect(() => {
    const dwellMilestones = [30, 90, 180];
    const intervalId = window.setInterval(() => {
      const secondsOnPage = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
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
    const target = shareUrl || `${window.location.origin}/${locale}/news/${slug}`;
    await navigator.clipboard.writeText(target);
    void sendEngagementEvent({ articleId, eventName: "copy_link", progressPercent: Math.round(progress), locale });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function nativeShare() {
    const target = shareUrl || `${window.location.origin}/${locale}/news/${slug}`;
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

  const currentUrl = shareUrl || `/${locale}/news/${slug}`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const readingMinutesLeft = useMemo(() => {
    const remaining = readingTimeMinutes * (1 - progress / 100);
    return Math.max(1, Math.ceil(remaining));
  }, [progress, readingTimeMinutes]);

  return (
    <div>
      <div className="article-progress-bar" style={{ width: `${progress}%` }} aria-hidden="true" />

      <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-600">
            {locale === "ar"
              ? `التقدم ${Math.round(progress)}% • متبق تقريبا ${readingMinutesLeft} دقيقة`
              : `${Math.round(progress)}% read • about ${readingMinutesLeft} min left`}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDensity((prev) => (prev === "default" ? "comfortable" : "default"))}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void sendEngagementEvent({ articleId, eventName: "share_facebook", progressPercent: Math.round(progress), locale });
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void sendEngagementEvent({ articleId, eventName: "share_x", progressPercent: Math.round(progress), locale });
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void sendEngagementEvent({ articleId, eventName: "share_linkedin", progressPercent: Math.round(progress), locale });
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            LinkedIn
          </a>
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void sendEngagementEvent({ articleId, eventName: "share_whatsapp", progressPercent: Math.round(progress), locale });
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={nativeShare}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            {locale === "ar" ? "مشاركة" : "Share"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
          >
            {copied ? (locale === "ar" ? "تم النسخ" : "Copied") : locale === "ar" ? "نسخ الرابط" : "Copy link"}
          </button>
        </div>
      </section>

      <div
        className={`article-reader-surface ${density === "comfortable" ? "article-reader-comfort" : ""} ${fontBoost ? "article-reader-large" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}