"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SettingItem = {
  id: number;
  settingKey: string;
  settingValue: unknown;
  updatedAt: string;
};

type SectionItem = {
  id: number;
  sectionKey: string;
  enabled: number | boolean;
  sortOrder: number;
  configJson: unknown;
};

type SettingForm = {
  settingKey: string;
  settingValue: string;
};

type SectionForm = {
  sectionKey: string;
  enabled: boolean;
  sortOrder: string;
  configJson: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

type SocialPlatform = "facebook" | "x" | "linkedin" | "instagram" | "youtube";

type SocialLinkDraft = {
  platform: SocialPlatform;
  href: string;
};

const socialPlatformOptions: Array<{ value: SocialPlatform; label: string }> = [
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
];

const socialLinksPresetRows: SocialLinkDraft[] = [
  { platform: "linkedin", href: "https://linkedin.com/company/example" },
  { platform: "x", href: "https://x.com/example" },
  { platform: "facebook", href: "https://facebook.com/example" },
  { platform: "instagram", href: "https://instagram.com/example" },
];

const emptySettingForm: SettingForm = {
  settingKey: "",
  settingValue: "{}",
};

const emptySectionForm: SectionForm = {
  sectionKey: "",
  enabled: true,
  sortOrder: "0",
  configJson: "{}",
};

function socialDraftToJson(rows: SocialLinkDraft[]): string {
  return JSON.stringify(
    {
      links: rows
        .filter((item) => item.href.trim())
        .map((item) => ({ label: item.platform, href: item.href.trim() })),
    },
    null,
    2
  );
}

function toPlatformLabel(value: string): SocialPlatform {
  const lower = value.trim().toLowerCase();
  if (lower === "fb" || lower.includes("facebook")) return "facebook";
  if (lower === "x" || lower.includes("twitter")) return "x";
  if (lower === "in" || lower.includes("linkedin")) return "linkedin";
  if (lower === "ig" || lower.includes("instagram")) return "instagram";
  return "youtube";
}

function parseSocialRows(value: unknown): SocialLinkDraft[] {
  const normalized = typeof value === "string" ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  })() : value;

  if (!normalized || typeof normalized !== "object" || !Array.isArray((normalized as { links?: unknown[] }).links)) {
    return [];
  }

  return (normalized as { links: Array<{ label?: string; href?: string }> }).links
    .map((item) => ({
      platform: toPlatformLabel(item.label ?? ""),
      href: item.href?.trim() ?? "",
    }))
    .filter((item) => item.href.length > 0);
}

const socialLinksPreset = socialDraftToJson(socialLinksPresetRows);

function prettyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "{}";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function truthy(value: number | boolean): boolean {
  return value === true || value === 1;
}

export function SettingsAdminManager({
  initialSettings,
  initialSections,
}: {
  initialSettings: SettingItem[];
  initialSections: SectionItem[];
}) {
  const router = useRouter();

  const [settingForm, setSettingForm] = useState<SettingForm>(emptySettingForm);
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySectionForm);
  const [editingSettingId, setEditingSettingId] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLinksDraft, setSocialLinksDraft] = useState<SocialLinkDraft[]>(socialLinksPresetRows);

  const sortedSettings = useMemo(
    () => [...initialSettings].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [initialSettings]
  );

  const sortedSections = useMemo(
    () => [...initialSections].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [initialSections]
  );

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  function resetSettingForm() {
    setEditingSettingId(null);
    setSettingForm(emptySettingForm);
    setSocialLinksDraft(socialLinksPresetRows);
  }

  function useSocialLinksPreset() {
    setEditingSettingId(null);
    setSocialLinksDraft(socialLinksPresetRows);
    setSettingForm({
      settingKey: "social_links",
      settingValue: socialLinksPreset,
    });
  }

  function addSocialLinkRow() {
    setSettingForm((prev) => ({ ...prev, settingKey: "social_links" }));
    setSocialLinksDraft((prev) => [...prev, { platform: "instagram", href: "" }]);
  }

  function importSocialRowsFromJson() {
    const rows = parseSocialRows(settingForm.settingValue);
    if (!rows.length) {
      setError("No social links found in JSON. Expected { links: [{ label, href }] }.");
      return;
    }
    setError(null);
    setSettingForm((prev) => ({ ...prev, settingKey: "social_links" }));
    setSocialLinksDraft(rows);
  }

  useEffect(() => {
    if (settingForm.settingKey.trim() !== "social_links") {
      return;
    }

    const nextValue = socialDraftToJson(socialLinksDraft);
    setSettingForm((prev) => ({ ...prev, settingValue: nextValue }));
  }, [settingForm.settingKey, socialLinksDraft]);

  function resetSectionForm() {
    setEditingSectionId(null);
    setSectionForm(emptySectionForm);
  }

  async function submitSetting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    let parsed: unknown;
    try {
      parsed = JSON.parse(settingForm.settingValue);
    } catch {
      setSubmitting(false);
      setError("Setting value must be valid JSON.");
      return;
    }

    const isEdit = editingSettingId !== null;
    const endpoint = isEdit ? `/api/admin/settings/${editingSettingId}` : "/api/admin/settings";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settingKey: settingForm.settingKey.trim(),
        settingValue: parsed,
      }),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to save setting" : result.error?.message ?? "Unable to save setting");
      return;
    }

    resetSettingForm();
    router.refresh();
  }

  async function editSetting(id: number) {
    setError(null);
    setLoadingKey(`setting-${id}`);

    const response = await fetch(`/api/admin/settings/${id}`, { method: "GET" });
    const result = await parseResponse<SettingItem>(response);
    setLoadingKey(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load setting" : result.error?.message ?? "Unable to load setting");
      return;
    }

    setEditingSettingId(id);
    setSettingForm({
      settingKey: result.data.settingKey,
      settingValue: prettyJson(result.data.settingValue),
    });

    if (result.data.settingKey === "social_links") {
      const rows = parseSocialRows(result.data.settingValue);
      if (rows.length) {
        setSocialLinksDraft(rows);
      }
    }
  }

  async function deleteSetting(id: number) {
    const shouldDelete = window.confirm("Delete this setting?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingKey(`setting-${id}`);

    const response = await fetch(`/api/admin/settings/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingKey(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete setting" : result.error?.message ?? "Unable to delete setting");
      return;
    }

    if (editingSettingId === id) {
      resetSettingForm();
    }

    router.refresh();
  }

  async function submitSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    let parsed: unknown;
    try {
      parsed = JSON.parse(sectionForm.configJson);
    } catch {
      setSubmitting(false);
      setError("Section config must be valid JSON.");
      return;
    }

    const isEdit = editingSectionId !== null;
    const endpoint = isEdit ? `/api/homepage/sections/${editingSectionId}` : "/api/homepage/sections";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionKey: sectionForm.sectionKey.trim(),
        enabled: sectionForm.enabled,
        sortOrder: Number(sectionForm.sortOrder),
        configJson: parsed,
      }),
    });

    const result = await parseResponse<{ id: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to save section" : result.error?.message ?? "Unable to save section");
      return;
    }

    resetSectionForm();
    router.refresh();
  }

  async function editSection(id: number) {
    setError(null);
    setLoadingKey(`section-${id}`);

    const response = await fetch(`/api/homepage/sections/${id}`, { method: "GET" });
    const result = await parseResponse<SectionItem>(response);
    setLoadingKey(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load section" : result.error?.message ?? "Unable to load section");
      return;
    }

    setEditingSectionId(id);
    setSectionForm({
      sectionKey: result.data.sectionKey,
      enabled: truthy(result.data.enabled),
      sortOrder: String(result.data.sortOrder),
      configJson: prettyJson(result.data.configJson),
    });
  }

  async function deleteSection(id: number) {
    const shouldDelete = window.confirm("Delete this homepage section?");
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingKey(`section-${id}`);

    const response = await fetch(`/api/homepage/sections/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean }>(response);
    setLoadingKey(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to delete section" : result.error?.message ?? "Unable to delete section");
      return;
    }

    if (editingSectionId === id) {
      resetSectionForm();
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[#0A2342]">Settings</h1>
      <p className="mt-2 text-slate-600">Manage JSON settings and homepage sections.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Settings Store</h2>
            {editingSettingId && (
              <button type="button" onClick={resetSettingForm} className="text-sm font-semibold text-slate-600">
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Header Social Links</p>
                <p className="mt-1 text-sm text-slate-600">
                  Add the links shown next to search in the website header.
                </p>
              </div>
              <button
                type="button"
                onClick={useSocialLinksPreset}
                className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white"
              >
                Use Social Links Template
              </button>
            </div>

            <div className="mt-3 rounded-md border border-cyan-300 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Visual Social Links Builder</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addSocialLinkRow}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={importSocialRowsFromJson}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Import From JSON
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {socialLinksDraft.map((item, index) => (
                  <div key={`social-row-${index}`} className="grid gap-2 md:grid-cols-[170px_1fr_auto]">
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-2 text-sm"
                      value={item.platform}
                      onChange={(e) =>
                        setSocialLinksDraft((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, platform: e.target.value as SocialPlatform } : row
                          )
                        )
                      }
                    >
                      {socialPlatformOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                      placeholder="https://..."
                      value={item.href}
                      onChange={(e) =>
                        setSocialLinksDraft((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, href: e.target.value } : row
                          )
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setSocialLinksDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={submitSetting} className="mt-3">
            <input
              className="w-full rounded border border-slate-300 px-3 py-2"
              placeholder="setting_key"
              value={settingForm.settingKey}
              onChange={(e) => setSettingForm((prev) => ({ ...prev, settingKey: e.target.value }))}
              required
            />
            <textarea
              className="mt-3 min-h-28 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={`{\n  "key": "value"\n}`}
              value={settingForm.settingValue}
              onChange={(e) => setSettingForm((prev) => ({ ...prev, settingValue: e.target.value }))}
              required
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use setting key <span className="font-mono">social_links</span> to control the header social profiles shown next to search.
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100">{socialLinksPreset}</pre>
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingSettingId ? "Save Setting" : "Create Setting"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {sortedSettings.length === 0 ? (
              <p className="text-sm text-slate-500">No settings found.</p>
            ) : (
              sortedSettings.map((row) => (
                <div key={row.id} className="rounded border border-slate-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.settingKey}</p>
                      <p className="text-xs text-slate-500">Updated: {new Date(row.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                        onClick={() => editSetting(row.id)}
                        disabled={submitting || loadingKey === `setting-${row.id}`}
                      >
                        {loadingKey === `setting-${row.id}` ? "Loading..." : "Edit"}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                        onClick={() => deleteSetting(row.id)}
                        disabled={submitting || loadingKey === `setting-${row.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">Homepage Sections</h2>
            {editingSectionId && (
              <button type="button" onClick={resetSectionForm} className="text-sm font-semibold text-slate-600">
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={submitSection} className="mt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="section_key"
                value={sectionForm.sectionKey}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, sectionKey: e.target.value }))}
                required
              />
              <input
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="sort_order"
                type="number"
                value={sectionForm.sortOrder}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                required
              />
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sectionForm.enabled}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              Enabled
            </label>

            <textarea
              className="mt-3 min-h-28 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={`{\n  "label": "Demo"\n}`}
              value={sectionForm.configJson}
              onChange={(e) => setSectionForm((prev) => ({ ...prev, configJson: e.target.value }))}
              required
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use section key <span className="font-mono">hero_carousel</span> for the homepage slider. The config JSON should include a
              <span className="font-mono"> slides </span>
              array with title, summary, imageUrl, and href fields.
            </p>

            <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100">{`{
  "slides": [
    {
      "id": "hero-1",
      "title": "عنوان الشريحة",
      "summary": "وصف مختصر للشريحة يظهر فوق الصورة.",
      "imageUrl": "/hero-banking-1.svg",
      "href": "/ar/news/example",
      "eyebrow": "واجهة الأخبار",
      "ctaLabel": "اقرأ المزيد"
    }
  ]
}`}</pre>

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingSectionId ? "Save Section" : "Create Section"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {sortedSections.length === 0 ? (
              <p className="text-sm text-slate-500">No homepage sections found.</p>
            ) : (
              sortedSections.map((row) => (
                <div key={row.id} className="rounded border border-slate-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.sectionKey}</p>
                      <p className="text-xs text-slate-500">Sort: {row.sortOrder} • {truthy(row.enabled) ? "enabled" : "disabled"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                        onClick={() => editSection(row.id)}
                        disabled={submitting || loadingKey === `section-${row.id}`}
                      >
                        {loadingKey === `section-${row.id}` ? "Loading..." : "Edit"}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                        onClick={() => deleteSection(row.id)}
                        disabled={submitting || loadingKey === `section-${row.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
