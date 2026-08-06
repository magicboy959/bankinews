"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

type SourceType = "all" | "bank" | "exchange_company";
type SortMode = "buy_desc" | "buy_asc" | "sell_desc" | "sell_asc";

type CompareRow = {
  sourceId: number;
  sourceName: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  buyRate: number | null;
  sellRate: number | null;
  spread: number | null;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: number;
  lastVerifiedAt: string | null;
  pointUpdatedAt: string | null;
  freshnessMinutes: number | null;
};

type CompareData = {
  currencyCode: string;
  date: string | null;
  rows: CompareRow[];
  summary: {
    bestBuy: CompareRow | null;
    bestSell: CompareRow | null;
    lowestBuy: CompareRow | null;
    lowestSell: CompareRow | null;
  };
};

type TrendPoint = {
  date: string;
  buyRate: number | null;
  sellRate: number | null;
  value: number | null;
};

type TrendSeries = {
  sourceId: number;
  sourceName: string;
  sourceType: "bank" | "exchange_company" | "central_bank" | "other";
  points: TrendPoint[];
  latestValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  change: number | null;
  pointsCount: number;
  trustTier: "high" | "medium" | "low" | "unverified";
  trustScore: number;
  lastVerifiedAt: string | null;
  latestPointUpdatedAt: string | null;
  freshnessMinutes: number | null;
};

type TrendData = {
  currencyCode: string;
  sourceType: SourceType;
  metric: "buy" | "sell";
  days: 7 | 30 | 90;
  fromDate: string | null;
  toDate: string | null;
  dates: string[];
  series: TrendSeries[];
};

type ApiResponse =
  | { ok: true; data: CompareData }
  | { ok: false; error?: { message?: string } };

type TrendApiResponse =
  | { ok: true; data: TrendData }
  | { ok: false; error?: { message?: string } };

type Labels = {
  title: string;
  subtitle: string;
  currency: string;
  date: string;
  sourceType: string;
  sortBy: string;
  apply: string;
  reset: string;
  loading: string;
  noData: string;
  source: string;
  buy: string;
  sell: string;
  spread: string;
  type: string;
  compareHint: string;
  sourceAll: string;
  sourceBank: string;
  sourceExchange: string;
  sortBuyDesc: string;
  sortBuyAsc: string;
  sortSellDesc: string;
  sortSellAsc: string;
  bestBuy: string;
  bestSell: string;
  lowestBuy: string;
  lowestSell: string;
  asOf: string;
  sourceTypeBank: string;
  sourceTypeExchange: string;
  sourceTypeOther: string;
  sourceTypeCentralBank: string;
  errorLoad: string;
  trendsTitle: string;
  trendsSubtitle: string;
  trendDays: string;
  trendMetric: string;
  trendMetricBuy: string;
  trendMetricSell: string;
  trendNoData: string;
  trendLoading: string;
  trendRange: string;
  trendChange: string;
  topMoversTitle: string;
  strongestRise: string;
  strongestDrop: string;
  highestVolatility: string;
  volatility: string;
  trust: string;
  trustHigh: string;
  trustMedium: string;
  trustLow: string;
  trustUnverified: string;
  freshness: string;
  freshNow: string;
  freshMinutes: string;
  freshHours: string;
  freshDays: string;
};

type Props = {
  locale: Locale;
  labels: Labels;
  initialCurrencyCode?: string;
  initialDate?: string;
  initialSourceType?: SourceType;
  initialSort?: SortMode;
};

function normalizeSourceType(value?: string): SourceType {
  if (value === "bank" || value === "exchange_company") {
    return value;
  }
  return "all";
}

function normalizeSort(value?: string): SortMode {
  if (value === "buy_asc" || value === "sell_desc" || value === "sell_asc") {
    return value;
  }
  return "buy_desc";
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatNumber(value: number | null, locale: Locale): string {
  if (value === null) {
    return "-";
  }
  return new Intl.NumberFormat(locale === "ar" ? "ar-SD" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function buildLinePath(values: Array<number | null>, min: number, max: number): string {
  const width = 320;
  const height = 120;
  const paddingX = 10;
  const paddingY = 10;
  const contentWidth = width - paddingX * 2;
  const contentHeight = height - paddingY * 2;
  const range = max - min;
  const steps = Math.max(values.length - 1, 1);

  let path = "";
  values.forEach((value, index) => {
    if (value === null) {
      return;
    }

    const x = paddingX + (index / steps) * contentWidth;
    const normalizedY = range === 0 ? 0.5 : (value - min) / range;
    const y = paddingY + contentHeight - normalizedY * contentHeight;
    path += `${path ? " L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return path;
}

function trustToneClasses(tier: "high" | "medium" | "low" | "unverified"): string {
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

function formatFreshness(minutes: number | null, labels: Labels): string {
  if (minutes === null) {
    return "-";
  }
  if (minutes < 1) {
    return labels.freshNow;
  }
  if (minutes < 60) {
    return labels.freshMinutes.replace("{n}", String(minutes));
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return labels.freshHours.replace("{n}", String(hours));
  }

  const days = Math.floor(hours / 24);
  return labels.freshDays.replace("{n}", String(days));
}

export function ExchangeRatesCompare({
  locale,
  labels,
  initialCurrencyCode = "USD",
  initialDate = "",
  initialSourceType = "all",
  initialSort = "buy_desc",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [currencyCode, setCurrencyCode] = useState(initialCurrencyCode.toUpperCase());
  const [date, setDate] = useState(initialDate);
  const [sourceType, setSourceType] = useState<SourceType>(normalizeSourceType(initialSourceType));
  const [sort, setSort] = useState<SortMode>(normalizeSort(initialSort));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareData | null>(null);
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [trendMetric, setTrendMetric] = useState<"buy" | "sell">("sell");
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);

  const sourceTypeLabel = useMemo(() => {
    return {
      bank: labels.sourceTypeBank,
      exchange_company: labels.sourceTypeExchange,
      central_bank: labels.sourceTypeCentralBank,
      other: labels.sourceTypeOther,
    } as const;
  }, [labels]);

  const trustTierLabel = useMemo(() => {
    return {
      high: labels.trustHigh,
      medium: labels.trustMedium,
      low: labels.trustLow,
      unverified: labels.trustUnverified,
    } as const;
  }, [labels]);

  useEffect(() => {
    const normalizedCurrencyCode = initialCurrencyCode.trim().toUpperCase();
    const safeCurrency = normalizedCurrencyCode.length === 3 ? normalizedCurrencyCode : "USD";
    const safeDate = initialDate && isIsoDate(initialDate) ? initialDate : "";
    const safeSourceType = normalizeSourceType(initialSourceType);
    const safeSort = normalizeSort(initialSort);

    setCurrencyCode(safeCurrency);
    setDate(safeDate);
    setSourceType(safeSourceType);
    setSort(safeSort);
    void Promise.all([
      loadCompare(safeCurrency, safeDate, safeSourceType, safeSort),
      loadTrends(safeCurrency, safeSourceType, trendDays, trendMetric),
    ]);
  }, [initialCurrencyCode, initialDate, initialSourceType, initialSort]);

  async function loadTrends(
    nextCurrencyCode: string,
    nextSourceType: SourceType,
    nextTrendDays: 7 | 30 | 90,
    nextTrendMetric: "buy" | "sell"
  ) {
    setTrendLoading(true);
    setTrendError(null);

    const params = new URLSearchParams();
    params.set("currencyCode", nextCurrencyCode);
    params.set("sourceType", nextSourceType);
    params.set("days", String(nextTrendDays));
    params.set("metric", nextTrendMetric);

    const response = await fetch(`/api/exchange-rates/trends?${params.toString()}`);
    const result = (await response.json()) as TrendApiResponse;
    setTrendLoading(false);

    if (!response.ok || !result.ok) {
      setTrendError(result.ok ? labels.errorLoad : result.error?.message ?? labels.errorLoad);
      setTrendData(null);
      return;
    }

    setTrendData(result.data);
  }

  async function loadCompare(nextCurrencyCode: string, nextDate: string, nextSourceType: SourceType, nextSort: SortMode) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("currencyCode", nextCurrencyCode);
    if (nextDate) {
      params.set("date", nextDate);
    }
    params.set("sourceType", nextSourceType);
    params.set("sort", nextSort);

    const response = await fetch(`/api/exchange-rates/compare?${params.toString()}`);
    const result = (await response.json()) as ApiResponse;
    setLoading(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? labels.errorLoad : result.error?.message ?? labels.errorLoad);
      setData(null);
      return;
    }

    setData(result.data);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
    if (normalizedCurrencyCode.length !== 3) {
      setError(locale === "ar" ? "العملة يجب أن تكون 3 أحرف" : "Currency code must be 3 letters");
      return;
    }

    if (date && !isIsoDate(date)) {
      setError(locale === "ar" ? "التاريخ يجب أن يكون بصيغة YYYY-MM-DD" : "Date must use YYYY-MM-DD format");
      return;
    }

    setCurrencyCode(normalizedCurrencyCode);

    const urlParams = new URLSearchParams();
    urlParams.set("currencyCode", normalizedCurrencyCode);
    if (date) {
      urlParams.set("date", date);
    }
    urlParams.set("sourceType", sourceType);
    urlParams.set("sort", sort);
    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false });

    await Promise.all([
      loadCompare(normalizedCurrencyCode, date, sourceType, sort),
      loadTrends(normalizedCurrencyCode, sourceType, trendDays, trendMetric),
    ]);
  }

  async function onReset() {
    const resetCurrency = "USD";
    setCurrencyCode(resetCurrency);
    setDate("");
    setSourceType("all");
    setSort("buy_desc");
    router.replace(pathname, { scroll: false });
    await Promise.all([
      loadCompare(resetCurrency, "", "all", "buy_desc"),
      loadTrends(resetCurrency, "all", trendDays, trendMetric),
    ]);
  }

  async function onTrendDaysChange(nextDays: 7 | 30 | 90) {
    setTrendDays(nextDays);
    const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
    if (normalizedCurrencyCode.length !== 3) {
      return;
    }
    await loadTrends(normalizedCurrencyCode, sourceType, nextDays, trendMetric);
  }

  async function onTrendMetricChange(nextMetric: "buy" | "sell") {
    setTrendMetric(nextMetric);
    const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
    if (normalizedCurrencyCode.length !== 3) {
      return;
    }
    await loadTrends(normalizedCurrencyCode, sourceType, trendDays, nextMetric);
  }

  const trendColors = ["#0F766E", "#1D4ED8", "#9333EA", "#EA580C", "#BE123C", "#0891B2"];

  const trendDerived = useMemo(() => {
    const series = trendData?.series ?? [];
    if (!series.length) {
      return {
        strongestRise: null as TrendSeries | null,
        strongestDrop: null as TrendSeries | null,
        highestVolatility: null as TrendSeries | null,
      };
    }

    const enriched = series.map((item) => ({
      item,
      change: item.change ?? 0,
      volatility:
        item.maxValue !== null && item.minValue !== null
          ? item.maxValue - item.minValue
          : 0,
    }));

    const strongestRise = [...enriched]
      .filter((entry) => entry.item.change !== null)
      .sort((a, b) => b.change - a.change)[0]?.item ?? null;

    const strongestDrop = [...enriched]
      .filter((entry) => entry.item.change !== null)
      .sort((a, b) => a.change - b.change)[0]?.item ?? null;

    const highestVolatility = [...enriched]
      .filter((entry) => entry.item.maxValue !== null && entry.item.minValue !== null)
      .sort((a, b) => b.volatility - a.volatility)[0]?.item ?? null;

    return { strongestRise, strongestDrop, highestVolatility };
  }, [trendData]);

  const highestVolatilityValue =
    trendDerived.highestVolatility &&
    trendDerived.highestVolatility.maxValue !== null &&
    trendDerived.highestVolatility.minValue !== null
      ? trendDerived.highestVolatility.maxValue - trendDerived.highestVolatility.minValue
      : null;

  const trendBounds = useMemo(() => {
    if (!trendData?.series.length) {
      return { min: 0, max: 1 };
    }

    const values = trendData.series.flatMap((series) =>
      series.points.map((point) => point.value).filter((value): value is number => value !== null)
    );
    if (!values.length) {
      return { min: 0, max: 1 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [trendData]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0A2342] md:text-3xl">{labels.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{labels.subtitle}</p>
        </div>
        <p className="text-xs text-amber-700">{labels.compareHint}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3 md:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.currency}</label>
          <input
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.date}</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.sourceType}</label>
          <select
            value={sourceType}
            onChange={(event) => setSourceType(normalizeSourceType(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">{labels.sourceAll}</option>
            <option value="bank">{labels.sourceBank}</option>
            <option value="exchange_company">{labels.sourceExchange}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.sortBy}</label>
          <select
            value={sort}
            onChange={(event) => setSort(normalizeSort(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="buy_desc">{labels.sortBuyDesc}</option>
            <option value="buy_asc">{labels.sortBuyAsc}</option>
            <option value="sell_desc">{labels.sortSellDesc}</option>
            <option value="sell_asc">{labels.sortSellAsc}</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="w-full rounded-lg bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white">
            {labels.apply}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {labels.reset}
          </button>
        </div>
      </form>

      {!data && !loading && !error && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">{labels.noData}</div>
      )}

      {loading && <p className="mt-6 text-sm text-slate-600">{labels.loading}</p>}
      {error && <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700">{labels.bestBuy}</p>
              <p className="mt-1 text-base font-black text-emerald-900">
                {data.summary.bestBuy?.sourceName ?? "-"}
              </p>
              <p className="text-sm text-emerald-800">
                {formatNumber(data.summary.bestBuy?.buyRate ?? null, locale)}
              </p>
            </article>

            <article className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs font-semibold text-cyan-700">{labels.bestSell}</p>
              <p className="mt-1 text-base font-black text-cyan-900">
                {data.summary.bestSell?.sourceName ?? "-"}
              </p>
              <p className="text-sm text-cyan-800">
                {formatNumber(data.summary.bestSell?.sellRate ?? null, locale)}
              </p>
            </article>

            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">{labels.lowestBuy}</p>
              <p className="mt-1 text-base font-black text-amber-900">
                {data.summary.lowestBuy?.sourceName ?? "-"}
              </p>
              <p className="text-sm text-amber-800">
                {formatNumber(data.summary.lowestBuy?.buyRate ?? null, locale)}
              </p>
            </article>

            <article className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-xs font-semibold text-violet-700">{labels.lowestSell}</p>
              <p className="mt-1 text-base font-black text-violet-900">
                {data.summary.lowestSell?.sourceName ?? "-"}
              </p>
              <p className="text-sm text-violet-800">
                {formatNumber(data.summary.lowestSell?.sellRate ?? null, locale)}
              </p>
            </article>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {labels.asOf}: {data.date ?? "-"}
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">{labels.trendsTitle}</h2>
                <p className="mt-1 text-xs text-slate-600">{labels.trendsSubtitle}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.trendDays}</label>
                  <select
                    value={trendDays}
                    onChange={(event) => void onTrendDaysChange(Number(event.target.value) as 7 | 30 | 90)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value={7}>7D</option>
                    <option value={30}>30D</option>
                    <option value={90}>90D</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.trendMetric}</label>
                  <select
                    value={trendMetric}
                    onChange={(event) => void onTrendMetricChange(event.target.value === "buy" ? "buy" : "sell")}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="sell">{labels.trendMetricSell}</option>
                    <option value="buy">{labels.trendMetricBuy}</option>
                  </select>
                </div>
              </div>
            </div>

            {trendLoading && <p className="mt-4 text-sm text-slate-600">{labels.trendLoading}</p>}
            {trendError && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{trendError}</p>}

            {!trendLoading && !trendError && (!trendData || !trendData.series.length || !trendData.dates.length) && (
              <p className="mt-4 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">{labels.trendNoData}</p>
            )}

            {!trendLoading && !trendError && trendData && trendData.series.length > 0 && trendData.dates.length > 0 && (
              <>
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                  <svg viewBox="0 0 320 120" className="h-40 w-full">
                    {trendData.series.map((series, index) => {
                      const path = buildLinePath(
                        series.points.map((point) => point.value),
                        trendBounds.min,
                        trendBounds.max
                      );
                      if (!path) {
                        return null;
                      }

                      return (
                        <path
                          key={series.sourceId}
                          d={path}
                          fill="none"
                          stroke={trendColors[index % trendColors.length]}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {labels.trendRange}: {trendData.fromDate ?? "-"} - {trendData.toDate ?? "-"}
                </p>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <article className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700">{labels.strongestRise}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-900">
                      {trendDerived.strongestRise?.sourceName ?? "-"}
                    </p>
                    <p className="text-xs text-emerald-800">
                      {labels.trendChange}: {formatNumber(trendDerived.strongestRise?.change ?? null, locale)}
                    </p>
                  </article>

                  <article className="rounded-md border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-semibold text-rose-700">{labels.strongestDrop}</p>
                    <p className="mt-1 text-sm font-bold text-rose-900">
                      {trendDerived.strongestDrop?.sourceName ?? "-"}
                    </p>
                    <p className="text-xs text-rose-800">
                      {labels.trendChange}: {formatNumber(trendDerived.strongestDrop?.change ?? null, locale)}
                    </p>
                  </article>

                  <article className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">{labels.highestVolatility}</p>
                    <p className="mt-1 text-sm font-bold text-amber-900">
                      {trendDerived.highestVolatility?.sourceName ?? "-"}
                    </p>
                    <p className="text-xs text-amber-800">
                      {labels.volatility}:{" "}
                      {formatNumber(highestVolatilityValue, locale)}
                    </p>
                  </article>
                </div>

                <h3 className="mt-4 text-sm font-black text-slate-800">{labels.topMoversTitle}</h3>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {trendData.series.map((series, index) => (
                    <div key={series.sourceId} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">
                          <span
                            className="me-2 inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: trendColors[index % trendColors.length] }}
                          />
                          {series.sourceName}
                        </p>
                        <p className="text-slate-600">{formatNumber(series.latestValue, locale)}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${trustToneClasses(series.trustTier)}`}>
                          {labels.trust}: {trustTierLabel[series.trustTier]} ({series.trustScore})
                        </span>
                        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600">
                          {labels.freshness}: {formatFreshness(series.freshnessMinutes, labels)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{labels.trendChange}: {formatNumber(series.change, locale)}</span>
                        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600">
                          {labels.volatility}:{" "}
                          {formatNumber(
                            series.maxValue !== null && series.minValue !== null ? series.maxValue - series.minValue : null,
                            locale
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="p-2">{labels.source}</th>
                  <th className="p-2">{labels.type}</th>
                  <th className="p-2">{labels.trust}</th>
                  <th className="p-2">{labels.freshness}</th>
                  <th className="p-2">{labels.buy}</th>
                  <th className="p-2">{labels.sell}</th>
                  <th className="p-2">{labels.spread}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.sourceId} className="border-b border-slate-100">
                    <td className="p-2 font-semibold text-slate-800">{row.sourceName}</td>
                    <td className="p-2 text-slate-600">{sourceTypeLabel[row.sourceType]}</td>
                    <td className="p-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${trustToneClasses(row.trustTier)}`}>
                        {trustTierLabel[row.trustTier]} ({row.trustScore})
                      </span>
                    </td>
                    <td className="p-2 text-slate-600">{formatFreshness(row.freshnessMinutes, labels)}</td>
                    <td className="p-2">{formatNumber(row.buyRate, locale)}</td>
                    <td className="p-2">{formatNumber(row.sellRate, locale)}</td>
                    <td className="p-2">{formatNumber(row.spread, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}