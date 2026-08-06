"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type JobListItem = {
  id: number;
  title: string | null;
  organization: string;
  employmentType: string;
  status: string;
  applicationDeadline: string;
};

type JobDetailItem = {
  id: number;
  slug: string;
  title: string | null;
  organization: string;
  location: string;
  employmentType: string;
  applicationDeadline: string;
  officialApplicationUrl: string;
  description: string | null;
};

type JobFormState = {
  slug: string;
  title: string;
  organization: string;
  location: string;
  employmentType: string;
  applicationDeadline: string;
  description: string;
  officialApplicationUrl: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

const emptyForm: JobFormState = {
  slug: "",
  title: "",
  organization: "",
  location: "",
  employmentType: "",
  applicationDeadline: "",
  description: "",
  officialApplicationUrl: "",
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

export function JobAdminManager({ initialRows }: { initialRows: JobListItem[] }) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState<JobFormState>(emptyForm);
  const [editForm, setEditForm] = useState<JobFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedRows = useMemo(
    () => [...initialRows].sort((a, b) => toSortableTimestamp(a.applicationDeadline) - toSortableTimestamp(b.applicationDeadline)),
    [initialRows]
  );

  function onChange(
    setter: React.Dispatch<React.SetStateAction<JobFormState>>,
    key: keyof JobFormState,
    value: string
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  function toPayload(form: JobFormState) {
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      organization: form.organization.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType.trim(),
      applicationDeadline: form.applicationDeadline,
      description: form.description.trim(),
      officialApplicationUrl: form.officialApplicationUrl.trim(),
    };
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(createForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create job" : result.error?.message ?? "Unable to create job");
      return;
    }

    setCreateForm(emptyForm);
    router.refresh();
  }

  async function startEdit(id: number) {
    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/jobs/${id}`, { method: "GET" });
    const result = await parseResponse<JobDetailItem>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load job details" : result.error?.message ?? "Unable to load job details");
      return;
    }

    setEditingId(id);
    setEditForm({
      slug: result.data.slug,
      title: result.data.title ?? "",
      organization: result.data.organization,
      location: result.data.location,
      employmentType: result.data.employmentType,
      applicationDeadline: toDateInputValue(result.data.applicationDeadline),
      description: result.data.description ?? "",
      officialApplicationUrl: result.data.officialApplicationUrl,
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setError(null);
    setSubmitting(true);

    const response = await fetch(`/api/jobs/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to update job" : result.error?.message ?? "Unable to update job");
      return;
    }

    setEditingId(null);
    setEditForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm("Delete this job?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete job" : result.error?.message ?? "Unable to delete job");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[#0A2342]">Jobs</h1>
      <p className="mt-2 text-slate-600">Create, edit, and delete job opportunities.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Create Job</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Slug" value={createForm.slug} onChange={(e) => onChange(setCreateForm, "slug", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Title" value={createForm.title} onChange={(e) => onChange(setCreateForm, "title", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Organization" value={createForm.organization} onChange={(e) => onChange(setCreateForm, "organization", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Location" value={createForm.location} onChange={(e) => onChange(setCreateForm, "location", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Employment type" value={createForm.employmentType} onChange={(e) => onChange(setCreateForm, "employmentType", e.target.value)} required />
          <input className="rounded border border-slate-300 px-3 py-2" type="date" value={createForm.applicationDeadline} onChange={(e) => onChange(setCreateForm, "applicationDeadline", e.target.value)} required />
        </div>

        <textarea className="mt-3 min-h-24 w-full rounded border border-slate-300 px-3 py-2" placeholder="Description" value={createForm.description} onChange={(e) => onChange(setCreateForm, "description", e.target.value)} required />
        <input className="mt-3 w-full rounded border border-slate-300 px-3 py-2" placeholder="Official application URL" value={createForm.officialApplicationUrl} onChange={(e) => onChange(setCreateForm, "officialApplicationUrl", e.target.value)} required />

        <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Create Job"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Organization</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Deadline</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">{row.id}</td>
                <td className="px-3 py-2 text-slate-900">{row.title ?? `Job #${row.id}`}</td>
                <td className="px-3 py-2 text-slate-700">{row.organization}</td>
                <td className="px-3 py-2 text-slate-700">{row.employmentType}</td>
                <td className="px-3 py-2 text-slate-700">{toDateInputValue(row.applicationDeadline)}</td>
                <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{row.status}</span></td>
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
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Edit Job #{editingId}</h2>
            <button type="button" className="text-sm font-semibold text-slate-600" onClick={() => setEditingId(null)}>Cancel</button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Slug" value={editForm.slug} onChange={(e) => onChange(setEditForm, "slug", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Title" value={editForm.title} onChange={(e) => onChange(setEditForm, "title", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Organization" value={editForm.organization} onChange={(e) => onChange(setEditForm, "organization", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Location" value={editForm.location} onChange={(e) => onChange(setEditForm, "location", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Employment type" value={editForm.employmentType} onChange={(e) => onChange(setEditForm, "employmentType", e.target.value)} required />
            <input className="rounded border border-slate-300 px-3 py-2" type="date" value={editForm.applicationDeadline} onChange={(e) => onChange(setEditForm, "applicationDeadline", e.target.value)} required />
          </div>

          <textarea className="mt-3 min-h-24 w-full rounded border border-slate-300 px-3 py-2" placeholder="Description" value={editForm.description} onChange={(e) => onChange(setEditForm, "description", e.target.value)} required />
          <input className="mt-3 w-full rounded border border-slate-300 px-3 py-2" placeholder="Official application URL" value={editForm.officialApplicationUrl} onChange={(e) => onChange(setEditForm, "officialApplicationUrl", e.target.value)} required />

          <button type="submit" disabled={submitting} className="mt-4 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
