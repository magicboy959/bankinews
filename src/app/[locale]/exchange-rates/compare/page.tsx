import { isLocale, type Locale } from "@/lib/i18n/config";
import { ExchangeRatesCompare } from "@/components/ui/exchange-rates-compare";

export default async function ExchangeRatesComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  const labels =
    safeLocale === "ar"
      ? {
          title: "مقارنة أسعار الصرف",
          subtitle: "قارن أسعار الشراء والبيع بين البنوك وشركات الصرافة حسب العملة والتاريخ.",
          currency: "العملة",
          date: "التاريخ",
          sourceType: "نوع المصدر",
          sortBy: "الترتيب",
          apply: "تطبيق",
          reset: "إعادة",
          loading: "جاري تحميل المقارنة...",
          noData: "اختر العملة والخيارات ثم اضغط تطبيق لعرض النتائج.",
          source: "المصدر",
          buy: "سعر الشراء",
          sell: "سعر البيع",
          spread: "الفارق",
          type: "النوع",
          compareHint: "النتائج معلوماتية وقد تتغير خلال اليوم.",
          sourceAll: "الكل",
          sourceBank: "بنك",
          sourceExchange: "شركة صرافة",
          sortBuyDesc: "أعلى شراء",
          sortBuyAsc: "أقل شراء",
          sortSellDesc: "أعلى بيع",
          sortSellAsc: "أقل بيع",
          bestBuy: "أفضل شراء",
          bestSell: "أفضل بيع",
          lowestBuy: "أقل شراء",
          lowestSell: "أقل بيع",
          asOf: "تاريخ البيانات",
          sourceTypeBank: "بنك",
          sourceTypeExchange: "شركة صرافة",
          sourceTypeOther: "أخرى",
          sourceTypeCentralBank: "بنك مركزي",
          errorLoad: "تعذر تحميل بيانات المقارنة",
          trendsTitle: "اتجاهات الأسعار",
          trendsSubtitle: "تطور الأسعار حسب المصدر خلال الفترة المختارة.",
          trendDays: "الفترة",
          trendMetric: "المؤشر",
          trendMetricBuy: "الشراء",
          trendMetricSell: "البيع",
          trendNoData: "لا توجد بيانات اتجاهات كافية لهذه الخيارات.",
          trendLoading: "جاري تحميل الاتجاهات...",
          trendRange: "النطاق",
          trendChange: "التغير",
          topMoversTitle: "أهم التحركات حسب المصدر",
          strongestRise: "أقوى ارتفاع",
          strongestDrop: "أكبر تراجع",
          highestVolatility: "أعلى تذبذب",
          volatility: "التذبذب",
          trust: "الموثوقية",
          trustHigh: "عالية",
          trustMedium: "متوسطة",
          trustLow: "منخفضة",
          trustUnverified: "غير موثقة",
          freshness: "حداثة التحديث",
          freshNow: "الآن",
          freshMinutes: "{n} دقيقة",
          freshHours: "{n} ساعة",
          freshDays: "{n} يوم",
        }
      : {
          title: "Exchange Rate Compare",
          subtitle: "Compare buy and sell rates across banks and exchange companies by currency and date.",
          currency: "Currency",
          date: "Date",
          sourceType: "Source type",
          sortBy: "Sort",
          apply: "Apply",
          reset: "Reset",
          loading: "Loading comparison...",
          noData: "Choose filters and apply to show results.",
          source: "Source",
          buy: "Buy rate",
          sell: "Sell rate",
          spread: "Spread",
          type: "Type",
          compareHint: "Rates are informational and can change during the day.",
          sourceAll: "All",
          sourceBank: "Bank",
          sourceExchange: "Exchange company",
          sortBuyDesc: "Highest buy",
          sortBuyAsc: "Lowest buy",
          sortSellDesc: "Highest sell",
          sortSellAsc: "Lowest sell",
          bestBuy: "Best buy",
          bestSell: "Best sell",
          lowestBuy: "Lowest buy",
          lowestSell: "Lowest sell",
          asOf: "Data date",
          sourceTypeBank: "Bank",
          sourceTypeExchange: "Exchange company",
          sourceTypeOther: "Other",
          sourceTypeCentralBank: "Central bank",
          errorLoad: "Unable to load comparison",
          trendsTitle: "Rate Trends",
          trendsSubtitle: "How rates move by source over the selected period.",
          trendDays: "Window",
          trendMetric: "Metric",
          trendMetricBuy: "Buy",
          trendMetricSell: "Sell",
          trendNoData: "Not enough trend data for these filters.",
          trendLoading: "Loading trends...",
          trendRange: "Range",
          trendChange: "Change",
          topMoversTitle: "Top Movers by Source",
          strongestRise: "Strongest Rise",
          strongestDrop: "Strongest Drop",
          highestVolatility: "Highest Volatility",
          volatility: "Volatility",
          trust: "Trust",
          trustHigh: "High",
          trustMedium: "Medium",
          trustLow: "Low",
          trustUnverified: "Unverified",
          freshness: "Freshness",
          freshNow: "Now",
          freshMinutes: "{n} min",
          freshHours: "{n} hr",
          freshDays: "{n} day",
        };

  const toSingle = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  return (
    <ExchangeRatesCompare
      locale={safeLocale}
      labels={labels}
      initialCurrencyCode={toSingle(query.currencyCode) || "USD"}
      initialDate={toSingle(query.date)}
      initialSourceType={toSingle(query.sourceType) as "all" | "bank" | "exchange_company"}
      initialSort={toSingle(query.sort) as "buy_desc" | "buy_asc" | "sell_desc" | "sell_asc"}
    />
  );
}
