"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RateListItem = {
  id: number;
  currencyName: string;
  currencyCode: string;
  officialBuy: number | null;
  officialSell: number | null;
  parallelBuy: number | null;
  parallelSell: number | null;
  rateDate: string;
  source: string;
  notes: string | null;
};

type RateFormState = {
  currencyName: string;
  currencyCode: string;
  officialBuy: string;
  officialSell: string;
  parallelBuy: string;
  parallelSell: string;
  rateDate: string;
  source: string;
  notes: string;
};

type SourceTrustTier = "high" | "medium" | "low" | "unverified";

type RateSourceItem = {
  id: number;
  name: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  isActive: boolean;
  trustTier: SourceTrustTier;
  trustScore: number;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

type SourceFormState = {
  trustTier: SourceTrustTier;
  trustScore: string;
  lastVerifiedAt: string;
  isActive: boolean;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

const emptyForm: RateFormState = {
  currencyName: "",
  currencyCode: "",
  officialBuy: "",
  officialSell: "",
  parallelBuy: "",
  parallelSell: "",
  rateDate: "",
  source: "",
  notes: "",
};

function toDateInputValue(value: string): string {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 10);
}

function toSortableTimestamp(value: string): number {
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return Number(trimmed);
}

export function ExchangeRateAdminManager({
  initialRows,
  initialSources,
}: {
  initialRows: RateListItem[];
  initialSources: RateSourceItem[];
}) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<RateFormState>(emptyForm);
  const [editForm, setEditForm] = useState<RateFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [sourceSubmitting, setSourceSubmitting] = useState(false);
  const [sourceForm, setSourceForm] = useState<SourceFormState>({
    trustTier: "unverified",
    trustScore: "50",
    lastVerifiedAt: "",
    isActive: true,
  });

  const sortedRows = useMemo(
    () => [...initialRows].sort((a, b) => toSortableTimestamp(b.rateDate) - toSortableTimestamp(a.rateDate)),
    [initialRows]
  );

  const sortedSources = useMemo(
    () => [...initialSources].sort((a, b) => toSortableTimestamp(b.updatedAt) - toSortableTimestamp(a.updatedAt)),
    [initialSources]
  );

  function onChange(
    setter: React.Dispatch<React.SetStateAction<RateFormState>>,
    key: keyof RateFormState,
    value: string
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  function toPayload(form: RateFormState) {
    return {
      currencyName: form.currencyName.trim(),
      currencyCode: form.currencyCode.trim().toUpperCase(),
      officialBuy: parseNullableNumber(form.officialBuy),
      officialSell: parseNullableNumber(form.officialSell),
      parallelBuy: parseNullableNumber(form.parallelBuy),
      parallelSell: parseNullableNumber(form.parallelSell),
      rateDate: form.rateDate,
      source: form.source.trim(),
      notes: form.notes.trim() || null,
    };
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/exchange-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(createForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create rate" : result.error?.message ?? "Unable to create rate");
      return;
    }

    setCreateForm(emptyForm);
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/exchange-rates/${id}`, { method: "GET" });
    const result = await parseResponse<RateListItem>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load rate details" : result.error?.message ?? "Unable to load rate details");
      return;
    }

    setEditingId(id);
    setEditForm({
      currencyName: result.data.currencyName,
      currencyCode: result.data.currencyCode,
      officialBuy: result.data.officialBuy?.toString() ?? "",
      officialSell: result.data.officialSell?.toString() ?? "",
      parallelBuy: result.data.parallelBuy?.toString() ?? "",
      parallelSell: result.data.parallelSell?.toString() ?? "",
      rateDate: toDateInputValue(result.data.rateDate),
      source: result.data.source,
      notes: result.data.notes ?? "",
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const response = await fetch(`/api/exchange-rates/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update rate" : result.error?.message ?? "Unable to update rate");
      return;
    }

    setEditingId(null);
    setEditForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm("Delete this exchange rate entry?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/exchange-rates/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete rate" : result.error?.message ?? "Unable to delete rate");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    router.refresh();
  }

  function startSourceEdit(source: RateSourceItem) {
    setEditingSourceId(source.id);
    setSourceForm({
      trustTier: source.trustTier,
      trustScore: String(source.trustScore),
      lastVerifiedAt: source.lastVerifiedAt ?? "",
      isActive: source.isActive,
    });
  }

  async function handleSourceUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSourceId) {
      return;
    }

    const parsedScore = Number(sourceForm.trustScore);
    if (!Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setError("Trust score must be an integer between 0 and 100");
      return;
    }

    setError(null);
    setSourceSubmitting(true);

    const response = await fetch(`/api/exchange-rates/sources/${editingSourceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trustTier: sourceForm.trustTier,
        trustScore: parsedScore,
        lastVerifiedAt: sourceForm.lastVerifiedAt || null,
        isActive: sourceForm.isActive,
      }),
    });

    const result = await parseResponse<{ id: number; updated: boolean }>(response);
    setSourceSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update source trust settings" : result.error?.message ?? "Unable to update source trust settings");
      return;
    }

    setEditingSourceId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">Exchange Rates</h1>
          <p className="mt-2 text-[var(--text-muted)]">Create, edit, and delete stored exchange rates.</p>
        </div>
        <Link
          href="/admin/exchange-rates/sources"
          className="inline-flex w-fit items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
        >
          Manage Sources
        </Link>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Create Rate</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Currency name" value={createForm.currencyName} onChange={(e) => onChange(setCreateForm, "currencyName", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Currency code" maxLength={3} value={createForm.currencyCode} onChange={(e) => onChange(setCreateForm, "currencyCode", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" type="date" value={createForm.rateDate} onChange={(e) => onChange(setCreateForm, "rateDate", e.target.value)} required />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Official buy" value={createForm.officialBuy} onChange={(e) => onChange(setCreateForm, "officialBuy", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Official sell" value={createForm.officialSell} onChange={(e) => onChange(setCreateForm, "officialSell", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Parallel buy" value={createForm.parallelBuy} onChange={(e) => onChange(setCreateForm, "parallelBuy", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Parallel sell" value={createForm.parallelSell} onChange={(e) => onChange(setCreateForm, "parallelSell", e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)] md:col-span-2" placeholder="Source" value={createForm.source} onChange={(e) => onChange(setCreateForm, "source", e.target.value)} required />
        </div>

        <textarea className="mt-3 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Notes (optional)" value={createForm.notes} onChange={(e) => onChange(setCreateForm, "notes", e.target.value)} />

        <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Create Rate"}
        </button>
      </form>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Source Trust Controls</h2>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">Manage source visibility and trust metadata used on compare and trend pages.</p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Trust Tier</th>
                <th className="px-3 py-2 font-semibold">Trust Score</th>
                <th className="px-3 py-2 font-semibold">Verified</th>
                <th className="px-3 py-2 font-semibold">Active</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source) => (
                <tr key={source.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 font-semibold text-[var(--foreground)]">{source.name}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{source.sourceType}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{source.trustTier}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{source.trustScore}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{source.lastVerifiedAt ?? "-"}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{source.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => startSourceEdit(source)}
                      disabled={sourceSubmitting}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
                    >
                      Edit Trust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingSourceId && (
          <form onSubmit={handleSourceUpdate} className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-strong)] p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Edit Source #{editingSourceId}</h3>
              <button type="button" onClick={() => setEditingSourceId(null)} className="text-xs font-semibold text-[var(--text-muted)]">Cancel</button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <select
                value={sourceForm.trustTier}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, trustTier: event.target.value as SourceTrustTier }))}
                className="rounded border border-slate-300 px-3 py-2"
              >
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
                <option value="unverified">unverified</option>
              </select>

              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={sourceForm.trustScore}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, trustScore: event.target.value }))}
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="Trust score 0-100"
              />

              <input
                type="date"
                value={sourceForm.lastVerifiedAt}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, lastVerifiedAt: event.target.value }))}
                className="rounded border border-slate-300 px-3 py-2"
              />

              <label className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={sourceForm.isActive}
                  onChange={(event) => setSourceForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active on website
              </label>
            </div>

            <button type="submit" disabled={sourceSubmitting} className="mt-3 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {sourceSubmitting ? "Saving..." : "Save Source Trust"}
            </button>
          </form>
        )}
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Currency</th>
              <th className="px-3 py-2 font-semibold">Code</th>
              <th className="px-3 py-2 font-semibold">Official Buy</th>
              <th className="px-3 py-2 font-semibold">Official Sell</th>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.id}</td>
                <td className="px-3 py-2 text-[var(--foreground)]">{row.currencyName}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.currencyCode}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.officialBuy ?? "-"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{row.officialSell ?? "-"}</td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{toDateInputValue(row.rateDate)}</td>
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
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Edit Rate #{editingId}</h2>
            <button type="button" className="text-sm font-semibold text-[var(--text-muted)]" onClick={() => setEditingId(null)}>Cancel</button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Currency name" value={editForm.currencyName} onChange={(e) => onChange(setEditForm, "currencyName", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Currency code" maxLength={3} value={editForm.currencyCode} onChange={(e) => onChange(setEditForm, "currencyCode", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]" type="date" value={editForm.rateDate} onChange={(e) => onChange(setEditForm, "rateDate", e.target.value)} required />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Official buy" value={editForm.officialBuy} onChange={(e) => onChange(setEditForm, "officialBuy", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Official sell" value={editForm.officialSell} onChange={(e) => onChange(setEditForm, "officialSell", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Parallel buy" value={editForm.parallelBuy} onChange={(e) => onChange(setEditForm, "parallelBuy", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" type="number" step="0.000001" placeholder="Parallel sell" value={editForm.parallelSell} onChange={(e) => onChange(setEditForm, "parallelSell", e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)] md:col-span-2" placeholder="Source" value={editForm.source} onChange={(e) => onChange(setEditForm, "source", e.target.value)} required />
          </div>

          <textarea className="mt-3 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]" placeholder="Notes (optional)" value={editForm.notes} onChange={(e) => onChange(setEditForm, "notes", e.target.value)} />

          <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
