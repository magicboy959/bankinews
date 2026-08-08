"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductListItem = {
  id: number;
  slug: string;
  category: string;
  bankName: string | null;
  name: string | null;
  updatedAt: string;
};

type BankOption = {
  id: number;
  name: string;
};

type ProductDetailItem = {
  id: number;
  slug: string;
  bankId: number;
  category: string;
  officialSourceUrl: string | null;
  name: string | null;
  description: string | null;
};

type ProductFormState = {
  slug: string;
  bankId: string;
  category: string;
  name: string;
  description: string;
  officialSourceUrl: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

const emptyForm: ProductFormState = {
  slug: "",
  bankId: "",
  category: "",
  name: "",
  description: "",
  officialSourceUrl: "",
};

export function ProductAdminManager({
  initialRows,
  bankOptions,
}: {
  initialRows: ProductListItem[];
  bankOptions: BankOption[];
}) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<ProductFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedRows = useMemo(
    () => [...initialRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [initialRows]
  );

  function onChange(
    setter: React.Dispatch<React.SetStateAction<ProductFormState>>,
    key: keyof ProductFormState,
    value: string
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  function toPayload(form: ProductFormState) {
    return {
      slug: form.slug.trim(),
      bankId: Number(form.bankId),
      category: form.category.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      officialSourceUrl: form.officialSourceUrl.trim() || null,
    };
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(createForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create product" : result.error?.message ?? "Unable to create product");
      return;
    }

    setCreateForm(emptyForm);
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/products/${id}`, { method: "GET" });
    const result = await parseResponse<ProductDetailItem>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load product details" : result.error?.message ?? "Unable to load product details");
      return;
    }

    setEditingId(id);
    setEditForm({
      slug: result.data.slug,
      bankId: String(result.data.bankId),
      category: result.data.category,
      name: result.data.name ?? "",
      description: result.data.description ?? "",
      officialSourceUrl: result.data.officialSourceUrl ?? "",
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const response = await fetch(`/api/products/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update product" : result.error?.message ?? "Unable to update product");
      return;
    }

    setEditingId(null);
    setEditForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm("Delete this product?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete product" : result.error?.message ?? "Unable to delete product");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--foreground)]">Products</h1>
      <p className="mt-2 text-[var(--text-muted)]">Create, edit, and delete products linked to banks.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Create Product</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Slug"
            value={createForm.slug}
            onChange={(e) => onChange(setCreateForm, "slug", e.target.value)}
            required
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Product name"
            value={createForm.name}
            onChange={(e) => onChange(setCreateForm, "name", e.target.value)}
            required
          />
          <select
            className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]"
            value={createForm.bankId}
            onChange={(e) => onChange(setCreateForm, "bankId", e.target.value)}
            required
          >
            <option value="">Select bank</option>
            {bankOptions.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Category"
            value={createForm.category}
            onChange={(e) => onChange(setCreateForm, "category", e.target.value)}
            required
          />
        </div>

        <textarea
          className="mt-3 min-h-24 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
          placeholder="Description"
          value={createForm.description}
          onChange={(e) => onChange(setCreateForm, "description", e.target.value)}
          required
        />

        <input
          className="mt-3 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
          placeholder="Official source URL (optional)"
          value={createForm.officialSourceUrl}
          onChange={(e) => onChange(setCreateForm, "officialSourceUrl", e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Create Product"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Bank</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.id}</td>
                <td className="px-3 py-2 text-[var(--foreground)]">{row.name ?? row.slug}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.bankName ?? "-"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.category}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row.id)}
                      disabled={loadingId === row.id || submitting}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
                    >
                      {loadingId === row.id ? "Loading..." : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={loadingId === row.id || submitting}
                      className="rounded border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      Delete
                    </button>
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
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Edit Product #{editingId}</h2>
            <button type="button" className="text-sm font-semibold text-[var(--text-muted)]" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="Slug"
              value={editForm.slug}
              onChange={(e) => onChange(setEditForm, "slug", e.target.value)}
              required
            />
            <input
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="Product name"
              value={editForm.name}
              onChange={(e) => onChange(setEditForm, "name", e.target.value)}
              required
            />
            <select
              className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]"
              value={editForm.bankId}
              onChange={(e) => onChange(setEditForm, "bankId", e.target.value)}
              required
            >
              <option value="">Select bank</option>
              {bankOptions.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="Category"
              value={editForm.category}
              onChange={(e) => onChange(setEditForm, "category", e.target.value)}
              required
            />
          </div>

          <textarea
            className="mt-3 min-h-24 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder="Description"
            value={editForm.description}
            onChange={(e) => onChange(setEditForm, "description", e.target.value)}
            required
          />

          <input
            className="mt-3 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder="Official source URL (optional)"
            value={editForm.officialSourceUrl}
            onChange={(e) => onChange(setEditForm, "officialSourceUrl", e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
