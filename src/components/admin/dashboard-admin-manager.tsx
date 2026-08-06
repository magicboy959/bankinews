"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor, hasRichTextContent } from "./rich-text-editor";

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
  status: ArticleStatus;
  articleType: string;
  featuredImageUrl: string;
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
  status: "draft",
  articleType: "news",
  featuredImageUrl: "",
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
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [composer, setComposer] = useState<ComposerState>(emptyComposer);
  const [activeLocale, setActiveLocale] = useState<Locale>("ar");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingArticleId, setLoadingArticleId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>(initialSubscribers);
  const [savingSubscriberId, setSavingSubscriberId] = useState<number | null>(null);

  const sortedArticles = useMemo(
    () => [...articleRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [articleRows]
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
  }

  function buildPayload(locale: Locale) {
    return {
      locale,
      title: composer.translations[locale].title.trim(),
      summary: composer.translations[locale].summary.trim(),
      contentHtml: composer.translations[locale].contentHtml.trim(),
      articleType: composer.articleType.trim(),
      status: composer.status,
      featuredImageUrl: composer.featuredImageUrl.trim() || null,
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
      status: base.status,
      articleType: base.articleType,
      featuredImageUrl: base.featuredImageUrl ?? "",
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

    const result = await parseResponse<{ url?: string }>(response);
    setUploadingImage(false);

    if (!response.ok || !result.ok || !result.data.url) {
      setError(result.ok ? "Image upload failed" : result.error?.message ?? "Image upload failed");
      return;
    }

    setComposer((prev) => ({ ...prev, featuredImageUrl: result.data.url ?? prev.featuredImageUrl }));
    router.refresh();
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#0A2342]">Editorial Dashboard</h1>
        <p className="mt-2 text-slate-600">Create, review, schedule, and publish from one workspace without digging through technical settings.</p>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

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
        <form onSubmit={createOrUpdateArticle} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">Article Studio</h2>
            {editingId ? (
              <button
                type="button"
                onClick={resetComposer}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select className="rounded border border-slate-300 bg-white px-3 py-2" value={composer.status} onChange={(e) => updateComposer("status", e.target.value as ArticleStatus)}>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Article type" value={composer.articleType} onChange={(e) => updateComposer("articleType", e.target.value)} required />
            <select className="rounded border border-slate-300 bg-white px-3 py-2" value={composer.categoryId} onChange={(e) => updateComposer("categoryId", e.target.value)}>
              <option value="">Select category</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select className="rounded border border-slate-300 bg-white px-3 py-2" value={composer.relatedBankId} onChange={(e) => updateComposer("relatedBankId", e.target.value)}>
              <option value="">Select related bank</option>
              {bankOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <input type="datetime-local" className="rounded border border-slate-300 px-3 py-2" value={composer.publishAt} onChange={(e) => updateComposer("publishAt", e.target.value)} />
            <input type="datetime-local" className="rounded border border-slate-300 px-3 py-2" value={composer.expiresAt} onChange={(e) => updateComposer("expiresAt", e.target.value)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Original source URL" value={composer.sourceUrl} onChange={(e) => updateComposer("sourceUrl", e.target.value)} />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Source attribution" value={composer.sourceAttribution} onChange={(e) => updateComposer("sourceAttribution", e.target.value)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Featured image URL" value={composer.featuredImageUrl} onChange={(e) => updateComposer("featuredImageUrl", e.target.value)} />
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="max-w-44 rounded border border-slate-300 px-2 py-2 text-xs" />
              <button type="button" onClick={uploadImage} disabled={uploadingImage} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
                {uploadingImage ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {recentMedia.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentMedia.slice(0, 6).map((media) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => updateComposer("featuredImageUrl", media.url)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  {media.fileName}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveLocale("ar")}
              className={`rounded px-3 py-1.5 text-sm font-semibold ${activeLocale === "ar" ? "bg-[#0A2342] text-white" : "border border-slate-300 text-slate-700"}`}
            >
              Arabic
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale("en")}
              className={`rounded px-3 py-1.5 text-sm font-semibold ${activeLocale === "en" ? "bg-[#0A2342] text-white" : "border border-slate-300 text-slate-700"}`}
            >
              English
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder={`${activeLocale.toUpperCase()} title`} value={composer.translations[activeLocale].title} onChange={(e) => updateLocaleDraft(activeLocale, "title", e.target.value)} required={activeLocale === "ar"} />
            <textarea className="min-h-20 w-full rounded border border-slate-300 px-3 py-2" placeholder={`${activeLocale.toUpperCase()} summary`} value={composer.translations[activeLocale].summary} onChange={(e) => updateLocaleDraft(activeLocale, "summary", e.target.value)} required={activeLocale === "ar"} />
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{activeLocale.toUpperCase()} content</label>
              <RichTextEditor
                value={composer.translations[activeLocale].contentHtml}
                onChange={(value) => updateLocaleDraft(activeLocale, "contentHtml", value)}
                placeholder={`${activeLocale.toUpperCase()} content`}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
            <label><input type="checkbox" checked={composer.isFeatured} onChange={(e) => updateComposer("isFeatured", e.target.checked)} /> <span className="ml-1">Featured</span></label>
            <label><input type="checkbox" checked={composer.isBreaking} onChange={(e) => updateComposer("isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
            <label><input type="checkbox" checked={composer.isOpinion} onChange={(e) => updateComposer("isOpinion", e.target.checked)} /> <span className="ml-1">Opinion</span></label>
            <label><input type="checkbox" checked={composer.isPressRelease} onChange={(e) => updateComposer("isPressRelease", e.target.checked)} /> <span className="ml-1">Press Release</span></label>
          </div>

          <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
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
                <p className="font-medium text-slate-800">{row.title}</p>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{row.views} views</span>
              </div>
            ))}
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Newsletter Subscribers</h2>
            <p className="text-xs text-slate-500">Manage from dashboard</p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {subscribers.slice(0, 80).map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded border border-slate-100 p-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name || "Unnamed"}</p>
                  <p className="text-xs text-slate-600">{item.email} • {item.preferredLanguage.toUpperCase()}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => setSubscribers((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: e.target.value as SubscriberItem["status"] } : row)))}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="unsubscribed">unsubscribed</option>
                </select>
                <button
                  type="button"
                  onClick={() => updateSubscriberStatus(item.id, item.status)}
                  disabled={savingSubscriberId === item.id}
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
                <p className="font-medium text-slate-800">{job.title}</p>
                <p className="text-xs text-slate-500">Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Rates Needing Update" count={staleRates.length}>
            {staleRates.slice(0, 6).map((rate) => (
              <div key={rate.id} className="rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-slate-800">{rate.currencyCode}</p>
                <p className="text-xs text-slate-500">Last update: {new Date(rate.rateDate).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>

          <Panel title="Messages Requiring Response" count={pendingMessages.length}>
            {pendingMessages.slice(0, 6).map((msg) => (
              <div key={msg.id} className="rounded border border-slate-100 p-2 text-sm">
                <p className="font-medium text-slate-800">{msg.subject}</p>
                <p className="text-xs text-slate-500">{msg.status} • {new Date(msg.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </Panel>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-black text-slate-900">Recent Articles</h2>
        <p className="mt-1 text-sm text-slate-600">Quickly jump into edits without leaving this screen.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Article</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Flags</th>
                <th className="px-3 py-2 font-semibold">Updated</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedArticles.slice(0, 40).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-900">{row.title ?? row.slug}</td>
                  <td className="px-3 py-2 text-slate-700">{row.articleType}</td>
                  <td className="px-3 py-2 text-slate-700">{row.status}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {truthyFlag(row.isFeatured) ? "Featured" : "-"}
                    {truthyFlag(row.isBreaking) ? " • Breaking" : ""}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{new Date(row.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => startEdit(row.id)} disabled={loadingArticleId === row.id} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                      {loadingArticleId === row.id ? "Loading..." : "Edit"}
                    </button>
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#0A2342]">{value}</p>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{count}</span>
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
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border border-slate-100 p-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <button type="button" onClick={onEdit} disabled={loading} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {loading ? "..." : "Edit"}
      </button>
    </div>
  );
}
