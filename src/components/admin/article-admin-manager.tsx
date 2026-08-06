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
  isSponsored: number | boolean;
  isOpinion: number | boolean;
  isPressRelease: number | boolean;
  locale: string | null;
  title: string | null;
  summary: string | null;
  contentHtml: string | null;
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
  isSponsored: false,
  isOpinion: false,
  isPressRelease: false,
};

function truthyFlag(value: number | boolean): boolean {
  return value === true || value === 1;
}

export function ArticleAdminManager({ initialRows }: { initialRows: ArticleListItem[] }) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<ArticleFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ArticleFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const response = await fetch(`/api/articles/${id}`, { method: "GET" });
    const result = await parseResponse<ArticleDetailItem[]>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      setError(result.ok ? "Unable to load article details" : result.error?.message ?? "Unable to load article details");
      return;
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
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[#0A2342]">Articles</h1>
      <p className="mt-2 text-slate-600">Create, edit, and delete articles from the admin panel.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Create Article</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Title" value={createForm.title} onChange={(e) => onChange(setCreateForm, "title", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Article Type (e.g. news)" value={createForm.articleType} onChange={(e) => onChange(setCreateForm, "articleType", e.target.value)} required />
          <select className="rounded border border-slate-300 px-3 py-2" value={createForm.locale} onChange={(e) => onChange(setCreateForm, "locale", e.target.value as Locale)}>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
          <select className="rounded border border-slate-300 px-3 py-2" value={createForm.status} onChange={(e) => onChange(setCreateForm, "status", e.target.value as ArticleStatus)}>
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="scheduled">scheduled</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <textarea className="mt-3 min-h-20 w-full rounded border border-slate-300 px-3 py-2" placeholder="Summary" value={createForm.summary} onChange={(e) => onChange(setCreateForm, "summary", e.target.value)} required />
        <div className="mt-3">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Content</label>
          <RichTextEditor
            value={createForm.contentHtml}
            onChange={(value) => onChange(setCreateForm, "contentHtml", value)}
            placeholder="Write your article content"
          />
        </div>
        <input className="mt-3 w-full rounded border border-slate-300 px-3 py-2" placeholder="Featured image URL (optional)" value={createForm.featuredImageUrl} onChange={(e) => onChange(setCreateForm, "featuredImageUrl", e.target.value)} />

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label><input type="checkbox" checked={createForm.isBreaking} onChange={(e) => onChange(setCreateForm, "isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
          <label><input type="checkbox" checked={createForm.isSponsored} onChange={(e) => onChange(setCreateForm, "isSponsored", e.target.checked)} /> <span className="ml-1">Sponsored</span></label>
          <label><input type="checkbox" checked={createForm.isOpinion} onChange={(e) => onChange(setCreateForm, "isOpinion", e.target.checked)} /> <span className="ml-1">Opinion</span></label>
          <label><input type="checkbox" checked={createForm.isPressRelease} onChange={(e) => onChange(setCreateForm, "isPressRelease", e.target.checked)} /> <span className="ml-1">Press Release</span></label>
        </div>

        <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Create Article"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
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
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">{row.id}</td>
                <td className="px-3 py-2 text-slate-900">{row.title ?? row.slug}</td>
                <td className="px-3 py-2 text-slate-700">{row.articleType}</td>
                <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{row.status}</span></td>
                <td className="px-3 py-2 text-slate-700">{new Date(row.updatedAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(row.id)} disabled={loadingId === row.id || submitting} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{loadingId === row.id ? "Loading..." : "Edit"}</button>
                    <button type="button" onClick={() => handleDelete(row.id)} disabled={loadingId === row.id || submitting} className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <form onSubmit={handleUpdate} className="mt-6 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Edit Article #{editingId}</h2>
            <button type="button" className="text-sm font-semibold text-slate-600" onClick={() => setEditingId(null)}>Cancel</button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Title" value={editForm.title} onChange={(e) => onChange(setEditForm, "title", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Article Type" value={editForm.articleType} onChange={(e) => onChange(setEditForm, "articleType", e.target.value)} required />
            <select className="rounded border border-slate-300 px-3 py-2" value={editForm.locale} onChange={(e) => onChange(setEditForm, "locale", e.target.value as Locale)}>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
            <select className="rounded border border-slate-300 px-3 py-2" value={editForm.status} onChange={(e) => onChange(setEditForm, "status", e.target.value as ArticleStatus)}>
              <option value="draft">draft</option>
              <option value="review">review</option>
              <option value="scheduled">scheduled</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <textarea className="mt-3 min-h-20 w-full rounded border border-slate-300 px-3 py-2" placeholder="Summary" value={editForm.summary} onChange={(e) => onChange(setEditForm, "summary", e.target.value)} required />
          <div className="mt-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Content</label>
            <RichTextEditor
              value={editForm.contentHtml}
              onChange={(value) => onChange(setEditForm, "contentHtml", value)}
              placeholder="Update the article content"
            />
          </div>
          <input className="mt-3 w-full rounded border border-slate-300 px-3 py-2" placeholder="Featured image URL (optional)" value={editForm.featuredImageUrl} onChange={(e) => onChange(setEditForm, "featuredImageUrl", e.target.value)} />

          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label><input type="checkbox" checked={editForm.isBreaking} onChange={(e) => onChange(setEditForm, "isBreaking", e.target.checked)} /> <span className="ml-1">Breaking</span></label>
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