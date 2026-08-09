"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BankListItem = {
  id: number;
  slug: string;
  name: string;
  headquarters: string | null;
  swiftCode: string | null;
  showOnWebsite: number | boolean;
  updatedAt: string;
};

type BankDetailItem = {
  id: number;
  slug: string;
  name: string | null;
  shortDescription: string | null;
  officialWebsite: string | null;
  headquarters: string | null;
  swiftCode: string | null;
  showOnWebsite: number | boolean;
};

type BankFormState = {
  slug: string;
  name: string;
  shortDescription: string;
  officialWebsite: string;
  headquarters: string;
  swiftCode: string;
  showOnWebsite: boolean;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

const emptyForm: BankFormState = {
  slug: "",
  name: "",
  shortDescription: "",
  officialWebsite: "",
  headquarters: "",
  swiftCode: "",
  showOnWebsite: true,
};

export function BankAdminManager({ initialRows }: { initialRows: BankListItem[] }) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<BankFormState>(emptyForm);
  const [editForm, setEditForm] = useState<BankFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const sortedRows = useMemo(
    () => [...initialRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [initialRows]
  );

  function onChange(
    setter: React.Dispatch<React.SetStateAction<BankFormState>>,
    key: keyof BankFormState,
    value: string | boolean
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  function toPayload(form: BankFormState) {
    return {
      slug: form.slug.trim(),
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      officialWebsite: form.officialWebsite.trim() || null,
      headquarters: form.headquarters.trim() || null,
      swiftCode: form.swiftCode.trim() || null,
      showOnWebsite: form.showOnWebsite,
    };
  }

  async function fillCreateWithAi() {
    setAiError(null);
    const prompt = aiPrompt.trim();
    if (prompt.length < 12) {
      setAiError("Describe the bank details first.");
      return;
    }

    setAiGenerating(true);
    const response = await fetch("/api/admin/ai/data-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "bank", prompt }),
    });
    const result = await parseResponse<Partial<BankFormState>>(response);
    setAiGenerating(false);

    if (!response.ok || !result.ok) {
      setAiError(result.ok ? "Unable to fill bank fields" : result.error?.message ?? "Unable to fill bank fields");
      return;
    }

    setCreateForm((prev) => ({ ...prev, ...result.data, showOnWebsite: prev.showOnWebsite }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(createForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create bank" : result.error?.message ?? "Unable to create bank");
      return;
    }

    setCreateForm(emptyForm);
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/banks/${id}`, { method: "GET" });
    const result = await parseResponse<BankDetailItem>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load bank details" : result.error?.message ?? "Unable to load bank details");
      return;
    }

    setEditingId(id);
    setEditForm({
      slug: result.data.slug,
      name: result.data.name ?? "",
      shortDescription: result.data.shortDescription ?? "",
      officialWebsite: result.data.officialWebsite ?? "",
      headquarters: result.data.headquarters ?? "",
      swiftCode: result.data.swiftCode ?? "",
      showOnWebsite: Boolean(result.data.showOnWebsite),
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const response = await fetch(`/api/banks/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update bank" : result.error?.message ?? "Unable to update bank");
      return;
    }

    setEditingId(null);
    setEditForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm("Delete this bank?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/banks/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete bank" : result.error?.message ?? "Unable to delete bank");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--foreground)]">Banks</h1>
      <p className="mt-2 text-[var(--text-muted)]">Create, edit, and delete bank profiles.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Create Bank</h2>
        <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Google AI data entry</p>
          <textarea
            className="mt-2 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder="Paste bank facts, official website, headquarters, SWIFT code, and short description..."
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
          />
          <button type="button" onClick={fillCreateWithAi} disabled={aiGenerating} className="mt-2 rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {aiGenerating ? "Filling..." : "Fill bank fields"}
          </button>
          {aiError ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{aiError}</p> : null}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Slug" value={createForm.slug} onChange={(e) => onChange(setCreateForm, "slug", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Name" value={createForm.name} onChange={(e) => onChange(setCreateForm, "name", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Official website (optional)" value={createForm.officialWebsite} onChange={(e) => onChange(setCreateForm, "officialWebsite", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Headquarters (optional)" value={createForm.headquarters} onChange={(e) => onChange(setCreateForm, "headquarters", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="SWIFT code (optional)" value={createForm.swiftCode} onChange={(e) => onChange(setCreateForm, "swiftCode", e.target.value)} />
        </div>
        <textarea className="mt-3 min-h-24 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Short description" value={createForm.shortDescription} onChange={(e) => onChange(setCreateForm, "shortDescription", e.target.value)} required />
        <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input type="checkbox" checked={createForm.showOnWebsite} onChange={(e) => onChange(setCreateForm, "showOnWebsite", e.target.checked)} />
          <span>Show on website</span>
        </label>

        <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Create Bank"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Slug</th>
              <th className="px-3 py-2 font-semibold">HQ</th>
              <th className="px-3 py-2 font-semibold">SWIFT</th>
              <th className="px-3 py-2 font-semibold">Website</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.id}</td>
                <td className="px-3 py-2 text-[var(--foreground)]">{row.name}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.slug}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.headquarters ?? "-"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.swiftCode ?? "-"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">
                  {Boolean(row.showOnWebsite) ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Visible</span> : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Hidden</span>}
                </td>
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
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Edit Bank #{editingId}</h2>
            <button type="button" className="text-sm font-semibold text-[var(--text-muted)]" onClick={() => setEditingId(null)}>Cancel</button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Slug" value={editForm.slug} onChange={(e) => onChange(setEditForm, "slug", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Name" value={editForm.name} onChange={(e) => onChange(setEditForm, "name", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Official website (optional)" value={editForm.officialWebsite} onChange={(e) => onChange(setEditForm, "officialWebsite", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Headquarters (optional)" value={editForm.headquarters} onChange={(e) => onChange(setEditForm, "headquarters", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="SWIFT code (optional)" value={editForm.swiftCode} onChange={(e) => onChange(setEditForm, "swiftCode", e.target.value)} />
          </div>
          <textarea className="mt-3 min-h-24 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Short description" value={editForm.shortDescription} onChange={(e) => onChange(setEditForm, "shortDescription", e.target.value)} required />
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input type="checkbox" checked={editForm.showOnWebsite} onChange={(e) => onChange(setEditForm, "showOnWebsite", e.target.checked)} />
            <span>Show on website</span>
          </label>

          <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
