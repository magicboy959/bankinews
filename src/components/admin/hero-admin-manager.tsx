"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HeroSectionItem = {
  id: number;
  sectionKey: string;
  enabled: number | boolean;
  sortOrder: number;
  configJson: unknown;
};

type MediaItem = {
  id: number;
  fileName: string;
  url: string;
  createdAt: string;
};

type RecentArticleItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  featuredImageUrl: string | null;
};

type HeroSlideDraft = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  href: string;
  eyebrow: string;
  ctaLabel: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

const heroSlidesPresetRows: HeroSlideDraft[] = [
  {
    id: "hero-1",
    title: "الخطة الاستراتيجية للقطاع المصرفي في السودان",
    summary: "واجهة رئيسية واضحة لصورة وخبر رئيسي يمكن تعديله من لوحة الإدارة.",
    imageUrl: "/hero-banking-1.svg",
    href: "/ar/news",
    eyebrow: "واجهة الأخبار",
    ctaLabel: "اقرأ المزيد",
  },
  {
    id: "hero-2",
    title: "تغطية مصرفية واقتصادية متجددة",
    summary: "استخدم هذه الشريحة لإبراز الأخبار أو التقارير المهمة على الصفحة الرئيسية.",
    imageUrl: "/hero-banking-2.svg",
    href: "/ar",
    eyebrow: "آخر الأخبار",
    ctaLabel: "تصفح الأخبار",
  },
  {
    id: "hero-3",
    title: "مساحة سهلة لتحديث الصور والروابط",
    summary: "يمكن تغيير الصورة والرابط والنص دون تعديل JSON يدويا.",
    imageUrl: "/hero-banking-3.svg",
    href: "/ar/about",
    eyebrow: "من لوحة الإدارة",
    ctaLabel: "اكتشف المزيد",
  },
];

function truthy(value: number | boolean | undefined): boolean {
  return value === true || value === 1;
}

function parseHeroRows(value: unknown): HeroSlideDraft[] {
  const normalized = typeof value === "string" ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  })() : value;

  if (!normalized || typeof normalized !== "object" || !Array.isArray((normalized as { slides?: unknown[] }).slides)) {
    return [];
  }

  return (normalized as { slides: Array<Partial<HeroSlideDraft>> }).slides
    .map((item, index) => ({
      id: item.id?.trim() || `hero-${index + 1}`,
      title: item.title?.trim() ?? "",
      summary: item.summary?.trim() ?? "",
      imageUrl: item.imageUrl?.trim() ?? "",
      href: item.href?.trim() ?? "",
      eyebrow: item.eyebrow?.trim() ?? "",
      ctaLabel: item.ctaLabel?.trim() ?? "",
    }))
    .filter((item) => item.title || item.summary || item.imageUrl || item.href);
}

function heroSlidesToPayload(rows: HeroSlideDraft[]) {
  return {
    slides: rows
      .filter((item) => item.title.trim() && item.summary.trim() && item.imageUrl.trim() && item.href.trim())
      .map((item, index) => ({
        id: item.id.trim() || `hero-${index + 1}`,
        title: item.title.trim(),
        summary: item.summary.trim(),
        imageUrl: item.imageUrl.trim(),
        href: item.href.trim(),
        eyebrow: item.eyebrow.trim() || undefined,
        ctaLabel: item.ctaLabel.trim() || undefined,
      })),
  };
}

async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
  return (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
}

export function HeroAdminManager({
  heroSection,
  recentMedia,
  recentArticles,
}: {
  heroSection: HeroSectionItem | null;
  recentMedia: MediaItem[];
  recentArticles: RecentArticleItem[];
}) {
  const router = useRouter();
  const initialSlides = useMemo(() => {
    const parsed = heroSection ? parseHeroRows(heroSection.configJson) : [];
    return parsed.length ? parsed : heroSlidesPresetRows;
  }, [heroSection]);

  const [slides, setSlides] = useState<HeroSlideDraft[]>(initialSlides);
  const [enabled, setEnabled] = useState(heroSection ? truthy(heroSection.enabled) : true);
  const [sortOrder, setSortOrder] = useState(String(heroSection?.sortOrder ?? 5));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const activeSlides = heroSlidesToPayload(slides).slides;
  const previewSlide = activeSlides[0] ?? null;

  function updateSlide(index: number, key: keyof HeroSlideDraft, value: string) {
    setSlides((prev) => prev.map((slide, slideIndex) => (slideIndex === index ? { ...slide, [key]: value } : slide)));
    setSaved(false);
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      {
        id: `hero-${prev.length + 1}`,
        title: "",
        summary: "",
        imageUrl: recentMedia[0]?.url ?? "",
        href: "/ar/news",
        eyebrow: "",
        ctaLabel: "اقرأ المزيد",
      },
    ]);
    setSaved(false);
  }

  function removeSlide(index: number) {
    setSlides((prev) => (prev.length <= 1 ? prev : prev.filter((_, slideIndex) => slideIndex !== index)));
    setSaved(false);
  }

  function applyArticleToSlide(index: number, articleId: string) {
    const article = recentArticles.find((item) => String(item.id) === articleId);
    if (!article) {
      return;
    }

    setSlides((prev) =>
      prev.map((slide, slideIndex) =>
        slideIndex === index
          ? {
              ...slide,
              title: article.title,
              summary: article.summary,
              imageUrl: article.featuredImageUrl || slide.imageUrl,
              href: `/ar/news/${article.slug}`,
              eyebrow: slide.eyebrow || "آخر الأخبار",
              ctaLabel: slide.ctaLabel || "اقرأ المزيد",
            }
          : slide
      )
    );
    setSaved(false);
  }

  function applyMediaToSlide(index: number, mediaId: string) {
    const media = recentMedia.find((item) => String(item.id) === mediaId);
    if (!media) {
      return;
    }

    updateSlide(index, "imageUrl", media.url);
  }

  async function saveHero() {
    setError(null);
    setSaved(false);

    if (!activeSlides.length) {
      setError("Add at least one complete slide with title, summary, image URL, and link.");
      return;
    }

    setSaving(true);

    const endpoint = heroSection ? `/api/homepage/sections/${heroSection.id}` : "/api/homepage/sections";
    const method = heroSection ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionKey: "hero_carousel",
        enabled,
        sortOrder: Number(sortOrder),
        configJson: { slides: activeSlides },
      }),
    });
    const result = await parseResponse<{ id: number }>(response);

    setSaving(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to save hero carousel" : result.error?.message ?? "Unable to save hero carousel");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Hero Carousel</h1>
          <p className="mt-2 text-[var(--text-muted)]">Update homepage hero images, headlines, links, and buttons from one focused screen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSlides(heroSlidesPresetRows);
              setSaved(false);
            }}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
          >
            Use Template
          </button>
          <button
            type="button"
            onClick={saveHero}
            disabled={saving}
            className="rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Hero"}
          </button>
        </div>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Hero carousel saved.</p> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                Hero carousel enabled
              </label>
              <input
                className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                placeholder="Sort order"
              />
            </div>
          </div>

          {slides.map((slide, index) => (
            <div key={`${slide.id}-${index}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Slide {index + 1}</h2>
                <button
                  type="button"
                  onClick={() => removeSlide(index)}
                  disabled={slides.length <= 1}
                  className="rounded border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Use article</span>
                  <select
                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
                    defaultValue=""
                    onChange={(event) => {
                      applyArticleToSlide(index, event.target.value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">Pick a recent article</option>
                    {recentArticles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Use media</span>
                  <select
                    className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
                    defaultValue=""
                    onChange={(event) => {
                      applyMediaToSlide(index, event.target.value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">Pick a recent image</option>
                    {recentMedia.map((media) => (
                      <option key={media.id} value={media.id}>
                        {media.fileName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Headline" value={slide.title} onChange={(event) => updateSlide(index, "title", event.target.value)} />
                <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Image URL" value={slide.imageUrl} onChange={(event) => updateSlide(index, "imageUrl", event.target.value)} />
                <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Link, for example /ar/news" value={slide.href} onChange={(event) => updateSlide(index, "href", event.target.value)} />
                <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Eyebrow" value={slide.eyebrow} onChange={(event) => updateSlide(index, "eyebrow", event.target.value)} />
                <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Button label" value={slide.ctaLabel} onChange={(event) => updateSlide(index, "ctaLabel", event.target.value)} />
                <textarea className="min-h-24 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] md:col-span-2" placeholder="Summary" value={slide.summary} onChange={(event) => updateSlide(index, "summary", event.target.value)} />
              </div>

              {recentMedia.length ? (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Pick recent image</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recentMedia.slice(0, 8).map((media) => (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => updateSlide(index, "imageUrl", media.url)}
                        className={`min-w-[96px] rounded border p-2 text-left text-xs ${slide.imageUrl === media.url ? "border-[var(--primary)] bg-[var(--surface-elevated)] text-[var(--foreground)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--primary)]"}`}
                      >
                        <img src={media.url} alt={media.fileName} className="mb-2 h-14 w-full rounded object-cover" />
                        <span className="line-clamp-1 font-semibold">{media.fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={addSlide}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
          >
            Add Slide
          </button>
        </div>

        <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-3">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--text-subtle)]">First slide preview</p>
          {previewSlide ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <img src={previewSlide.imageUrl} alt={previewSlide.title} className="h-44 w-full object-cover" />
              <div className="p-3">
                {previewSlide.eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">{previewSlide.eyebrow}</p> : null}
                <h2 className="mt-2 text-lg font-black leading-6 text-[var(--foreground)]">{previewSlide.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{previewSlide.summary}</p>
                <p className="mt-3 rounded bg-[#0A2342] px-3 py-2 text-center text-xs font-semibold text-white">{previewSlide.ctaLabel || "Read more"}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-subtle)]">Complete one slide to see the preview.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
