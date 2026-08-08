"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

type Result = {
  query: string;
  articles: Array<{ id: number; slug: string; title: string; summary: string }>;
  banks: Array<{ id: number; slug: string; name: string }>;
};

export default function SearchPage() {
  const params = useParams<{ locale?: string }>();
  const searchParams = useSearchParams();
  const activeLocale = params?.locale === "en" ? "en" : "ar";
  const isArabic = activeLocale === "ar";

  const [query, setQuery] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [showArabicFallback, setShowArabicFallback] = useState(false);

  async function runSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) {
      return;
    }

    setLoading(true);
    setShowArabicFallback(false);

    const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&locale=${activeLocale}`);
    const json = await response.json();
    const nextData = (json?.data ?? null) as Result | null;
    setData(nextData);

    if (activeLocale === "en" && nextData && nextData.articles.length === 0 && nextData.banks.length === 0) {
      const arabicResponse = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&locale=ar`);
      const arabicJson = await arabicResponse.json();
      const arabicData = (arabicJson?.data ?? null) as Result | null;
      if (arabicData && (arabicData.articles.length > 0 || arabicData.banks.length > 0)) {
        setShowArabicFallback(true);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    const initialQuery = (searchParams.get("q") ?? "").trim();
    if (initialQuery.length >= 2) {
      setQuery(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const initialQuery = (searchParams.get("q") ?? "").trim();
    if (initialQuery.length < 2 || data) {
      return;
    }

    void runSearch(initialQuery);
  }, [data, searchParams, activeLocale]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isArabic ? "ابحث..." : "Search..."}
        />
        <button className="rounded-md bg-[#0A2342] px-4 py-2 font-semibold text-white" disabled={loading}>
          {loading ? "..." : isArabic ? "بحث" : "Search"}
        </button>
      </form>

      {showArabicFallback ? (
        <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-black text-slate-900">Arabic Is Our Main Language</h2>
          <p className="mt-2 text-sm text-slate-700">This content is not available in this language right now.</p>
          <p className="mt-1 text-sm text-slate-600">Try your query in Arabic to find more results.</p>
          <Link
            href={`/ar/search`}
            className="mt-3 inline-flex rounded bg-[#0A2342] px-3 py-2 text-sm font-semibold text-white hover:bg-[#091b35]"
          >
            Open Arabic Search
          </Link>
        </section>
      ) : null}

      {data && (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-900">{isArabic ? "المقالات" : "Articles"}</h2>
            <div className="mt-2 space-y-2">
              {data.articles.length ? (
                data.articles.map((article) => (
                  <Link key={article.id} href={`/${activeLocale}/news/${article.slug}`} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                    <p className="font-bold">{article.title}</p>
                    <p className="text-sm text-slate-600">{article.summary}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">{isArabic ? "لا توجد نتائج للمقالات." : "No article results."}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">{isArabic ? "البنوك" : "Banks"}</h2>
            <div className="mt-2 space-y-2">
              {data.banks.length ? (
                data.banks.map((bank) => (
                  <Link key={bank.id} href={`/${activeLocale}/banks/${bank.slug}`} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                    <p className="font-bold">{bank.name}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">{isArabic ? "لا توجد نتائج للبنوك." : "No bank results."}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
