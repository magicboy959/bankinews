import type { Metadata } from "next";
import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";
import { buildMetadata } from "@/lib/seo/metadata";

type ProductRow = DbRow & {
  slug: string;
  category: string;
  bankName: string;
  name: string;
  shortDescription: string;
};

type CountRow = DbRow & { count: number };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "المنتجات والخدمات المصرفية" : "Banking Products & Services",
    description:
      safeLocale === "ar"
        ? "استعرض المنتجات والخدمات المصرفية المتاحة من البنوك السودانية"
        : "Browse banking products and services available from Sudanese banks",
    path: `/${safeLocale}/products`,
  });
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  let products: ProductRow[] = [];
  let arabicProductCount = 0;
  try {
    products = await dbQuery<ProductRow[]>(
      `SELECT p.slug, p.product_category AS category, bt.name AS bankName,
              pt.name, pt.short_description AS shortDescription
       FROM products p
       JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       JOIN banks b ON b.id = p.bank_id
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE p.deleted_at IS NULL AND p.slug NOT LIKE 'demo-%'
       ORDER BY p.updated_at DESC`,
      [safeLocale, safeLocale]
    );

    if (safeLocale === "en") {
      const arabicRows = await dbQuery<CountRow[]>(
        `SELECT COUNT(*) AS count
         FROM products p
         JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ar'
         WHERE p.deleted_at IS NULL AND p.slug NOT LIKE 'demo-%'`
      );
      arabicProductCount = Number(arabicRows[0]?.count ?? 0);
    }
  } catch {
    products = [];
  }

  if (safeLocale === "en" && products.length === 0 && arabicProductCount > 0) {
    return <LanguageUnavailableNotice arabicHref="/ar/products" contextLabel="product listings" />;
  }

  const categories = isArabic
    ? [
        { icon: "🏦", title: "الحسابات المصرفية", text: "تعرف على الحسابات الجارية وحسابات التوفير والشباب والأعمال من صفحات البنوك الرسمية.", href: `/${safeLocale}/banks`, action: "استعرض البنوك" },
        { icon: "💳", title: "البطاقات والصرافات", text: "دليل أنواع البطاقات والرسوم والحدود والاستخدام الآمن لأجهزة الصراف والشراء الإلكتروني.", href: `/${safeLocale}/cards-atms`, action: "فتح الدليل" },
        { icon: "🌍", title: "التحويلات المالية", text: "راجع التحويلات المحلية والدولية والرسوم وأسعار الصرف وبيانات المستفيد والأمان.", href: `/${safeLocale}/money-transfers`, action: "فتح الدليل" },
        { icon: "📖", title: "أدلة مصرفية", text: "اقرأ الأدلة التحريرية التي تشرح الخدمات المصرفية وكيفية التحقق من الشروط والمصادر.", href: `/${safeLocale}/guides`, action: "اقرأ الأدلة" },
      ]
    : [
        { icon: "🏦", title: "Bank accounts", text: "Explore current, savings, youth, and business accounts through verified bank profiles and official sources.", href: `/${safeLocale}/banks`, action: "Browse banks" },
        { icon: "💳", title: "Cards and ATMs", text: "Understand card types, fees, limits, ATM safety, and online purchases.", href: `/${safeLocale}/cards-atms`, action: "Open guide" },
        { icon: "🌍", title: "Money transfers", text: "Review local and international transfers, fees, exchange rates, beneficiary details, and security.", href: `/${safeLocale}/money-transfers`, action: "Open guide" },
        { icon: "📖", title: "Banking guides", text: "Read editorial guides explaining banking services and how to verify terms and sources.", href: `/${safeLocale}/guides`, action: "Read guides" },
      ];

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-[#005F73]/20 bg-gradient-to-br from-[#0A2342] to-[#005F73] p-6 text-white md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Banki News Directory</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{isArabic ? "المنتجات والخدمات المصرفية" : "Banking Products & Services"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          {isArabic
            ? "استكشف فئات الخدمات المصرفية، وقارن المعلومات المنشورة، وانتقل إلى المصدر الرسمي للبنك قبل اتخاذ أي قرار."
            : "Explore banking-service categories, compare published information, and visit the bank’s official source before making a decision."}
        </p>
      </header>

      <section aria-labelledby="product-categories">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#005F73]">{isArabic ? "اختر الخدمة" : "Choose a service"}</p>
        <h2 id="product-categories" className="mt-1 text-2xl font-black text-[var(--foreground)]">{isArabic ? "فئات المنتجات" : "Product categories"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)]">
              <span aria-hidden="true" className="text-2xl">{category.icon}</span>
              <h3 className="mt-3 text-xl font-black text-[var(--foreground)]">{category.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{category.text}</p>
              <Link href={category.href} className="mt-4 inline-flex font-bold text-[#005F73] underline underline-offset-4">{category.action}</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="verified-products" aria-labelledby="verified-products-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#005F73]">{isArabic ? "معلومات موثقة" : "Verified information"}</p>
            <h2 id="verified-products-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">{isArabic ? "منتجات البنوك" : "Bank products"}</h2>
          </div>
          <Link href={`/${safeLocale}/banks`} className="text-sm font-bold text-[#005F73] underline">{isArabic ? "دليل البنوك" : "Bank directory"}</Link>
        </div>

        {products.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <article key={product.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  <Link href={`/${safeLocale}/products/${product.slug}`} className="hover:text-[#005F73]">{product.name}</Link>
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.bankName} • {product.category}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{product.shortDescription}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#005F73]/35 bg-[#005F73]/5 p-6 text-center">
            <h3 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "نعمل على التحقق من المنتجات قبل عرضها" : "We are verifying products before listing them"}</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              {isArabic
                ? "لا نعرض سجلات تجريبية أو شروطاً غير موثقة. استخدم أدلة الخدمات أعلاه أو صفحات البنوك، وسنضيف المنتجات هنا بعد مراجعة المصدر الرسمي."
                : "We do not display demo records or unverified terms. Use the service guides or bank profiles above; products will appear here after official-source review."}
            </p>
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="font-black">{isArabic ? "قبل اختيار أي منتج" : "Before choosing a product"}</h2>
        <p className="mt-1">
          {isArabic
            ? "تحقق من الرسوم والحدود والأهلية والمستندات وتاريخ آخر مراجعة، وقدم فقط عبر الموقع أو التطبيق أو الفرع الرسمي للبنك."
            : "Verify fees, limits, eligibility, documents, and the last review date, and apply only through the bank’s official website, app, or branch."}
        </p>
      </aside>
    </div>
  );
}
