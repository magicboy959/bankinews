import type { Metadata } from "next";
import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

type ExchangeRateDisplayRow = DbRow & {
  currencyName: string;
  currencyCode: string;
  officialBuy: number | string | null;
  officialSell: number | string | null;
  parallelBuy: number | string | null;
  parallelSell: number | string | null;
  rateDate: string | Date;
  source: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "أسعار الصرف" : "Exchange Rates",
    description:
      safeLocale === "ar"
        ? "أسعار الصرف الرسمية والسوق الموازية في السودان"
        : "Official and parallel market exchange rates in Sudan",
    path: `/${safeLocale}/exchange-rates`,
  });
}

export default async function ExchangeRatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const isArabic = safeLocale === "ar";

  let rows: ExchangeRateDisplayRow[] = [];
  try {
    rows = await dbQuery<ExchangeRateDisplayRow[]>(
      `SELECT currency_name AS currencyName, currency_code AS currencyCode,
              official_buy AS officialBuy, official_sell AS officialSell,
              parallel_buy AS parallelBuy, parallel_sell AS parallelSell,
              rate_date AS rateDate, source
       FROM exchange_rates
       WHERE deleted_at IS NULL
       ORDER BY rate_date DESC
       LIMIT 100`
    );
  } catch {
    rows = [];
  }

  const latestDate = rows[0]?.rateDate ? String(rows[0].rateDate).slice(0, 10) : null;
  const uniqueSources = Array.from(new Set(rows.map((row) => row.source).filter(Boolean))).slice(0, 5);
  const methodology = isArabic
    ? [
        "تعرض الصفحة السعر وتاريخه ومصدره كما تم إدخاله في نظام التحرير، ولا تعتبر عرض بيع أو شراء.",
        "يتم الفصل بين السعر الرسمي وسعر السوق الموازي عند توفرهما لتقليل الالتباس لدى القارئ.",
        "إذا لم يتوفر مصدر أو تاريخ حديث لعملة معينة، يجب الرجوع إلى البنك أو الجهة الرسمية قبل أي معاملة.",
      ]
    : [
        "The page shows each rate, date, and source as entered in the editorial system; it is not a buy or sell offer.",
        "Official and parallel-market values are separated where available to reduce reader confusion.",
        "If a current source or date is unavailable for a currency, verify with the bank or official institution before transacting.",
      ];

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#005F73]">
          {isArabic ? "بيانات معلوماتية" : "Informational Data"}
        </p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">{t.nav.rates}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
          {isArabic
            ? "تجمع هذه الصفحة أسعار الصرف المنشورة لأغراض المتابعة والمقارنة، مع إبراز التاريخ والمصدر عند توفرهما. لا تعتمد عليها كعرض تنفيذ أو نصيحة مالية."
            : "This page collects published exchange-rate entries for monitoring and comparison, with date and source shown when available. It is not an execution quote or financial advice."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/${safeLocale}/exchange-rates/compare`}
            className="inline-flex items-center rounded-lg bg-[#0A2342] px-4 py-2 font-semibold text-white hover:bg-[#133463]"
          >
            {safeLocale === "ar" ? "مقارنة أسعار الصرف" : "Compare Exchange Rates"}
          </Link>
          {latestDate ? (
            <span className="text-[var(--text-muted)]">
              {isArabic ? `آخر تاريخ ظاهر: ${latestDate}` : `Latest listed date: ${latestDate}`}
            </span>
          ) : null}
        </div>
      </header>

      <section className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="text-lg font-black">{isArabic ? "منهجية العرض" : "Display Methodology"}</h2>
        <ul className="mt-3 space-y-2">
          {methodology.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {uniqueSources.length ? (
          <p className="mt-3">
            <span className="font-black">{isArabic ? "مصادر ظاهرة: " : "Listed sources: "}</span>
            {uniqueSources.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
        <h2 className="text-2xl font-black text-[var(--foreground)]">
          {isArabic ? "جدول الأسعار" : "Rate Table"}
        </h2>
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{t.labels.informationalRates}</p>
        {rows.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-2">{isArabic ? "العملة" : "Currency"}</th>
                  <th className="p-2">{isArabic ? "الرمز" : "Code"}</th>
                  <th className="p-2">{isArabic ? "شراء رسمي" : "Official Buy"}</th>
                  <th className="p-2">{isArabic ? "بيع رسمي" : "Official Sell"}</th>
                  <th className="p-2">{isArabic ? "شراء موازي" : "Parallel Buy"}</th>
                  <th className="p-2">{isArabic ? "بيع موازي" : "Parallel Sell"}</th>
                  <th className="p-2">{isArabic ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.currencyCode}-${i}`} className="border-b border-[var(--border)]/70">
                    <td className="p-2 text-[var(--foreground)]">{row.currencyName}</td>
                    <td className="p-2 text-[var(--text-muted)]">{row.currencyCode}</td>
                    <td className="p-2 text-[var(--text-muted)]">{row.officialBuy ?? "-"}</td>
                    <td className="p-2 text-[var(--text-muted)]">{row.officialSell ?? "-"}</td>
                    <td className="p-2 text-[var(--text-muted)]">{row.parallelBuy ?? "-"}</td>
                    <td className="p-2 text-[var(--text-muted)]">{row.parallelSell ?? "-"}</td>
                    <td className="p-2 text-[var(--text-muted)]">{String(row.rateDate).slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#005F73]/35 bg-[#005F73]/5 p-6">
            <h3 className="text-lg font-black text-[var(--foreground)]">
              {isArabic ? "لا توجد أسعار منشورة حالياً" : "No exchange rates are currently published"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
              {isArabic
                ? "لا ننشئ أسعاراً تقديرية لملء الجدول. ستظهر البيانات بعد إدخالها ومراجعة تاريخها ومصدرها."
                : "We do not create estimated rates to fill the table. Data will appear after its date and source have been entered and reviewed."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
