"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor, hasRichTextContent } from "./rich-text-editor";
import { getMarketingTemplate, marketingTemplates, type MarketingTemplateKey } from "@/lib/marketing-templates";

type CampaignItem = {
  id: number;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  scheduledAt: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CampaignStatsCampaign = CampaignItem & {
  openRate: number;
  clickRate: number;
};

type CampaignEventItem = {
  id: number;
  eventType: "open" | "click";
  subscriberEmail: string;
  targetUrl: string | null;
  createdAt: string;
};

type CampaignStats = {
  campaign: CampaignStatsCampaign;
  recentEvents: CampaignEventItem[];
};

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error?: { message?: string } };

async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
  const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
  return json;
}

function toSnippet(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function MarketingCampaignManager({
  initialCampaigns,
  activeSubscriberCount,
  contentReadiness,
}: {
  initialCampaigns: CampaignItem[];
  activeSubscriberCount: number;
  contentReadiness: {
    publishedArticles: number;
    publishedGuides: number;
    visibleBankProfiles: number;
    verifiedArticles: number;
    verifiedGuides: number;
    maintainedBankProfiles: number;
  };
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [sendNow, setSendNow] = useState(false);
  const [templateKey, setTemplateKey] = useState<"" | MarketingTemplateKey>("");
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [loadingStatsId, setLoadingStatsId] = useState<number | null>(null);
  const [campaignStats, setCampaignStats] = useState<Record<number, CampaignStats | undefined>>({});
  const [error, setError] = useState<string | null>(null);

  const sortedCampaigns = useMemo(
    () => [...initialCampaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [initialCampaigns]
  );
  const articleTarget = 20;
  const profileAndGuideTarget = 10;
  const profileAndGuideCount = contentReadiness.maintainedBankProfiles + contentReadiness.verifiedGuides;
  const articleProgress = Math.min(100, Math.round((contentReadiness.verifiedArticles / articleTarget) * 100));
  const referenceProgress = Math.min(100, Math.round((profileAndGuideCount / profileAndGuideTarget) * 100));
  const readyForPromotion = articleProgress === 100 && referenceProgress === 100;

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!hasRichTextContent(htmlContent)) {
      setError("Campaign content is required.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/admin/marketing-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        htmlContent,
        textContent: textContent || undefined,
        scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        sendNow,
      }),
    });

    const result = await parseResponse<{ id: number } | { id: number; status: string; recipientCount: number; sentCount: number; failedCount: number }>(response);
    setSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to create campaign" : result.error?.message ?? "Unable to create campaign");
      return;
    }

    setSubject("");
    setHtmlContent("");
    setTextContent("");
    setScheduleAt("");
    setSendNow(false);
    setTemplateKey("");
    router.refresh();
  }

  function applyTemplate(nextTemplateKey: MarketingTemplateKey | "") {
    setTemplateKey(nextTemplateKey);

    if (!nextTemplateKey) {
      return;
    }

    const template = getMarketingTemplate(nextTemplateKey);
    if (!template) {
      return;
    }

    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
    setTextContent(template.textContent);
  }

  async function fillCampaignWithAi() {
    setAiError(null);
    const prompt = aiPrompt.trim();
    if (prompt.length < 12) {
      setAiError("Describe the campaign first.");
      return;
    }

    setAiGenerating(true);
    const response = await fetch("/api/admin/ai/data-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "campaign", prompt }),
    });
    const result = await parseResponse<Partial<{ subject: string; htmlContent: string; textContent: string }>>(response);
    setAiGenerating(false);

    if (!response.ok || !result.ok) {
      setAiError(result.ok ? "Unable to draft campaign" : result.error?.message ?? "Unable to draft campaign");
      return;
    }

    setSubject(result.data.subject ?? "");
    setHtmlContent(result.data.htmlContent ?? "");
    setTextContent(result.data.textContent ?? "");
    setTemplateKey("");
  }

  async function sendCampaign(id: number) {
    setError(null);
    setSendingId(id);

    const response = await fetch(`/api/admin/marketing-campaigns/${id}/send`, {
      method: "POST",
    });

    const result = await parseResponse<{ id: number; status: string; recipientCount: number; sentCount: number; failedCount: number }>(response);
    setSendingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to send campaign" : result.error?.message ?? "Unable to send campaign");
      return;
    }

    router.refresh();
  }

  async function openCampaignStats(id: number) {
    if (expandedCampaignId === id) {
      setExpandedCampaignId(null);
      return;
    }

    setExpandedCampaignId(id);

    if (campaignStats[id]) {
      return;
    }

    setLoadingStatsId(id);

    const response = await fetch(`/api/admin/marketing-campaigns/${id}/stats`);
    const result = await parseResponse<CampaignStats>(response);
    setLoadingStatsId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? "Unable to load campaign stats" : result.error?.message ?? "Unable to load campaign stats");
      return;
    }

    setCampaignStats((current) => ({
      ...current,
      [id]: result.data,
    }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">Marketing Campaigns</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Compose newsletter campaigns for your active subscriber list. Active subscribers available: {activeSubscriberCount}.
        </p>
      </div>

      <section className={`rounded-xl border p-5 ${readyForPromotion ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--foreground)]">Promotion Readiness</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {readyForPromotion
                ? "The content library has reached the recommended baseline for broader promotion."
                : "Build more useful on-site reading paths before sending a large campaign. Drafts and small tests remain available."}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${readyForPromotion ? "bg-emerald-700 text-white" : "bg-amber-600 text-white"}`}>
            {readyForPromotion ? "Ready" : "Build library first"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--foreground)]">Verified published articles</span>
              <span className="text-[var(--text-muted)]">{contentReadiness.verifiedArticles}/{articleTarget}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div className="h-full rounded-full bg-cyan-600" style={{ width: `${articleProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--text-subtle)]">{contentReadiness.publishedArticles} total published · verification must be within 180 days</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--foreground)]">Maintained bank profiles and verified guides</span>
              <span className="text-[var(--text-muted)]">{profileAndGuideCount}/{profileAndGuideTarget}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div className="h-full rounded-full bg-cyan-600" style={{ width: `${referenceProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--text-subtle)]">
              {contentReadiness.maintainedBankProfiles}/{contentReadiness.visibleBankProfiles} maintained bank profiles · {contentReadiness.verifiedGuides}/{contentReadiness.publishedGuides} verified guides
            </p>
          </div>
        </div>
      </section>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black text-[var(--foreground)]">New Campaign</h2>
        <form onSubmit={createCampaign} className="mt-4 space-y-3">
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">Google AI data entry</p>
            <textarea
              className="mt-2 min-h-20 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
              placeholder="Describe the newsletter topic, audience, key links, offer, and tone..."
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
            />
            <button type="button" onClick={fillCampaignWithAi} disabled={aiGenerating} className="mt-2 rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {aiGenerating ? "Drafting..." : "Draft campaign fields"}
            </button>
            {aiError ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{aiError}</p> : null}
          </div>
          <select
            className="w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)]"
            value={templateKey}
            onChange={(e) => applyTemplate(e.target.value as MarketingTemplateKey | "")}
          >
            <option value="">Choose a template</option>
            {marketingTemplates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text-muted)]">Campaign content</p>
            <RichTextEditor
              value={htmlContent}
              onChange={setHtmlContent}
              placeholder="Write the email body here. Use headings, lists, and quotes as needed."
            />
          </div>
          <textarea
            className="min-h-28 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder="Optional plain text version"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground)]"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
            Send immediately to all active subscribers
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : sendNow ? "Create and Send" : scheduleAt ? "Schedule Campaign" : "Create Draft"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[var(--foreground)]">Campaign History</h2>
          <p className="text-sm text-[var(--text-subtle)]">{sortedCampaigns.length} campaigns</p>
        </div>

        <div className="mt-4 space-y-3">
          {sortedCampaigns.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)]">No campaigns yet.</p>
          ) : (
            sortedCampaigns.map((campaign) => (
              <div key={campaign.id} className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{campaign.subject}</p>
                    <p className="mt-1 text-xs text-[var(--text-subtle)]">{toSnippet(campaign.htmlContent)}</p>
                    <p className="mt-1 text-xs text-[var(--text-subtle)]">
                      Status: {campaign.status} • Recipients: {campaign.recipientCount} • Sent: {campaign.sentCount} • Failed: {campaign.failedCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Opens: {campaign.openCount} • Clicks: {campaign.clickCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last open: {campaign.lastOpenedAt ? new Date(campaign.lastOpenedAt).toLocaleString() : "—"} • Last click: {campaign.lastClickedAt ? new Date(campaign.lastClickedAt).toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Scheduled: {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      onClick={() => openCampaignStats(campaign.id)}
                      disabled={loadingStatsId === campaign.id}
                    >
                      {loadingStatsId === campaign.id ? "Loading..." : expandedCampaignId === campaign.id ? "Hide stats" : "Stats"}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      onClick={() => sendCampaign(campaign.id)}
                      disabled={sendingId === campaign.id || campaign.status === "sending" || campaign.status === "sent"}
                    >
                      {sendingId === campaign.id ? "Sending..." : campaign.status === "sent" ? "Sent" : "Send"}
                    </button>
                  </div>
                </div>

                {expandedCampaignId === campaign.id && (
                  <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                    {loadingStatsId === campaign.id ? (
                      <p className="text-sm text-[var(--text-subtle)]">Loading campaign stats...</p>
                    ) : !campaignStats[campaign.id] ? (
                      <p className="text-sm text-[var(--text-subtle)]">Unable to load campaign stats.</p>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Sent</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.sentCount}</p>
                          </div>
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Failed</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.failedCount}</p>
                          </div>
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Opens</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.openCount}</p>
                          </div>
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Clicks</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.clickCount}</p>
                          </div>
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Open rate</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.openRate}%</p>
                          </div>
                          <div className="rounded bg-[var(--surface)] p-3">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--text-subtle)]">Click rate</p>
                            <p className="mt-1 text-lg font-black text-[var(--foreground)]">{campaignStats[campaign.id]?.campaign.clickRate}%</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]">Recent Activity</h3>
                          {campaignStats[campaign.id]?.recentEvents.length ? (
                            <ul className="mt-2 space-y-2">
                              {campaignStats[campaign.id]?.recentEvents.map((event) => (
                                <li key={event.id} className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-[var(--foreground)]">{event.eventType === "open" ? "Opened" : "Clicked"}</span>
                                    <span className="text-xs text-[var(--text-subtle)]">{new Date(event.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-[var(--text-muted)]">{event.subscriberEmail}</p>
                                  {event.targetUrl && (
                                    <p className="mt-1 break-all text-xs text-[var(--text-subtle)]">{event.targetUrl}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-[var(--text-subtle)]">No recent activity recorded yet.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
