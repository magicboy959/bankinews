"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  rateCount: number;
  latestRateDate: string | null;
};

type FilterState = {
  q: string;
  sourceType: string;
  active: string;
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

const pageSize = 20;

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 10);
}

function toSortableTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function trustBadgeClass(tier: SourceTrustTier): string {
  if (tier === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tier === "medium") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
  if (tier === "low") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-300 bg-slate-100 text-slate-700";
}

export function RateSourceAdminManager({
  initialSources,
  totalCount,
  currentPage,
  totalPages,
  filters,
}: {
  initialSources: RateSourceItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: FilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(filters.q);
  const [sourceType, setSourceType] = useState(filters.sourceType);
  const [active, setActive] = useState(filters.active);
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [sourceSubmitting, setSourceSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState<SourceFormState>({
    trustTier: "unverified",
    trustScore: "50",
    lastVerifiedAt: "",
    isActive: true,
  });

  const sortedSources = useMemo(
    () => [...initialSources].sort((a, b) => toSortableTimestamp(b.updatedAt) - toSortableTimestamp(a.updatedAt)),
    [initialSources]
  );

  function buildNextUrl(nextPage?: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (sourceType && sourceType !== "all") {
      params.set("type", sourceType);
    } else {
      params.delete("type");
    }

    if (active && active !== "all") {
      params.set("active", active);
    } else {
      params.delete("active");
    }

    if (nextPage && nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
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
          <h1 className="text-2xl font-black text-[#0A2342]">Rate Sources</h1>
          <p className="mt-2 text-slate-600">
            Search, filter, and update trust settings for exchange-rate sources.
          </p>
        </div>
        <a
          href="/admin/exchange-rates"
          className="inline-flex w-fit items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Exchange Rates
        </a>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          router.push(buildNextUrl(1));
        }}
        className="mt-6 rounded-lg border border-slate-200 p-4"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Search sources"
          />
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="bank">Bank</option>
            <option value="exchange_company">Exchange Company</option>
            <option value="central_bank">Central Bank</option>
            <option value="other">Other</option>
          </select>
          <select
            value={active}
            onChange={(event) => setActive(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white">
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSourceType("all");
                setActive("all");
                router.push(pathname);
              }}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <p>
          Showing {sortedSources.length} of {totalCount} sources
        </p>
        <p>
          Page {currentPage} of {totalPages || 1}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Rates</th>
              <th className="px-3 py-2 font-semibold">Latest Rate</th>
              <th className="px-3 py-2 font-semibold">Trust</th>
              <th className="px-3 py-2 font-semibold">Score</th>
              <th className="px-3 py-2 font-semibold">Verified</th>
              <th className="px-3 py-2 font-semibold">Active</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSources.map((source) => (
              <tr key={source.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-800">{source.name}</td>
                <td className="px-3 py-2 text-slate-600">{source.sourceType}</td>
                <td className="px-3 py-2 text-slate-600">{source.rateCount}</td>
                <td className="px-3 py-2 text-slate-600">{toDateInputValue(source.latestRateDate)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${trustBadgeClass(source.trustTier)}`}>
                    {source.trustTier}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{source.trustScore}</td>
                <td className="px-3 py-2 text-slate-600">{source.lastVerifiedAt ?? "-"}</td>
                <td className="px-3 py-2 text-slate-600">{source.isActive ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => startSourceEdit(source)}
                    disabled={sourceSubmitting}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => router.push(buildNextUrl(currentPage - 1))}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => router.push(buildNextUrl(currentPage + 1))}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {editingSourceId && (
        <form onSubmit={handleSourceUpdate} className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Edit Source #{editingSourceId}</h3>
            <button type="button" onClick={() => setEditingSourceId(null)} className="text-xs font-semibold text-slate-600">
              Cancel
            </button>
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

            <label className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sourceForm.isActive}
                onChange={(event) => setSourceForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active on website
            </label>
          </div>

          <button
            type="submit"
            disabled={sourceSubmitting}
            className="mt-3 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sourceSubmitting ? "Saving..." : "Save Source Trust"}
          </button>
        </form>
      )}
    </div>
  );
}
