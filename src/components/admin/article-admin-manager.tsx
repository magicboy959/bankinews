"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";

type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "archived";
type Locale = "ar" | "en";

type ArticleListItem = {
  id: number;
  slug: string;
  status: string;
  articleType: string;
  title: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

type ArticleDetailItem = {
  id: number;
  slug: string;
  status: ArticleStatus;
  articleType: string;
  featuredImageUrl: string | null;
  isBreaking: number | boolean;
  isFeatured: number | boolean;
  isSponsored: number | boolean;
  isOpinion: number | boolean;
  isPressRelease: number | boolean;
  locale: string | null;
  title: string | null;
  summary: string | null;
  contentHtml: string | null;
};

type ArticleHistoryItem = {
  action: "article_created" | "article_updated" | "article_deleted" | string;
  previousStatus: string | null;
  newStatus: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  editorName: string | null;
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

type ArticleFormState = {
  locale: Locale;
  title: string;
  summary: string;
  contentHtml: string;
  articleType: string;
  status: ArticleStatus;
  featuredImageUrl: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  isOpinion: boolean;
  isPressRelease: boolean;
};

const emptyForm: ArticleFormState = {
  locale: "ar",
  title: "",
  summary: "",
  contentHtml: "",
  articleType: "news",
  status: "draft",
  featuredImageUrl: "",
  isBreaking: false,
  isFeatured: false,
  isSponsored: false,
  isOpinion: false,
  isPressRelease: false,
};

function truthyFlag(value: number | boolean): boolean {
  return value === true || value === 1;
}

function historyFieldLabel(key: string, locale: Locale): string {
  const labels: Record<string, { ar: string; en: string }> = {
    status: { ar: "الحالة", en: "Status" },
    articleType: { ar: "نوع المادة", en: "Article type" },
    title: { ar: "العنوان", en: "Title" },
    summary: { ar: "الملخص", en: "Summary" },
    sourceUrl: { ar: "رابط المصدر", en: "Source URL" },
    sourceAttribution: { ar: "الإسناد", en: "Source attribution" },
    featuredImageUrl: { ar: "الصورة الرئيسية", en: "Featured image" },
    publishAt: { ar: "موعد النشر", en: "Publish at" },
    expiresAt: { ar: "تاريخ الانتهاء", en: "Expires at" },
    isBreaking: { ar: "عاجل", en: "Breaking" },
    isFeatured: { ar: "اختيار التحرير", en: "Editor's pick" },
    isSponsored: { ar: "برعاية", en: "Sponsored" },
    isOpinion: { ar: "رأي", en: "Opinion" },
    isPressRelease: { ar: "بيان صحفي", en: "Press release" },
    relatedBankId: { ar: "البنك المرتبط", en: "Related bank" },
    categoryId: { ar: "التصنيف", en: "Category" },
  };

  return labels[key]?.[locale] ?? key;
}

export function ArticleAdminManager({ initialRows }: { initialRows: ArticleListItem[] }) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<ArticleFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ArticleFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editHistory, setEditHistory] = useState<ArticleHistoryItem[]>([]);

  const sortedRows = useMemo(
    () => [...initialRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [initialRows]
  );

  function onChange(
    setter: React.Dispatch<React.SetStateAction<ArticleFormState>>,
    key: keyof ArticleFormState,
    value: string | boolean
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      ...createForm,
      title: createForm.title.trim(),
      summary: createForm.summary.trim(),
      contentHtml: createForm.contentHtml.trim(),
      articleType: createForm.articleType.trim(),
      featuredImageUrl: createForm.featuredImageUrl.trim() || null,
    };

    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await parseResponse<{ articleId: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create article" : result.error?.message ?? "Unable to create article");
      return;
    }

    setCreateForm(emptyForm);
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingId(id);
    setHistoryLoading(true);

    const [response, historyResponse] = await Promise.all([
      fetch(`/api/articles/${id}`, { method: "GET" }),
      fetch(`/api/articles/${id}/history`, { method: "GET" }),
    ]);

    const result = await parseResponse<ArticleDetailItem[]>(response);
    const historyResult = await parseResponse<ArticleHistoryItem[]>(historyResponse);
    setLoadingId(null);
    setHistoryLoading(false);

    if (!response.ok || !result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      setError(result.ok ? "Unable to load article details" : result.error?.message ?? "Unable to load article details");
      return;
    }

    if (historyResponse.ok && historyResult.ok && Array.isArray(historyResult.data)) {
      setEditHistory(historyResult.data);
    } else {
      setEditHistory([]);
    }

    const preferredLocale = editForm.locale;
    const localeRow =
      result.data.find((row) => row.locale === preferredLocale) ??
      result.data.find((row) => row.locale === "ar") ??
      result.data[0];
    const baseRow = result.data[0];

    setEditingId(id);
    setEditForm({
      locale: localeRow.locale === "en" ? "en" : "ar",
      title: localeRow.title ?? "",
      summary: localeRow.summary ?? "",
      contentHtml: localeRow.contentHtml ?? "",
      articleType: baseRow.articleType,
      status: baseRow.status,
      featuredImageUrl: baseRow.featuredImageUrl ?? "",
      isBreaking: truthyFlag(baseRow.isBreaking),
      isFeatured: truthyFlag(baseRow.isFeatured),
      isSponsored: truthyFlag(baseRow.isSponsored),
      isOpinion: truthyFlag(baseRow.isOpinion),
      isPressRelease: truthyFlag(baseRow.isPressRelease),
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      ...editForm,
      title: editForm.title.trim(),
      summary: editForm.summary.trim(),
      contentHtml: editForm.contentHtml.trim(),
      articleType: editForm.articleType.trim(),
      featuredImageUrl: editForm.featuredImageUrl.trim() || null,
    };

    const response = await fetch(`/api/articles/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update article" : result.error?.message ?? "Unable to update article");
      return;
    }

    setEditingId(null);
    setEditForm(emptyForm);
    setEditHistory([]);
    router.refresh();
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm("Delete this article?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete article" : result.error?.message ?? "Unable to delete article");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
      setEditHistory([]);
    }

    router.refresh();
  }

  function historyLabel(action: string, locale: Locale): string {
    const isAr = locale === "ar";
    if (action === "article_created") {
      return isAr ? "تم الإنشاء" : "Created";
    }
    if (action === "article_updated") {
      return isAr ? "تم التحديث" : "Updated";
    }
    if (action === "article_deleted") {
      return isAr ? "تم الحذف" : "Deleted";
    }
    return isAr ? "تغيير" : "Change";
  }

  function historySummary(item: ArticleHistoryItem, locale: Locale): string {
    const isAr = locale === "ar";
    const changes = (item.metadata?.changes as Record<string, { from: unknown; to: unknown }> | undefined) ?? undefined;
    if (!changes) {
      return isAr ? "لا توجد تفاصيل إضافية." : "No additional details.";
    }

    const changedFields = Object.entries(changes)
      .filter(([, value]) => String(value.from ?? "") !== String(value.to ?? ""))
      .slice(0, 4)
      .map(([key]) => historyFieldLabel(key, locale));

    if (!changedFields.length) {
      return isAr ? "لا توجد تغييرات جوهرية مسجلة." : "No material field changes recorded.";
    }

    return isAr ? `الحقول المعدلة: ${changedFields.join("، ")}` : `Changed fields: ${changedFields.join(", ")}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--foreground)]">Articles</h1>
      <p className="mt-2 text-[var(--text-muted)]">Create, edit, and delete articles from the admin panel.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Create Article</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Title" value={createForm.title} onChange={(e) => onChange(setCreateForm, "title", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Article Type (e.g. news)" value={createForm.articleType} onChange={(e) => onChange(setCreateForm, "articleType", e.target.value)} required />
          <select className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" value={createForm.locale} onChange={(e) => onChange(setCreateForm, "locale", e.target.value as Locale)}>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
          <select className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" value={createForm.status} onChange={(e) => onChange(setCreateForm, "status", e.target.value as ArticleStatus)}>
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="scheduled">scheduled</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <textarea className="mt-3 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Summary" value={createForm.summary} onChange={(e) => onChange(setCreateForm, "summary", e.target.value)} required />
        <div className="mt-3">
          <label className="mb-2 block text-sm font-semibold text-[var(--text-muted)]">Content</label>
          <RichTextEditor
            value={createForm.contentHtml}
            onChange={(value) => onChange(setCreateForm, "contentHtml", value)}
            placeholder="Write your article content"
          />
        </div>
        <input className="mt-3 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Featured image URL (optional)" value={createForm.featuredImageUrl} onChange={(e) => onChange(setCreateForm, "featuredImageUrl", e.target.value)} />

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label><input type="checkbox" checked={createForm.isBreaking} onChange={(e) => onChange(setCreateForm, "isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
          <label><input type="checkbox" checked={createForm.isFeatured} onChange={(e) => onChange(setCreateForm, "isFeatured", e.target.checked)} /> <span className="ml-1">Editor&apos;s Pick</span></label>
          <label><input type="checkbox" checked={createForm.isSponsored} onChange={(e) => onChange(setCreateForm, "isSponsored", e.target.checked)} /> <span className="ml-1">Sponsored</span></label>
          <label><input type="checkbox" checked={createForm.isOpinion} onChange={(e) => onChange(setCreateForm, "isOpinion", e.target.checked)} /> <span className="ml-1">Opinion</span></label>
          <label><input type="checkbox" checked={createForm.isPressRelease} onChange={(e) => onChange(setCreateForm, "isPressRelease", e.target.checked)} /> <span className="ml-1">Press Release</span></label>
        </div>

        <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Create Article"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Updated</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.id}</td>
                <td className="px-3 py-2 text-[var(--foreground)]">{row.title ?? row.slug}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.articleType}</td>
                <td className="px-3 py-2"><span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{row.status}</span></td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{new Date(row.updatedAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(row.id)} disabled={loadingId === row.id || submitting} className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60">{loadingId === row.id ? "Loading..." : "Edit"}</button>
                    <button type="button" onClick={() => handleDelete(row.id)} disabled={loadingId === row.id || submitting} className="rounded border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <form onSubmit={handleUpdate} className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Edit Article #{editingId}</h2>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--text-muted)]"
              onClick={() => {
                setEditingId(null);
                setEditHistory([]);
              }}
            >
              Cancel
            </button>
          </div>

          <section className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-strong)] p-3">
            <h3 className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]">
              {editForm.locale === "ar" ? "سجل التصحيحات" : "Correction History"}
            </h3>
            {historyLoading && (
              <p className="mt-2 text-xs text-[var(--text-subtle)]">
                {editForm.locale === "ar" ? "جاري تحميل السجل..." : "Loading history..."}
              </p>
            )}
            {!historyLoading && editHistory.length === 0 && (
              <p className="mt-2 text-xs text-[var(--text-subtle)]">
                {editForm.locale === "ar" ? "لا يوجد سجل تصحيحات حتى الآن." : "No correction history recorded yet."}
              </p>
            )}
            {!historyLoading && editHistory.length > 0 && (
              <div className="mt-3 space-y-2">
                {editHistory.map((item, index) => (
                  <div key={`${item.action}-${item.createdAt}-${index}`} className="rounded border border-[var(--border)] bg-[var(--surface)] p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[var(--foreground)]">{historyLabel(item.action, editForm.locale)}</span>
                      <span className="text-[var(--text-subtle)]">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{historySummary(item, editForm.locale)}</p>
                    {item.editorName && (
                      <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
                        {editForm.locale === "ar" ? `بواسطة ${item.editorName}` : `By ${item.editorName}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Title" value={editForm.title} onChange={(e) => onChange(setEditForm, "title", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Article Type" value={editForm.articleType} onChange={(e) => onChange(setEditForm, "articleType", e.target.value)} required />
            <select className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" value={editForm.locale} onChange={(e) => onChange(setEditForm, "locale", e.target.value as Locale)}>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
            <select className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" value={editForm.status} onChange={(e) => onChange(setEditForm, "status", e.target.value as ArticleStatus)}>
              <option value="draft">draft</option>
              <option value="review">review</option>
              <option value="scheduled">scheduled</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <textarea className="mt-3 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Summary" value={editForm.summary} onChange={(e) => onChange(setEditForm, "summary", e.target.value)} required />
          <div className="mt-3">
            <label className="mb-2 block text-sm font-semibold text-[var(--text-muted)]">Content</label>
            <RichTextEditor
              value={editForm.contentHtml}
              onChange={(value) => onChange(setEditForm, "contentHtml", value)}
              placeholder="Update the article content"
            />
          </div>
          <input className="mt-3 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Featured image URL (optional)" value={editForm.featuredImageUrl} onChange={(e) => onChange(setEditForm, "featuredImageUrl", e.target.value)} />

          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label><input type="checkbox" checked={editForm.isBreaking} onChange={(e) => onChange(setEditForm, "isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
            <label><input type="checkbox" checked={editForm.isFeatured} onChange={(e) => onChange(setEditForm, "isFeatured", e.target.checked)} /> <span className="ml-1">Editor&apos;s Pick</span></label>
            <label><input type="checkbox" checked={editForm.isSponsored} onChange={(e) => onChange(setEditForm, "isSponsored", e.target.checked)} /> <span className="ml-1">Sponsored</span></label>
            <label><input type="checkbox" checked={editForm.isOpinion} onChange={(e) => onChange(setEditForm, "isOpinion", e.target.checked)} /> <span className="ml-1">Opinion</span></label>
            <label><input type="checkbox" checked={editForm.isPressRelease} onChange={(e) => onChange(setEditForm, "isPressRelease", e.target.checked)} /> <span className="ml-1">Press Release</span></label>
          </div>

          <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
