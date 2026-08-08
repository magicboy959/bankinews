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

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

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
}: {
  initialCampaigns: CampaignItem[];
  activeSubscriberCount: number;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [sendNow, setSendNow] = useState(false);
  const [templateKey, setTemplateKey] = useState<"" | MarketingTemplateKey>("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [loadingStatsId, setLoadingStatsId] = useState<number | null>(null);
  const [campaignStats, setCampaignStats] = useState<Record<number, CampaignStats | undefined>>({});
  const [error, setError] = useState<string | null>(null);

  const sortedCampaigns = useMemo(
    () => [...initialCampaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [initialCampaigns]
  );

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
        <h1 className="text-2xl font-black text-[#0A2342]">Marketing Campaigns</h1>
        <p className="mt-2 text-slate-600">
          Compose newsletter campaigns for your active subscriber list. Active subscribers available: {activeSubscriberCount}.
        </p>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-black text-slate-900">New Campaign</h2>
        <form onSubmit={createCampaign} className="mt-4 space-y-3">
          <select
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
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
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Campaign content</p>
            <RichTextEditor
              value={htmlContent}
              onChange={setHtmlContent}
              placeholder="Write the email body here. Use headings, lists, and quotes as needed."
            />
          </div>
          <textarea
            className="min-h-28 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="Optional plain text version"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
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

      <section className="rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">Campaign History</h2>
          <p className="text-sm text-slate-500">{sortedCampaigns.length} campaigns</p>
        </div>

        <div className="mt-4 space-y-3">
          {sortedCampaigns.length === 0 ? (
            <p className="text-sm text-slate-500">No campaigns yet.</p>
          ) : (
            sortedCampaigns.map((campaign) => (
              <div key={campaign.id} className="rounded border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{campaign.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">{toSnippet(campaign.htmlContent)}</p>
                    <p className="mt-1 text-xs text-slate-500">
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
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {loadingStatsId === campaign.id ? (
                      <p className="text-sm text-slate-500">Loading campaign stats...</p>
                    ) : !campaignStats[campaign.id] ? (
                      <p className="text-sm text-slate-500">Unable to load campaign stats.</p>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Sent</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.sentCount}</p>
                          </div>
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Failed</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.failedCount}</p>
                          </div>
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Opens</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.openCount}</p>
                          </div>
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Clicks</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.clickCount}</p>
                          </div>
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Open rate</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.openRate}%</p>
                          </div>
                          <div className="rounded bg-white p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Click rate</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{campaignStats[campaign.id]?.campaign.clickRate}%</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Recent Activity</h3>
                          {campaignStats[campaign.id]?.recentEvents.length ? (
                            <ul className="mt-2 space-y-2">
                              {campaignStats[campaign.id]?.recentEvents.map((event) => (
                                <li key={event.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-900">{event.eventType === "open" ? "Opened" : "Clicked"}</span>
                                    <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600">{event.subscriberEmail}</p>
                                  {event.targetUrl && (
                                    <p className="mt-1 break-all text-xs text-slate-500">{event.targetUrl}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">No recent activity recorded yet.</p>
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
