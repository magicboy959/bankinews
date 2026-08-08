"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor, hasRichTextContent } from "./rich-text-editor";
import { getYouTubeEmbedUrl, looksLikeImageUrl } from "@/lib/media";
import { slugify } from "@/lib/utils";

type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "archived";
type Locale = "ar" | "en";

type ArticleListItem = {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  title: string | null;
  updatedAt: string;
  publishAt: string | null;
  isBreaking: number | boolean;
  isFeatured: number | boolean;
};

type ArticleDetailItem = {
  id: number;
  slug: string;
  status: ArticleStatus;
  articleType: string;
  featuredImageUrl: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  relatedBankId: number | null;
  categoryId: number | null;
  publishAt: string | null;
  expiresAt: string | null;
  isBreaking: number | boolean;
  isSponsored: number | boolean;
  isOpinion: number | boolean;
  isPressRelease: number | boolean;
  locale: string | null;
  title: string | null;
  summary: string | null;
  contentHtml: string | null;
};

type DraftLocaleContent = {
  title: string;
  summary: string;
  contentHtml: string;
};

type DashboardSummary = {
  publishedToday: number;
  draftsWaitingReview: number;
  scheduledPosts: number;
  expiredJobs: number;
  ratesNeedingUpdates: number;
  messagesNeedResponse: number;
};

type PopularArticle = {
  id: number;
  title: string;
  views: number;
};

type JobAlert = {
  id: number;
  title: string;
  applicationDeadline: string;
};

type RateAlert = {
  id: number;
  currencyCode: string;
  rateDate: string;
};

type MessageAlert = {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
};

type OptionItem = {
  id: number;
  name: string;
};

type SubscriberItem = {
  id: number;
  name: string | null;
  email: string;
  preferredLanguage: "ar" | "en";
  status: "pending" | "active" | "unsubscribed";
  createdAt: string;
};

type MediaItem = {
  id: number;
  fileName: string;
  url: string;
  createdAt: string;
};

type MarketingOverview = {
  campaignCount: number;
  sentTotal: number;
  openTotal: number;
  clickTotal: number;
  sentCampaigns: number;
};

type EngagementOverview = {
  avgScrollPercent: number;
  completionRate: number;
  avgDwellSeconds: number;
  eventCount: number;
};

type EngagedArticle = {
  id: number;
  title: string;
  maxScroll: number;
  maxDwellSeconds: number;
  events: number;
};

type EngagementRange = "7d" | "30d" | "90d";

type QANote = {
  tone: "warning" | "info";
  message: string;
  action?:
    | { type: "focus"; target: "featuredImage" | "videoUrl" | "sourceUrl" | "publishAt" | "title" | "summary" | "content" }
    | { type: "switchLocale"; locale: Locale };
};

type QAAction = NonNullable<QANote["action"]>;
type QAFocusAction = Extract<QAAction, { type: "focus" }>;

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: {
    message?: string;
  };
};

type ComposerState = {
  slug: string;
  status: ArticleStatus;
  articleType: string;
  featuredImageUrl: string;
  videoUrl: string;
  sourceUrl: string;
  sourceAttribution: string;
  relatedBankId: string;
  categoryId: string;
  publishAt: string;
  expiresAt: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isOpinion: boolean;
  isPressRelease: boolean;
  translations: Record<Locale, DraftLocaleContent>;
};

const emptyComposer: ComposerState = {
  slug: "",
  status: "draft",
  articleType: "news",
  featuredImageUrl: "",
  videoUrl: "",
  sourceUrl: "",
  sourceAttribution: "",
  relatedBankId: "",
  categoryId: "",
  publishAt: "",
  expiresAt: "",
  isBreaking: false,
  isFeatured: false,
  isOpinion: false,
  isPressRelease: false,
  translations: {
    ar: { title: "", summary: "", contentHtml: "" },
    en: { title: "", summary: "", contentHtml: "" },
  },
};

function truthyFlag(value: number | boolean): boolean {
  return value === true || value === 1;
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function hasCompleteTranslation(value: DraftLocaleContent): boolean {
  return value.title.trim().length >= 5 && value.summary.trim().length >= 20 && hasRichTextContent(value.contentHtml);
}

async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
  const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
  return json;
}

export function DashboardAdminManager({
  summary,
  articleRows,
  draftRows,
  scheduledRows,
  popularRows,
  expiredJobs,
  staleRates,
  pendingMessages,
  bankOptions,
  categoryOptions,
  initialSubscribers,
  recentMedia,
  marketingOverview,
  engagementOverview,
  engagementRange,
  topEngagedArticles,
}: {
  summary: DashboardSummary;
  articleRows: ArticleListItem[];
  draftRows: ArticleListItem[];
  scheduledRows: ArticleListItem[];
  popularRows: PopularArticle[];
  expiredJobs: JobAlert[];
  staleRates: RateAlert[];
  pendingMessages: MessageAlert[];
  bankOptions: OptionItem[];
  categoryOptions: OptionItem[];
  initialSubscribers: SubscriberItem[];
  recentMedia: MediaItem[];
  marketingOverview: MarketingOverview;
  engagementOverview: EngagementOverview;
  engagementRange: EngagementRange;
  topEngagedArticles: EngagedArticle[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const videoUrlInputRef = useRef<HTMLInputElement | null>(null);
  const sourceUrlInputRef = useRef<HTMLInputElement | null>(null);
  const publishAtInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const summaryInputRef = useRef<HTMLTextAreaElement | null>(null);
  const contentSectionRef = useRef<HTMLDivElement | null>(null);

  const [composer, setComposer] = useState<ComposerState>(emptyComposer);
  const [activeLocale, setActiveLocale] = useState<Locale>("ar");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingArticleId, setLoadingArticleId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(recentMedia);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>(initialSubscribers);
  const [savingSubscriberId, setSavingSubscriberId] = useState<number | null>(null);
  const [imagePreviewState, setImagePreviewState] = useState<"idle" | "ok" | "error">("idle");
  const activeSubscriberCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.status === "active").length,
    [subscribers]
  );
  const previewLocale: Locale = activeLocale;
  const previewTitle = composer.translations[previewLocale].title.trim();
  const previewSummary = composer.translations[previewLocale].summary.trim();
  const previewEmbedUrl = getYouTubeEmbedUrl(composer.videoUrl);
  const campaignOpenRate = marketingOverview.sentTotal > 0 ? Math.round((marketingOverview.openTotal / marketingOverview.sentTotal) * 1000) / 10 : 0;
  const campaignClickRate = marketingOverview.sentTotal > 0 ? Math.round((marketingOverview.clickTotal / marketingOverview.sentTotal) * 1000) / 10 : 0;
  const avgDwellMinutes = Math.max(0, Math.round((engagementOverview.avgDwellSeconds / 60) * 10) / 10);
  const engagementRangeLabel = engagementRange === "7d" ? "7 Days" : engagementRange === "90d" ? "90 Days" : "30 Days";

  useEffect(() => {
    setImagePreviewState("idle");
  }, [composer.featuredImageUrl]);

  function focusQaTarget(target: QAFocusAction["target"]) {
    const scheduleFocus = (focusTarget: HTMLElement | null) => {
      focusTarget?.focus();
      focusTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (target === "featuredImage") {
      scheduleFocus(featuredImageInputRef.current);
      return;
    }

    if (target === "sourceUrl") {
      scheduleFocus(sourceUrlInputRef.current);
      return;
    }

    if (target === "videoUrl") {
      scheduleFocus(videoUrlInputRef.current);
      return;
    }

    if (target === "publishAt") {
      scheduleFocus(publishAtInputRef.current);
      return;
    }

    if (target === "title") {
      scheduleFocus(titleInputRef.current);
      return;
    }

    if (target === "summary") {
      scheduleFocus(summaryInputRef.current);
      return;
    }

    contentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleQaAction(action: QAAction) {
    if (action.type === "switchLocale") {
      setActiveLocale(action.locale);
      requestAnimationFrame(() => {
        if (action.locale === "ar") {
          titleInputRef.current?.focus();
          titleInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          summaryInputRef.current?.focus();
          summaryInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      return;
    }

    focusQaTarget(action.target);
  }
  const qaNotes = useMemo<QANote[]>(() => {
    const notes: QANote[] = [];
    const arComplete = hasCompleteTranslation(composer.translations.ar);
    const enComplete = hasCompleteTranslation(composer.translations.en);

    if (!composer.featuredImageUrl.trim()) {
      notes.push({ tone: "warning", message: "Featured image is missing.", action: { type: "focus", target: "featuredImage" } });
    } else if (!looksLikeImageUrl(composer.featuredImageUrl)) {
      notes.push({ tone: "warning", message: "Featured image URL does not look like an image or uploaded media path.", action: { type: "focus", target: "featuredImage" } });
    } else if (imagePreviewState === "error") {
      notes.push({ tone: "info", message: "Featured image preview failed to load in admin. This may be temporary (CDN, hotlink policy, or network). Verify in public page after save.", action: { type: "focus", target: "featuredImage" } });
    }

    if (!composer.sourceUrl.trim()) {
      notes.push({ tone: "warning", message: "Source URL is missing.", action: { type: "focus", target: "sourceUrl" } });
    }

    if (composer.videoUrl.trim() && !previewEmbedUrl) {
      notes.push({ tone: "warning", message: "Video URL must be a supported YouTube link to embed in the article.", action: { type: "focus", target: "videoUrl" } });
    }

    if (composer.status === "scheduled" && !composer.publishAt.trim()) {
      notes.push({ tone: "warning", message: "Scheduled articles need a publish date and time.", action: { type: "focus", target: "publishAt" } });
    }

    if (!arComplete || !enComplete) {
      notes.push({
        tone: "info",
        message: `Bilingual parity check: Arabic is ${arComplete ? "complete" : "still incomplete"} and English is ${enComplete ? "complete" : "still incomplete"}.`,
        action: { type: "switchLocale", locale: arComplete ? "en" : "ar" },
      });
    }

    const currentDraft = composer.translations[activeLocale];
    if (currentDraft.title.trim().length < 5) {
      notes.push({ tone: "warning", message: `${activeLocale.toUpperCase()} title is too short.`, action: { type: "focus", target: "title" } });
    }

    if (currentDraft.summary.trim().length < 20) {
      notes.push({ tone: "warning", message: `${activeLocale.toUpperCase()} summary should be at least 20 characters.`, action: { type: "focus", target: "summary" } });
    }

    if (!hasRichTextContent(currentDraft.contentHtml)) {
      notes.push({ tone: "warning", message: `${activeLocale.toUpperCase()} content is empty.`, action: { type: "focus", target: "content" } });
    }

    return notes;
  }, [activeLocale, composer.featuredImageUrl, composer.publishAt, composer.sourceUrl, composer.status, composer.translations, composer.videoUrl, imagePreviewState, previewEmbedUrl]);
  const requiresStrictQa = composer.status === "review" || composer.status === "scheduled" || composer.status === "published";
  const blockingQaNotes = qaNotes.filter((note) => note.tone === "warning");
  const submitBlockedByQa = requiresStrictQa && blockingQaNotes.length > 0;

  const [localArticleRows, setLocalArticleRows] = useState<ArticleListItem[]>(articleRows);
  const sortedArticles = useMemo(
    () => [...localArticleRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [localArticleRows]
  );

  function updateComposer<K extends keyof ComposerState>(key: K, value: ComposerState[K]) {
    setComposer((prev) => ({ ...prev, [key]: value }));
  }

  function updateLocaleDraft(locale: Locale, key: keyof DraftLocaleContent, value: string) {
    setComposer((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [key]: value,
        },
      },
    }));
  }

  function resetComposer() {
    setComposer(emptyComposer);
    setEditingId(null);
    setActiveLocale("ar");
    setAiPrompt("");
    setAiError(null);
    setMediaWarning(null);
  }

  function buildPayload(locale: Locale) {
    return {
      locale,
      slug: composer.slug.trim() || null,
      title: composer.translations[locale].title.trim(),
      summary: composer.translations[locale].summary.trim(),
      contentHtml: composer.translations[locale].contentHtml.trim(),
      articleType: composer.articleType.trim(),
      status: composer.status,
      featuredImageUrl: composer.featuredImageUrl.trim() || null,
      videoUrl: composer.videoUrl.trim() || null,
      sourceUrl: composer.sourceUrl.trim() || null,
      sourceAttribution: composer.sourceAttribution.trim() || null,
      relatedBankId: composer.relatedBankId ? Number(composer.relatedBankId) : null,
      categoryId: composer.categoryId ? Number(composer.categoryId) : null,
      publishAt: toIsoDateTime(composer.publishAt),
      expiresAt: toIsoDateTime(composer.expiresAt),
      isBreaking: composer.isBreaking,
      isFeatured: composer.isFeatured,
      isSponsored: false,
      isOpinion: composer.isOpinion,
      isPressRelease: composer.isPressRelease,
    };
  }

  async function createOrUpdateArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (submitBlockedByQa) {
      setError(`Resolve ${blockingQaNotes.length} QA warning${blockingQaNotes.length === 1 ? "" : "s"} before moving this article to ${composer.status}.`);
      const firstAction = blockingQaNotes[0]?.action;
      if (firstAction) {
        handleQaAction(firstAction);
      }
      return;
    }

    if (composer.status === "scheduled" && !composer.publishAt) {
      setError("Scheduled posts require a publication date and time.");
      return;
    }

    const localesToSave = (Object.keys(composer.translations) as Locale[]).filter((locale) =>
      hasCompleteTranslation(composer.translations[locale])
    );

    if (!localesToSave.length) {
      setError("Provide at least one complete language version (Arabic or English).");
      return;
    }

    setSubmitting(true);

    if (!editingId) {
      const primaryLocale: Locale = localesToSave.includes("ar") ? "ar" : "en";
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(primaryLocale)),
      });

      const result = await parseResponse<{ articleId: number }>(response);
      if (!response.ok || !result.ok) {
        setSubmitting(false);
        setError(result.ok ? "Unable to create article" : result.error?.message ?? "Unable to create article");
        return;
      }

      const createdId = result.data.articleId;
      const secondaryLocales = localesToSave.filter((locale) => locale !== primaryLocale);

      for (const locale of secondaryLocales) {
        const secondaryResponse = await fetch(`/api/articles/${createdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(locale)),
        });

        const secondaryResult = await parseResponse<{ id: number }>(secondaryResponse);
        if (!secondaryResponse.ok || !secondaryResult.ok) {
          setSubmitting(false);
          setError(
            secondaryResult.ok
              ? "Article created but secondary locale failed to save"
              : secondaryResult.error?.message ?? "Article created but secondary locale failed to save"
          );
          return;
        }
      }

      setSubmitting(false);
      resetComposer();
      router.refresh();
      return;
    }

    for (const locale of localesToSave) {
      const response = await fetch(`/api/articles/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(locale)),
      });

      const result = await parseResponse<{ id: number }>(response);
      if (!response.ok || !result.ok) {
        setSubmitting(false);
        setError(result.ok ? "Unable to update article" : result.error?.message ?? "Unable to update article");
        return;
      }
    }

    setSubmitting(false);
    resetComposer();
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingArticleId(id);

    const response = await fetch(`/api/articles/${id}`, { method: "GET" });
    const result = await parseResponse<ArticleDetailItem[]>(response);
    setLoadingArticleId(null);

    if (!response.ok || !result.ok || !Array.isArray(result.data) || !result.data.length) {
      setError(result.ok ? "Unable to load article details" : result.error?.message ?? "Unable to load article details");
      return;
    }

    const base = result.data[0];
    const nextTranslations: Record<Locale, DraftLocaleContent> = {
      ar: { title: "", summary: "", contentHtml: "" },
      en: { title: "", summary: "", contentHtml: "" },
    };

    for (const row of result.data) {
      if (row.locale === "ar" || row.locale === "en") {
        nextTranslations[row.locale] = {
          title: row.title ?? "",
          summary: row.summary ?? "",
          contentHtml: row.contentHtml ?? "",
        };
      }
    }

    setEditingId(id);
    setComposer({
      slug: base.slug,
      status: base.status,
      articleType: base.articleType,
      featuredImageUrl: base.featuredImageUrl ?? "",
      videoUrl: base.videoUrl ?? "",
      sourceUrl: base.sourceUrl ?? "",
      sourceAttribution: base.sourceAttribution ?? "",
      relatedBankId: base.relatedBankId ? String(base.relatedBankId) : "",
      categoryId: base.categoryId ? String(base.categoryId) : "",
      publishAt: toDateTimeLocalValue(base.publishAt),
      expiresAt: toDateTimeLocalValue(base.expiresAt),
      isBreaking: truthyFlag(base.isBreaking),
      isFeatured: truthyFlag(base.isSponsored),
      isOpinion: truthyFlag(base.isOpinion),
      isPressRelease: truthyFlag(base.isPressRelease),
      translations: nextTranslations,
    });

    setActiveLocale(nextTranslations.ar.title ? "ar" : "en");
  }

  async function uploadImage() {
    setError(null);
    setMediaWarning(null);
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setError("Select an image first.");
      return;
    }

    setUploadingImage(true);

    const form = new FormData();
    form.set("file", file);

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: form,
    });

    const result = await parseResponse<{
      url?: string;
      driver?: string;
      warning?: string | null;
      media?: { id: number; fileName: string; url: string; createdAt: string } | null;
    }>(response);
    setUploadingImage(false);

    if (!response.ok || !result.ok || !result.data.url) {
      setError(result.ok ? "Image upload failed" : result.error?.message ?? "Image upload failed");
      return;
    }

    const uploadedUrl = result.data.url;

    // Set featured image URL first, before any refresh, to prevent state loss.
    setComposer((prev) => ({ ...prev, featuredImageUrl: uploadedUrl }));

    // Prepend new item to the local media list without triggering a full page refresh.
    if (result.data.media) {
      setMediaItems((prev) => [result.data.media as MediaItem, ...prev]);
    }

    if (result.data.driver === "database_blob_fallback") {
      setMediaWarning("FTP upload failed — image stored as blob. Update MEDIA_FTP_* env vars in Vercel to use media.bankinews.com.");
    }

    // Clear the file input.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function generateAiDraft(mode: "single" | "dual") {
    setAiError(null);

    const prompt = aiPrompt.trim();
    if (prompt.length < 20) {
      setAiError("Describe the story angle or facts first.");
      return;
    }

    setAiGenerating(true);

    try {
      const draft = composer.translations[activeLocale];
      const response = await fetch("/api/admin/ai/article-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          locale: activeLocale,
          articleType: composer.articleType,
          title: draft.title,
          summary: draft.summary,
          contentHtml: draft.contentHtml,
        }),
      });

      const result = await parseResponse<
        { title: string; summary: string; contentHtml: string } | { ar: { title: string; summary: string; contentHtml: string }; en: { title: string; summary: string; contentHtml: string } }
      >(response);

      if (!response.ok || !result.ok) {
        setAiError(result.ok ? "Unable to generate AI draft" : result.error?.message ?? "Unable to generate AI draft");
        return;
      }

      const nextTranslations =
        mode === "dual" && "ar" in result.data && "en" in result.data
          ? {
              ar: result.data.ar,
              en: result.data.en,
            }
          : {
              ...composer.translations,
              [activeLocale]: result.data as { title: string; summary: string; contentHtml: string },
            };

      setComposer((prev) => ({
        ...prev,
        translations: nextTranslations,
      }));
      setAiPrompt("");
    } catch {
      setAiError("Unable to generate AI draft");
    } finally {
      setAiGenerating(false);
    }
  }

  async function deleteArticle(id: number) {
    if (!window.confirm("Permanently delete this article? This cannot be undone.")) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ id: number; deleted: boolean }>(response);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete article" : result.error?.message ?? "Unable to delete article");
      return;
    }

    setLocalArticleRows((prev) => prev.filter((row) => row.id !== id));
    if (editingId === id) {
      resetComposer();
    }
  }

  async function updateSubscriberStatus(id: number, status: SubscriberItem["status"]) {
    setSavingSubscriberId(id);

    const response = await fetch(`/api/admin/newsletter-subscribers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = await parseResponse<{ id: number; status: SubscriberItem["status"] }>(response);
    setSavingSubscriberId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update subscriber" : result.error?.message ?? "Unable to update subscriber");
      return;
    }

    setSubscribers((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function deleteMediaItem(id: number) {
    const shouldDelete = window.confirm("Delete this uploaded media item?");
    if (!shouldDelete) {
      return;
    }

    setDeletingMediaId(id);
    setError(null);

    const response = await fetch(`/api/media?id=${id}`, {
      method: "DELETE",
    });

    const result = await parseResponse<{ deleted: boolean; id: number; warning?: string | null }>(response);
    setDeletingMediaId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete media" : result.error?.message ?? "Unable to delete media");
      return;
    }

    const deletedItem = mediaItems.find((item) => item.id === id);
    if (deletedItem && composer.featuredImageUrl === deletedItem.url) {
      setComposer((prev) => ({ ...prev, featuredImageUrl: "" }));
    }

    setMediaItems((prev) => prev.filter((item) => item.id !== id));

    if (result.data.warning) {
      setMediaWarning(result.data.warning);
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">Editorial Dashboard</h1>
        <p className="mt-2 text-[var(--text-muted)]">Create, review, schedule, and publish from one workspace without digging through technical settings.</p>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {mediaWarning && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{mediaWarning}</p>}

      <section className="rounded-xl border border-slate-200 bg-gradient-to-r from-[#0A2342] to-[#123A63] p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-cyan-100">Marketing Snapshot</h2>
            <p className="mt-1 text-sm text-slate-200">
              Campaign health at a glance, with subscriber count and delivery performance.
            </p>
          </div>
          <Link href="/admin/marketing" className="rounded bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[#0A2342] hover:bg-[var(--surface-elevated)]">
            Open Marketing Dashboard
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Active Subscribers" value={activeSubscriberCount} />
          <SummaryCard label="Campaigns" value={marketingOverview.campaignCount} />
          <SummaryCard label="Sent Campaigns" value={marketingOverview.sentCampaigns} />
          <SummaryCard label="Open Rate" value={`${campaignOpenRate}%`} />
          <SummaryCard label="Click Rate" value={`${campaignClickRate}%`} />
        </div>
      </section>

      <section className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Homepage Hero Carousel</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Update hero images and slide content from Homepage Sections using section key <span className="font-mono">hero_carousel</span>.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white hover:bg-[#091b35]"
          >
            Open Hero Settings
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-emerald-900">Reader Engagement ({engagementRangeLabel})</h2>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Measures real reading behavior: depth, completion, dwell time, and interaction volume.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
              {engagementOverview.eventCount} events tracked
            </span>
            <Link
              href="/admin?engagementRange=7d"
              className={`rounded border px-2 py-1 text-xs font-semibold ${engagementRange === "7d" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-400/30 bg-[var(--surface)] text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"}`}
            >
              7d
            </Link>
            <Link
              href="/admin?engagementRange=30d"
              className={`rounded border px-2 py-1 text-xs font-semibold ${engagementRange === "30d" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-400/30 bg-[var(--surface)] text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"}`}
            >
              30d
            </Link>
            <Link
              href="/admin?engagementRange=90d"
              className={`rounded border px-2 py-1 text-xs font-semibold ${engagementRange === "90d" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-400/30 bg-[var(--surface)] text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"}`}
            >
              90d
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Avg Scroll Depth" value={`${Math.round(engagementOverview.avgScrollPercent)}%`} />
          <SummaryCard label="Completion Rate" value={`${Math.round(engagementOverview.completionRate)}%`} />
          <SummaryCard label="Avg Dwell Time" value={`${avgDwellMinutes} min`} />
          <SummaryCard label="Engaged Articles" value={topEngagedArticles.length} />
        </div>

        <div className="mt-4 rounded-lg border border-emerald-500/25 bg-[var(--surface)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Top Engaged Articles</h3>
            <span className="text-xs font-semibold text-[var(--text-subtle)]">Depth + dwell signal</span>
          </div>
          {topEngagedArticles.length ? (
            <div className="space-y-2">
              {topEngagedArticles.slice(0, 6).map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded border border-[var(--border)] bg-[var(--surface)] p-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="text-xs text-[var(--text-subtle)]">
                      Max depth {Math.round(item.maxScroll)}% • Max dwell {Math.round(item.maxDwellSeconds)}s • {item.events} events
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(item.id)}
                    disabled={loadingArticleId === item.id}
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
                  >
                    {loadingArticleId === item.id ? "..." : "Edit"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No engagement signals yet. Published articles will appear here as readers interact.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard label="Published Today" value={summary.publishedToday} />
        <SummaryCard label="Drafts For Review" value={summary.draftsWaitingReview} />
        <SummaryCard label="Scheduled Posts" value={summary.scheduledPosts} />
        <SummaryCard label="Most-read Tracked" value={popularRows.length} />
        <SummaryCard label="Expired Jobs" value={summary.expiredJobs} />
        <SummaryCard label="Rates Needing Updates" value={summary.ratesNeedingUpdates} />
        <SummaryCard label="Messages To Respond" value={summary.messagesNeedResponse} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <form onSubmit={createOrUpdateArticle} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[var(--foreground)]">Article Studio</h2>
            {editingId ? (
              <button
                type="button"
                onClick={resetComposer}
                className="rounded border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)]"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <section className="mt-4 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">AI Writing Helper</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Draft or rewrite the {activeLocale === "ar" ? "Arabic" : "English"} version, or generate both locales together from one prompt.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => generateAiDraft("single")}
                  disabled={aiGenerating}
                  className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {aiGenerating ? "Generating..." : `Generate ${activeLocale.toUpperCase()}`}
                </button>
                <button
                  type="button"
                  onClick={() => generateAiDraft("dual")}
                  disabled={aiGenerating}
                  className="rounded border border-[#0A2342] px-3 py-2 text-sm font-semibold text-[#0A2342] disabled:opacity-60"
                >
                  {aiGenerating ? "Generating..." : "Generate Arabic + English"}
                </button>
              </div>
            </div>
            <textarea
              className="mt-3 min-h-24 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
              placeholder="Describe the angle, facts, or message you want AI to turn into a draft..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <p className="mt-2 text-xs text-[var(--text-subtle)]">
              The assistant will fill the current locale's title, summary, and content without switching away from the article editor.
            </p>
            {aiError && <p className="mt-2 text-sm text-red-700">{aiError}</p>}
          </section>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" value={composer.status} onChange={(e) => updateComposer("status", e.target.value as ArticleStatus)}>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Article type" value={composer.articleType} onChange={(e) => updateComposer("articleType", e.target.value)} required />
            <select className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" value={composer.categoryId} onChange={(e) => updateComposer("categoryId", e.target.value)}>
              <option value="">Select category</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" value={composer.relatedBankId} onChange={(e) => updateComposer("relatedBankId", e.target.value)}>
              <option value="">Select related bank</option>
              {bankOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <input ref={publishAtInputRef} type="datetime-local" className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" value={composer.publishAt} onChange={(e) => updateComposer("publishAt", e.target.value)} />
            <input type="datetime-local" className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]" value={composer.expiresAt} onChange={(e) => updateComposer("expiresAt", e.target.value)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input ref={videoUrlInputRef} className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="YouTube video URL (optional)" value={composer.videoUrl} onChange={(e) => updateComposer("videoUrl", e.target.value)} />
            <input ref={sourceUrlInputRef} className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Original source URL" value={composer.sourceUrl} onChange={(e) => updateComposer("sourceUrl", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Source attribution" value={composer.sourceAttribution} onChange={(e) => updateComposer("sourceAttribution", e.target.value)} />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">URL Slug (auto-generated · editable)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">/ar/news/</span>
              <input
                className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                placeholder="article-url-slug"
                value={composer.slug}
                onChange={(e) => updateComposer("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
              />
              <button
                type="button"
                onClick={() => updateComposer("slug", slugify(composer.translations.ar.title || composer.translations.en.title))}
                className="rounded border border-[var(--border)] px-2 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)]"
              >
                Re-generate
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input ref={featuredImageInputRef} className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Featured image URL" value={composer.featuredImageUrl} onChange={(e) => updateComposer("featuredImageUrl", e.target.value)} />
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="max-w-44 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-xs text-[var(--foreground)]" />
              <button type="button" onClick={uploadImage} disabled={uploadingImage} className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-60">
                {uploadingImage ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {mediaItems.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaItems.slice(0, 6).map((media) => (
                <div key={media.id} className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-muted)]">
                  <button
                    type="button"
                    onClick={() => updateComposer("featuredImageUrl", media.url)}
                    className="font-semibold hover:text-[var(--primary)]"
                  >
                    {media.fileName}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMediaItem(media.id)}
                    disabled={deletingMediaId === media.id}
                    className="rounded border border-red-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    {deletingMediaId === media.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveLocale("ar")}
              className={`rounded px-3 py-1.5 text-sm font-semibold ${activeLocale === "ar" ? "bg-[#0A2342] text-white" : "border border-[var(--border)] text-[var(--text-muted)]"}`}
            >
              Arabic
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale("en")}
              className={`rounded px-3 py-1.5 text-sm font-semibold ${activeLocale === "en" ? "bg-[#0A2342] text-white" : "border border-[var(--border)] text-[var(--text-muted)]"}`}
            >
              English
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <input ref={titleInputRef} className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder={`${activeLocale.toUpperCase()} title`} value={composer.translations[activeLocale].title} onChange={(e) => updateLocaleDraft(activeLocale, "title", e.target.value)} required={activeLocale === "ar"} />
            <textarea ref={summaryInputRef} className="min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder={`${activeLocale.toUpperCase()} summary`} value={composer.translations[activeLocale].summary} onChange={(e) => updateLocaleDraft(activeLocale, "summary", e.target.value)} required={activeLocale === "ar"} />
            <div ref={contentSectionRef}>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{activeLocale.toUpperCase()} content</label>
              <RichTextEditor
                value={composer.translations[activeLocale].contentHtml}
                onChange={(value) => updateLocaleDraft(activeLocale, "contentHtml", value)}
                placeholder={`${activeLocale.toUpperCase()} content`}
              />
            </div>
          </div>

          <section className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Article Preview</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Live preview for the active locale before you save or publish.</p>
              </div>
              <span className="rounded bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">{previewLocale.toUpperCase()}</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              {composer.featuredImageUrl.trim() ? (
                <div className="bg-slate-100">
                  <img
                    src={composer.featuredImageUrl}
                    alt={previewTitle || "Article preview"}
                    className="h-auto max-h-72 w-full object-cover"
                    onLoad={() => setImagePreviewState("ok")}
                    onError={() => setImagePreviewState("error")}
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-[var(--surface-strong)] text-sm text-[var(--text-subtle)]">No featured image selected yet.</div>
              )}

              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">
                  <span>{composer.articleType || "news"}</span>
                  <span>•</span>
                  <span>{composer.status}</span>
                </div>
                <h4 className="text-2xl font-black text-[var(--foreground)]">{previewTitle || "Headline preview"}</h4>
                <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">{previewSummary || "Summary preview will appear here as you type."}</p>

                {composer.videoUrl.trim() ? (
                  <div className="mt-4">
                    {previewEmbedUrl ? (
                      <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-black">
                        <iframe
                          src={previewEmbedUrl}
                          title="Video preview"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Video URL is present but cannot be embedded. Use a standard YouTube or `youtu.be` link.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Content QA</h3>
              <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{qaNotes.length} checks</span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Quick editorial checks before publish, including bilingual completeness and required story metadata.
            </p>
            <div className="mt-3 space-y-2">
              {qaNotes.length === 0 ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  The current article looks ready for review.
                </div>
              ) : (
                qaNotes.map((note, index) => (
                  (() => {
                    const action = note.action;

                    return (
                  <div
                    key={`${note.message}-${index}`}
                    className={`rounded border px-3 py-2 text-sm ${note.tone === "warning" ? "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-muted)]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p>{note.message}</p>
                      {action ? (
                        <button
                          type="button"
                          onClick={() => handleQaAction(action)}
                          className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                        >
                          {action.type === "switchLocale" ? `Go to ${action.locale.toUpperCase()}` : "Fix"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                    );
                  })()
                ))
              )}
            </div>
          </section>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
            <label><input type="checkbox" checked={composer.isFeatured} onChange={(e) => updateComposer("isFeatured", e.target.checked)} /> <span className="ml-1">Featured</span></label>
            <label><input type="checkbox" checked={composer.isBreaking} onChange={(e) => updateComposer("isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
            <label><input type="checkbox" checked={composer.isOpinion} onChange={(e) => updateComposer("isOpinion", e.target.checked)} /> <span className="ml-1">Opinion</span></label>
            <label><input type="checkbox" checked={composer.isPressRelease} onChange={(e) => updateComposer("isPressRelease", e.target.checked)} /> <span className="ml-1">Press Release</span></label>
          </div>

          {submitBlockedByQa ? (
            <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Resolve QA warnings before saving with status <span className="font-semibold">{composer.status}</span>. Switch to <span className="font-semibold">draft</span> to save work in progress.
            </p>
          ) : null}

          <button type="submit" disabled={submitting || submitBlockedByQa} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : editingId ? `Save Article #${editingId}` : "Create Article"}
          </button>
        </form>

        <div className="space-y-4">
          <Panel title="Draft Queue" count={draftRows.length}>
            {draftRows.slice(0, 7).map((row) => (
              <QuickRow key={row.id} label={row.title ?? row.slug} meta={row.status} onEdit={() => startEdit(row.id)} loading={loadingArticleId === row.id} />
            ))}
          </Panel>

          <Panel title="Scheduled" count={scheduledRows.length}>
            {scheduledRows.slice(0, 7).map((row) => (
              <QuickRow key={row.id} label={row.title ?? row.slug} meta={row.publishAt ? new Date(row.publishAt).toLocaleString() : "No date"} onEdit={() => startEdit(row.id)} loading={loadingArticleId === row.id} />
            ))}
          </Panel>

          <Panel title="Most Read" count={popularRows.length}>
            {popularRows.slice(0, 7).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-[var(--foreground)]">{row.title}</p>
                <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{row.views} views</span>
              </div>
            ))}
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--foreground)]">Newsletter Subscribers</h2>
            <p className="text-xs text-[var(--text-subtle)]">Manage from dashboard</p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {subscribers.slice(0, 80).map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded border border-slate-100 p-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.name || "Unnamed"}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.email} • {item.preferredLanguage.toUpperCase()}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => setSubscribers((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: e.target.value as SubscriberItem["status"] } : row)))}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--foreground)]"
                >
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="unsubscribed">unsubscribed</option>
                </select>
                <button
                  type="button"
                  onClick={() => updateSubscriberStatus(item.id, item.status)}
                  disabled={savingSubscriberId === item.id}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
                >
                  {savingSubscriberId === item.id ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Expired Jobs" count={expiredJobs.length}>
            {expiredJobs.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-[var(--foreground)]">{job.title}</p>
                <p className="text-xs text-[var(--text-subtle)]">Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Rates Needing Update" count={staleRates.length}>
            {staleRates.slice(0, 6).map((rate) => (
              <div key={rate.id} className="rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-[var(--foreground)]">{rate.currencyCode}</p>
                <p className="text-xs text-[var(--text-subtle)]">Last update: {new Date(rate.rateDate).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Messages Requiring Response" count={pendingMessages.length}>
            {pendingMessages.slice(0, 6).map((msg) => (
              <div key={msg.id} className="rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-[var(--foreground)]">{msg.subject}</p>
                <p className="text-xs text-[var(--text-subtle)]">{msg.status} • {new Date(msg.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black text-[var(--foreground)]">Recent Articles</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Quickly jump into edits without leaving this screen.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Article</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Flags</th>
                <th className="px-3 py-2 font-semibold">Updated</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedArticles.slice(0, 40).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-[var(--foreground)]">{row.title ?? row.slug}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{row.articleType}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{row.status}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {truthyFlag(row.isFeatured) ? "Featured" : "-"}
                    {truthyFlag(row.isBreaking) ? " • Breaking" : ""}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{new Date(row.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(row.id)} disabled={loadingArticleId === row.id} className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60">
                        {loadingArticleId === row.id ? "Loading..." : "Edit"}
                      </button>
                      <button type="button" onClick={() => deleteArticle(row.id)} className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#0A2342]">{value}</p>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">{title}</h3>
        <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function QuickRow({
  label,
  meta,
  onEdit,
  loading,
}: {
  label: string;
  meta: string;
  onEdit: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] p-2">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--text-subtle)]">{meta}</p>
      </div>
      <button type="button" onClick={onEdit} disabled={loading} className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60">
        {loading ? "..." : "Edit"}
      </button>
    </div>
  );
}
