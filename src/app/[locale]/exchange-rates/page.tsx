import type { Metadata } from "next";
import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { dbQuery } from "@/lib/db/query";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

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

  let rows: any[] = [];
  try {
    rows = await dbQuery<any[]>(
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{t.nav.rates}</h1>
      <p className="mt-2 text-sm text-amber-700">{t.labels.informationalRates}</p>
      <div className="mt-4">
        <Link
          href={`/${safeLocale}/exchange-rates/compare`}
          className="inline-flex items-center rounded-lg bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white hover:bg-[#133463]"
        >
          {safeLocale === "ar" ? "مقارنة أسعار الصرف" : "Compare Exchange Rates"}
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="p-2">Currency</th>
              <th className="p-2">Code</th>
              <th className="p-2">Official Buy</th>
              <th className="p-2">Official Sell</th>
              <th className="p-2">Parallel Buy</th>
              <th className="p-2">Parallel Sell</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.currencyCode}-${i}`} className="border-b border-slate-100">
                <td className="p-2">{row.currencyName}</td>
                <td className="p-2">{row.currencyCode}</td>
                <td className="p-2">{row.officialBuy ?? "-"}</td>
                <td className="p-2">{row.officialSell ?? "-"}</td>
                <td className="p-2">{row.parallelBuy ?? "-"}</td>
                <td className="p-2">{row.parallelSell ?? "-"}</td>
                <td className="p-2">{String(row.rateDate).slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
