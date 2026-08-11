import { notFound, redirect } from "next/navigation";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";

type ProductRow = DbRow & {
  slug: string;
  category: string;
  officialSourceUrl: string | null;
  lastVerifiedDate: string | null;
  bankName: string;
  name: string;
  shortDescription: string;
  description: string;
  eligibility: string | null;
  requiredDocuments: string | null;
  fees: string | null;
  limitsText: string | null;
  benefits: string | null;
  applicationProcess: string | null;
};

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  if (slug.startsWith("demo-")) {
    if (slug.includes("transfer") || slug.includes("remittance")) redirect(`/${safeLocale}/money-transfers`);
    if (slug.includes("card") || slug.includes("atm")) redirect(`/${safeLocale}/cards-atms`);
    redirect(`/${safeLocale}/products`);
  }

  let product: ProductRow | null = null;
  try {
    const rows = await dbQuery<ProductRow[]>(
      `SELECT p.slug, p.product_category AS category, p.official_source_url AS officialSourceUrl,
              p.last_verified_date AS lastVerifiedDate, bt.name AS bankName,
              pt.name, pt.short_description AS shortDescription, pt.description,
              pt.eligibility, pt.required_documents AS requiredDocuments,
              pt.fees, pt.limits_text AS limitsText, pt.benefits, pt.application_process AS applicationProcess
       FROM products p
       JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       JOIN banks b ON b.id = p.bank_id
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE p.slug = ? AND p.deleted_at IS NULL AND p.slug NOT LIKE 'demo-%'
       LIMIT 1`,
      [safeLocale, safeLocale, slug]
    );
    product = rows[0] ?? null;
  } catch {
    product = null;
  }

  if (!product) {
    if (safeLocale === "en") {
      let hasArabicVersion = false;
      try {
        const fallbackRows = await dbQuery<Array<{ slug: string }>>(
          `SELECT p.slug
           FROM products p
           JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ar'
           WHERE p.slug = ? AND p.deleted_at IS NULL AND p.slug NOT LIKE 'demo-%'
           LIMIT 1`,
          [slug]
        );
        hasArabicVersion = fallbackRows.length > 0;
      } catch {
        // Keep default notFound behavior if fallback check fails.
      }

      if (hasArabicVersion) {
        return <LanguageUnavailableNotice arabicHref={`/ar/products/${slug}`} contextLabel="product" />;
      }
    }

    notFound();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-3xl font-black text-[var(--foreground)]">{product.name}</h1>
      <p className="mt-2 text-sm text-[var(--text-subtle)]">{product.bankName} • {product.category}</p>
      <p className="mt-4 leading-7 text-[var(--text-muted)]">{product.description}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "شروط الأهلية" : "Eligibility"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.eligibility ?? "-"}</p></div>
        <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "المستندات المطلوبة" : "Required Documents"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.requiredDocuments ?? "-"}</p></div>
        <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "الرسوم" : "Fees"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.fees ?? "-"}</p></div>
        <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "الحدود" : "Limits"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.limitsText ?? "-"}</p></div>
        {product.benefits ? <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "المزايا" : "Benefits"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.benefits}</p></div> : null}
        {product.applicationProcess ? <div><h2 className="font-bold text-[var(--foreground)]">{safeLocale === "ar" ? "طريقة التقديم" : "How to Apply"}</h2><p className="mt-1 text-[var(--text-muted)]">{product.applicationProcess}</p></div> : null}
      </div>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {safeLocale === "ar"
          ? "لا تدخل كلمات المرور المصرفية أو رموز التحقق أو الرقم السري للبطاقة أو CVV في هذا الموقع. قدم فقط عبر رابط البنك الرسمي."
          : "Do not enter banking passwords, OTPs, card PINs, or CVV on this website. Apply only through the official bank link."}
      </div>

      {product.officialSourceUrl && (
        <a href={product.officialSourceUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-md bg-[#0A2342] px-4 py-2 text-white">
          {safeLocale === "ar" ? "زيارة صفحة البنك الرسمية" : "Visit Official Bank Page"}
        </a>
      )}
    </div>
  );
}
