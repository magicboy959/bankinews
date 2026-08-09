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

type GoogleAiStatus = {
  configured: boolean;
  keyStatus: string;
  textModel: string;
  imageModel: string;
};

type AiTestResult = {
  target: string;
  model: string;
  receivedContent?: boolean;
  receivedImage?: boolean;
};

type EmailTestResult = {
  sent: boolean;
  to: string;
  locale: "ar" | "en";
};

type SocialPlatform = "facebook" | "x" | "linkedin" | "instagram" | "youtube";

type SocialLinkDraft = {
  platform: SocialPlatform;
  href: string;
};

type HeroSlideDraft = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  href: string;
  eyebrow: string;
  ctaLabel: string;
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

const heroSlidesPresetRows: HeroSlideDraft[] = [
  {
    id: "hero-1",
    title: "الخطة الاستراتيجية للقطاع المصرفي في السودان",
    summary: "واجهة رئيسية واضحة لصورة وخبر رئيسي يمكن تعديله من لوحة الإدارة.",
    imageUrl: "/hero-banking-1.svg",
    href: "/ar/news",
    eyebrow: "واجهة الأخبار",
    ctaLabel: "اقرأ المزيد",
  },
  {
    id: "hero-2",
    title: "تغطية مصرفية واقتصادية متجددة",
    summary: "استخدم هذه الشريحة لإبراز الأخبار أو التقارير المهمة على الصفحة الرئيسية.",
    imageUrl: "/hero-banking-2.svg",
    href: "/ar",
    eyebrow: "آخر الأخبار",
    ctaLabel: "تصفح الأخبار",
  },
  {
    id: "hero-3",
    title: "مساحة سهلة لتحديث الصور والروابط",
    summary: "يمكن تغيير الصورة والرابط والنص دون تعديل JSON يدويا.",
    imageUrl: "/hero-banking-3.svg",
    href: "/ar/about",
    eyebrow: "من لوحة الإدارة",
    ctaLabel: "اكتشف المزيد",
  },
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

function heroSlidesToJson(rows: HeroSlideDraft[]): string {
  return JSON.stringify(
    {
      slides: rows
        .filter((item) => item.title.trim() && item.summary.trim() && item.imageUrl.trim() && item.href.trim())
        .map((item, index) => ({
          id: item.id.trim() || `hero-${index + 1}`,
          title: item.title.trim(),
          summary: item.summary.trim(),
          imageUrl: item.imageUrl.trim(),
          href: item.href.trim(),
          eyebrow: item.eyebrow.trim() || undefined,
          ctaLabel: item.ctaLabel.trim() || undefined,
        })),
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

function parseHeroRows(value: unknown): HeroSlideDraft[] {
  const normalized = typeof value === "string" ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  })() : value;

  if (!normalized || typeof normalized !== "object" || !Array.isArray((normalized as { slides?: unknown[] }).slides)) {
    return [];
  }

  return (normalized as { slides: Array<Partial<HeroSlideDraft>> }).slides
    .map((item, index) => ({
      id: item.id?.trim() || `hero-${index + 1}`,
      title: item.title?.trim() ?? "",
      summary: item.summary?.trim() ?? "",
      imageUrl: item.imageUrl?.trim() ?? "",
      href: item.href?.trim() ?? "",
      eyebrow: item.eyebrow?.trim() ?? "",
      ctaLabel: item.ctaLabel?.trim() ?? "",
    }))
    .filter((item) => item.title || item.summary || item.imageUrl || item.href);
}

const socialLinksPreset = socialDraftToJson(socialLinksPresetRows);
const heroSlidesPreset = heroSlidesToJson(heroSlidesPresetRows);

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
  googleAiStatus,
}: {
  initialSettings: SettingItem[];
  initialSections: SectionItem[];
  googleAiStatus: GoogleAiStatus;
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
  const [heroSlidesDraft, setHeroSlidesDraft] = useState<HeroSlideDraft[]>(heroSlidesPresetRows);
  const [aiTestingTarget, setAiTestingTarget] = useState<"text" | "image" | null>(null);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [aiTestError, setAiTestError] = useState<string | null>(null);
  const [emailTestingLocale, setEmailTestingLocale] = useState<"ar" | "en" | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [emailTestError, setEmailTestError] = useState<string | null>(null);

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

  async function testGoogleAi(target: "text" | "image") {
    setAiTestError(null);
    setAiTestResult(null);
    setAiTestingTarget(target);

    const response = await fetch("/api/admin/ai/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });

    const result = await parseResponse<AiTestResult>(response);
    setAiTestingTarget(null);

    if (!response.ok || !result.ok) {
      setAiTestError(result.ok ? "Google AI test failed" : result.error?.message ?? "Google AI test failed");
      return;
    }

    const received = target === "image" ? result.data.receivedImage : result.data.receivedContent;
    setAiTestResult(`${target === "image" ? "Image" : "Text"} test reached ${result.data.model}${received ? " and returned content." : ", but no usable content was returned."}`);
  }

  async function testWelcomeEmail(locale: "ar" | "en") {
    setEmailTestError(null);
    setEmailTestResult(null);
    setEmailTestingLocale(locale);

    const response = await fetch("/api/admin/email/test-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });

    const result = await parseResponse<EmailTestResult>(response);
    setEmailTestingLocale(null);

    if (!response.ok || !result.ok) {
      setEmailTestError(result.ok ? "Welcome email test failed" : result.error?.message ?? "Welcome email test failed");
      return;
    }

    setEmailTestResult(`Sent ${result.data.locale.toUpperCase()} welcome email test to ${result.data.to}.`);
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

  function setHeroRows(nextRows: HeroSlideDraft[]) {
    setHeroSlidesDraft(nextRows);
    setSectionForm((prev) => ({
      ...prev,
      sectionKey: "hero_carousel",
      enabled: true,
      sortOrder: prev.sortOrder === "0" ? "5" : prev.sortOrder,
      configJson: heroSlidesToJson(nextRows),
    }));
  }

  function useHeroSlidesPreset() {
    setEditingSectionId(null);
    setHeroRows(heroSlidesPresetRows);
    setSectionForm({
      sectionKey: "hero_carousel",
      enabled: true,
      sortOrder: "5",
      configJson: heroSlidesPreset,
    });
  }

  function importHeroRowsFromJson() {
    const rows = parseHeroRows(sectionForm.configJson);
    if (!rows.length) {
      setError("No hero slides found in JSON. Expected { slides: [{ title, summary, imageUrl, href }] }.");
      return;
    }
    setError(null);
    setHeroRows(rows);
  }

  function updateHeroSlide(index: number, key: keyof HeroSlideDraft, value: string) {
    setHeroRows(heroSlidesDraft.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  function addHeroSlide() {
    setHeroRows([
      ...heroSlidesDraft,
      {
        id: `hero-${heroSlidesDraft.length + 1}`,
        title: "",
        summary: "",
        imageUrl: "",
        href: "/ar/news",
        eyebrow: "",
        ctaLabel: "اقرأ المزيد",
      },
    ]);
  }

  function removeHeroSlide(index: number) {
    setHeroRows(heroSlidesDraft.filter((_, rowIndex) => rowIndex !== index));
  }

  useEffect(() => {
    if (settingForm.settingKey.trim() !== "social_links") {
      return;
    }

    const updateTimer = setTimeout(() => {
      const nextValue = socialDraftToJson(socialLinksDraft);
      setSettingForm((prev) => ({ ...prev, settingValue: nextValue }));
    }, 0);

    return () => clearTimeout(updateTimer);
  }, [settingForm.settingKey, socialLinksDraft]);

  function resetSectionForm() {
    setEditingSectionId(null);
    setSectionForm(emptySectionForm);
    setHeroSlidesDraft(heroSlidesPresetRows);
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
    const heroRows = result.data.sectionKey === "hero_carousel" ? parseHeroRows(result.data.configJson) : [];
    if (heroRows.length) {
      setHeroSlidesDraft(heroRows);
    }
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
      <h1 className="text-2xl font-black text-[var(--foreground)]">Settings</h1>
      <p className="mt-2 text-[var(--text-muted)]">Manage JSON settings and homepage sections.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Google AI Diagnostics</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Verify the production Google AI key and the Gemini models used by Article Studio and Image Studio.
            </p>
          </div>
          <span
            className={`w-fit rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
              googleAiStatus.configured
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            {googleAiStatus.configured ? "Configured" : "Missing key"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)]">API key</p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{googleAiStatus.keyStatus}</p>
          </div>
          <div className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)]">Text model</p>
            <p className="mt-1 break-words text-sm font-semibold text-[var(--foreground)]">{googleAiStatus.textModel}</p>
          </div>
          <div className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)]">Image model</p>
            <p className="mt-1 break-words text-sm font-semibold text-[var(--foreground)]">{googleAiStatus.imageModel}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => testGoogleAi("text")}
            disabled={aiTestingTarget !== null}
            className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {aiTestingTarget === "text" ? "Testing..." : "Test Writing"}
          </button>
          <button
            type="button"
            onClick={() => testGoogleAi("image")}
            disabled={aiTestingTarget !== null}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
          >
            {aiTestingTarget === "image" ? "Testing..." : "Test Image"}
          </button>
        </div>

        {aiTestResult && <p className="mt-3 rounded border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{aiTestResult}</p>}
        {aiTestError && <p className="mt-3 rounded border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{aiTestError}</p>}
      </section>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Email Delivery Diagnostics</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Send the newsletter welcome template to your admin email to verify SMTP, sender settings, and inbox delivery.
            </p>
          </div>
          <span className="w-fit rounded bg-cyan-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            SMTP test
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => testWelcomeEmail("ar")}
            disabled={emailTestingLocale !== null}
            className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {emailTestingLocale === "ar" ? "Sending..." : "Test Arabic Welcome"}
          </button>
          <button
            type="button"
            onClick={() => testWelcomeEmail("en")}
            disabled={emailTestingLocale !== null}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-elevated)] disabled:opacity-60"
          >
            {emailTestingLocale === "en" ? "Sending..." : "Test English Welcome"}
          </button>
        </div>

        {emailTestResult && <p className="mt-3 rounded border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{emailTestResult}</p>}
        {emailTestError && <p className="mt-3 rounded border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{emailTestError}</p>}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Settings Store</h2>
            {editingSettingId && (
              <button type="button" onClick={resetSettingForm} className="text-sm font-semibold text-[var(--text-muted)]">
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">Header Social Links</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
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

            <div className="mt-3 rounded-md border border-cyan-500/25 bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Visual Social Links Builder</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addSocialLinkRow}
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={importSocialRowsFromJson}
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                  >
                    Import From JSON
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {socialLinksDraft.map((item, index) => (
                  <div key={`social-row-${index}`} className="grid gap-2 md:grid-cols-[170px_1fr_auto]">
                    <select
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-2 text-sm text-[var(--foreground)]"
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
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
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
                      className="rounded border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
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
              className="w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
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
              <p className="text-sm text-[var(--text-subtle)]">No settings found.</p>
            ) : (
              sortedSettings.map((row) => (
                <div key={row.id} className="rounded border border-slate-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{row.settingKey}</p>
                      <p className="text-xs text-[var(--text-subtle)]">Updated: {new Date(row.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
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
            <h2 className="text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Homepage Sections</h2>
            {editingSectionId && (
              <button type="button" onClick={resetSectionForm} className="text-sm font-semibold text-[var(--text-muted)]">
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">Hero Carousel Builder</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Update homepage hero images, headlines, links, and button text without editing JSON by hand.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useHeroSlidesPreset}
                  className="rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white"
                >
                  Use Hero Template
                </button>
                <button
                  type="button"
                  onClick={importHeroRowsFromJson}
                  className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                >
                  Import From JSON
                </button>
                <button
                  type="button"
                  onClick={addHeroSlide}
                  className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
                >
                  Add Slide
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {heroSlidesDraft.map((slide, index) => (
                <div key={`${slide.id}-${index}`} className="rounded-md border border-cyan-500/25 bg-[var(--surface)] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Slide {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeHeroSlide(index)}
                      disabled={heroSlidesDraft.length <= 1}
                      className="rounded border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                      placeholder="Headline"
                      value={slide.title}
                      onChange={(e) => updateHeroSlide(index, "title", e.target.value)}
                    />
                    <input
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                      placeholder="Image URL"
                      value={slide.imageUrl}
                      onChange={(e) => updateHeroSlide(index, "imageUrl", e.target.value)}
                    />
                    <input
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                      placeholder="Link, for example /ar/news"
                      value={slide.href}
                      onChange={(e) => updateHeroSlide(index, "href", e.target.value)}
                    />
                    <input
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                      placeholder="Eyebrow label"
                      value={slide.eyebrow}
                      onChange={(e) => updateHeroSlide(index, "eyebrow", e.target.value)}
                    />
                    <input
                      className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
                      placeholder="Button label"
                      value={slide.ctaLabel}
                      onChange={(e) => updateHeroSlide(index, "ctaLabel", e.target.value)}
                    />
                    <textarea
                      className="min-h-20 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] md:col-span-2"
                      placeholder="Short summary"
                      value={slide.summary}
                      onChange={(e) => updateHeroSlide(index, "summary", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
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

            <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
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
              <p className="text-sm text-[var(--text-subtle)]">No homepage sections found.</p>
            ) : (
              sortedSections.map((row) => (
                <div key={row.id} className="rounded border border-slate-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{row.sectionKey}</p>
                      <p className="text-xs text-[var(--text-subtle)]">Sort: {row.sortOrder} • {truthy(row.enabled) ? "enabled" : "disabled"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
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
