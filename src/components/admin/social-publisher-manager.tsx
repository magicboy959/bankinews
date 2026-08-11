"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DistributionChannel, SocialPost } from "@/lib/social-distribution";

const distributionChannels: DistributionChannel[] = ["website", "facebook", "instagram", "x", "telegram", "whatsapp_channel", "linkedin"];

type ArticleOption = { id: number; slug: string; status: string; title: string; featuredImageUrl: string | null };
type ChannelStatus = Record<DistributionChannel, { configured: boolean; mode: "automatic" | "manual"; profileUrl?: string }>;
type PublishResult = { channel: DistributionChannel; status: "published" | "failed" | "manual_required"; externalUrl?: string; error?: string };
type DistributionHistory = {
  id: number;
  articleId: number;
  articleTitle: string;
  locale: "ar" | "en";
  textMode: "ai" | "custom";
  status: "pending" | "partial" | "published" | "failed";
  editorName: string | null;
  createdAt: string;
  completedAt: string | null;
  items: Array<{ distributionId: number; channel: DistributionChannel; status: "pending" | "published" | "failed" | "manual_required" | "skipped"; externalUrl: string | null; errorMessage: string | null }>;
};
type ApiResult<T> = { ok: true; data: T } | { ok: false; error?: { message?: string } };
type ConnectionResult = { channel: DistributionChannel; ok: boolean; accountLabel?: string; error?: string };

const channelLabels: Record<DistributionChannel, string> = {
  website: "Banki News Website",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  telegram: "Telegram",
  whatsapp_channel: "WhatsApp Channel",
  linkedin: "LinkedIn",
};

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  return (await response.json().catch(() => ({ ok: false }))) as ApiResult<T>;
}

export function SocialPublisherManager({ articles, channelStatus, history }: { articles: ArticleOption[]; channelStatus: ChannelStatus; history: DistributionHistory[] }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState(articles[0]?.id ? String(articles[0].id) : "");
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [selected, setSelected] = useState<Record<DistributionChannel, boolean>>(() =>
    Object.fromEntries(distributionChannels.map((channel) => [channel, channel === "website" || channelStatus[channel].configured])) as Record<DistributionChannel, boolean>
  );
  const [textMode, setTextMode] = useState<"ai" | "custom">("ai");
  const [customText, setCustomText] = useState("");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [testingChannel, setTestingChannel] = useState<DistributionChannel | null>(null);
  const [connectionResults, setConnectionResults] = useState<Partial<Record<DistributionChannel, ConnectionResult>>>({});

  const chosenChannels = useMemo(() => distributionChannels.filter((channel) => selected[channel]), [selected]);
  const selectedArticle = articles.find((article) => String(article.id) === articleId);

  function toggleChannel(channel: DistributionChannel) {
    setSelected((current) => ({ ...current, [channel]: !current[channel] }));
    setPosts([]);
    setResults([]);
  }

  async function testConnection(channel: DistributionChannel) {
    setTestingChannel(channel);
    const response = await fetch("/api/admin/distribution/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const result = await parseResponse<ConnectionResult>(response);
    setTestingChannel(null);
    setConnectionResults((current) => ({
      ...current,
      [channel]: response.ok && result.ok ? result.data : { channel, ok: false, error: result.ok ? "Connection test failed." : result.error?.message || "Connection test failed." },
    }));
  }

  async function preview() {
    setError(null);
    setResults([]);
    if (!articleId || chosenChannels.length === 0) return setError("Choose an article and at least one destination.");
    setPreviewing(true);
    const response = await fetch("/api/admin/distribution/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: Number(articleId), locale, channels: chosenChannels, textMode, customText }),
    });
    const result = await parseResponse<{ posts: SocialPost[] }>(response);
    setPreviewing(false);
    if (!response.ok || !result.ok) return setError(result.ok ? "Unable to preview posts." : result.error?.message || "Unable to preview posts.");
    setPosts(result.data.posts);
  }

  function updatePost(channel: DistributionChannel, text: string) {
    setPosts((current) => current.map((post) => post.channel === channel ? { ...post, text } : post));
  }

  async function publishEverywhere() {
    setError(null);
    if (posts.length === 0) return setError("Preview the social posts before publishing.");
    setPublishing(true);
    const response = await fetch("/api/admin/distribution/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: Number(articleId), locale, textMode, customText: textMode === "custom" ? customText : null, posts }),
    });
    const result = await parseResponse<{ results: PublishResult[] }>(response);
    setPublishing(false);
    if (!response.ok || !result.ok) return setError(result.ok ? "Publishing failed." : result.error?.message || "Publishing failed.");
    setResults(result.data.results);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--foreground)]">Publish Article Everywhere</h1>
        <p className="mt-2 text-[var(--text-muted)]">Review every destination and caption before one controlled publishing action.</p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <select value={articleId} onChange={(event) => { setArticleId(event.target.value); setPosts([]); setResults([]); }} className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]">
            {articles.map((article) => <option key={article.id} value={article.id}>#{article.id} · {article.title} ({article.status})</option>)}
          </select>
          <select value={locale} onChange={(event) => { setLocale(event.target.value as "ar" | "en"); setPosts([]); }} className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--foreground)]">
            <option value="ar">Arabic</option><option value="en">English</option>
          </select>
        </div>
        {selectedArticle && !selectedArticle.featuredImageUrl ? <p className="mt-2 text-sm text-amber-700">This article has no image; Instagram publishing will fail until one is added.</p> : null}

        <h2 className="mt-5 text-sm font-black uppercase tracking-wide text-[var(--foreground)]">Automatically distribute to</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {distributionChannels.map((channel) => {
            const status = channelStatus[channel];
            return (
              <label key={channel} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                <input type="checkbox" checked={selected[channel]} onChange={() => toggleChannel(channel)} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--foreground)]">{channelLabels[channel]}</span><span className={`text-xs ${status.configured ? "text-emerald-700" : "text-amber-700"}`}>{status.mode === "manual" ? "Manual handoff required" : status.configured ? "Configured" : "Credentials required"}</span>{status.profileUrl ? <a href={status.profileUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-1 block text-xs font-semibold text-cyan-700 underline">View profile</a> : null}{connectionResults[channel] ? <span className={`mt-1 block text-xs ${connectionResults[channel]?.ok ? "text-emerald-700" : "text-red-700"}`}>{connectionResults[channel]?.ok ? `Verified${connectionResults[channel]?.accountLabel ? ` · ${connectionResults[channel]?.accountLabel}` : ""}` : connectionResults[channel]?.error}</span> : null}{status.configured && status.mode === "automatic" ? <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void testConnection(channel); }} disabled={testingChannel === channel} className="mt-2 rounded border border-[var(--border)] px-2 py-1 text-[11px] font-semibold disabled:opacity-60">{testingChannel === channel ? "Testing..." : "Test connection"}</button> : null}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-black text-[var(--foreground)]">Social text</p>
          <label className="mr-4 text-sm"><input type="radio" checked={textMode === "ai"} onChange={() => { setTextMode("ai"); setPosts([]); }} /> <span className="ml-1">Generate automatically with Banki AI</span></label>
          <label className="text-sm"><input type="radio" checked={textMode === "custom"} onChange={() => { setTextMode("custom"); setPosts([]); }} /> <span className="ml-1">Use custom text</span></label>
          {textMode === "custom" ? <textarea value={customText} onChange={(event) => { setCustomText(event.target.value); setPosts([]); }} className="min-h-28 w-full rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2" placeholder="Write the shared social caption..." /> : null}
        </div>

        <button type="button" onClick={preview} disabled={previewing} className="mt-5 rounded border border-[#0A2342] px-4 py-2 text-sm font-black text-[#0A2342] disabled:opacity-60">{previewing ? "Generating previews..." : "Preview Social Posts"}</button>
      </section>

      {posts.length ? <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-black">Social Post Preview</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{posts.map((post) => <div key={post.channel} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4"><p className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">{channelLabels[post.channel]}</p><textarea value={post.text} onChange={(event) => updatePost(post.channel, event.target.value)} className="mt-2 min-h-40 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" /><p className="mt-1 text-xs text-[var(--text-subtle)]">{post.text.length} characters</p></div>)}</div><button type="button" onClick={publishEverywhere} disabled={publishing} className="mt-5 rounded bg-[#0A2342] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{publishing ? "Publishing..." : "Publish Everywhere"}</button></section> : null}

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {results.length ? <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-black">Publishing Results</h2><div className="mt-3 space-y-2">{results.map((result) => <div key={result.channel} className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border)] p-3"><div><p className="font-semibold">{channelLabels[result.channel]}</p><p className={`text-xs ${result.status === "published" ? "text-emerald-700" : result.status === "manual_required" ? "text-amber-700" : "text-red-700"}`}>{result.status.replaceAll("_", " ")}{result.error ? ` · ${result.error}` : ""}</p></div>{result.status === "manual_required" ? <div className="flex gap-2"><button type="button" onClick={() => navigator.clipboard.writeText(posts.find((post) => post.channel === result.channel)?.text || "")} className="rounded border px-3 py-1 text-xs font-semibold">Copy text</button>{result.externalUrl ? <a href={result.externalUrl} target="_blank" rel="noreferrer" className="rounded border px-3 py-1 text-xs font-semibold">Open WhatsApp</a> : null}</div> : result.externalUrl ? <a href={result.externalUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold underline">Open post</a> : null}</div>)}</div></section> : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black">Distribution History</h2><span className="text-xs text-[var(--text-subtle)]">Last {history.length} runs</span></div>
        {history.length === 0 ? <p className="mt-3 text-sm text-[var(--text-subtle)]">No distribution runs yet.</p> : <div className="mt-4 space-y-4">{history.map((run) => (
          <article key={run.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-[var(--foreground)]">#{run.articleId} · {run.articleTitle}</p><p className="mt-1 text-xs text-[var(--text-subtle)]">{new Date(run.createdAt).toLocaleString()} · {run.editorName || "Unknown editor"} · {run.locale.toUpperCase()} · {run.textMode === "ai" ? "Banki AI" : "Custom text"}</p></div><span className={`rounded px-2 py-1 text-xs font-black ${run.status === "published" ? "bg-emerald-100 text-emerald-800" : run.status === "partial" ? "bg-amber-100 text-amber-800" : run.status === "failed" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{run.status}</span></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{run.items.map((item) => <div key={`${run.id}-${item.channel}`} className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold">{channelLabels[item.channel]}</span><span className={`text-[11px] font-semibold ${item.status === "published" ? "text-emerald-700" : item.status === "manual_required" ? "text-amber-700" : item.status === "failed" ? "text-red-700" : "text-slate-500"}`}>{item.status.replaceAll("_", " ")}</span></div>{item.errorMessage ? <p className="mt-1 text-xs text-red-700">{item.errorMessage}</p> : null}{item.externalUrl ? <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold underline">Open result</a> : null}</div>)}</div>
          </article>
        ))}</div>}
      </section>
    </div>
  );
}
