"use client";

import { useState } from "react";

type Result = {
  query: string;
  articles: Array<{ id: number; slug: string; title: string; summary: string }>;
  banks: Array<{ id: number; slug: string; name: string }>;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=ar`);
    const json = await response.json();
    setLoading(false);
    setData(json?.data ?? null);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث..."
        />
        <button className="rounded-md bg-[#0A2342] px-4 py-2 font-semibold text-white" disabled={loading}>
          {loading ? "..." : "بحث"}
        </button>
      </form>

      {data && (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-900">المقالات</h2>
            <div className="mt-2 space-y-2">
              {data.articles.map((article) => (
                <div key={article.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-bold">{article.title}</p>
                  <p className="text-sm text-slate-600">{article.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">البنوك</h2>
            <div className="mt-2 space-y-2">
              {data.banks.map((bank) => (
                <div key={bank.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-bold">{bank.name}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
