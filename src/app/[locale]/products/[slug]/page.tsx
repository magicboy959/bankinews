import { notFound } from "next/navigation";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let product: any = null;
  try {
    const rows = await dbQuery<any[]>(
      `SELECT p.slug, p.product_category AS category, p.official_source_url AS officialSourceUrl,
              p.last_verified_date AS lastVerifiedDate, bt.name AS bankName,
              pt.name, pt.short_description AS shortDescription, pt.description,
              pt.eligibility, pt.required_documents AS requiredDocuments,
              pt.fees, pt.limits_text AS limitsText, pt.benefits, pt.application_process AS applicationProcess
       FROM products p
       JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       JOIN banks b ON b.id = p.bank_id
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE p.slug = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [safeLocale, safeLocale, slug]
    );
    product = rows[0] ?? null;
  } catch {
    product = null;
  }

  if (!product) {
    if (safeLocale === "en") {
      try {
        const fallbackRows = await dbQuery<Array<{ slug: string }>>(
          `SELECT p.slug
           FROM products p
           JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ar'
           WHERE p.slug = ? AND p.deleted_at IS NULL
           LIMIT 1`,
          [slug]
        );

        if (fallbackRows.length) {
          return <LanguageUnavailableNotice arabicHref={`/ar/products/${slug}`} contextLabel="product" />;
        }
      } catch {
        // Keep default notFound behavior if fallback check fails.
      }
    }

    notFound();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-black text-slate-900">{product.name}</h1>
      <p className="mt-2 text-sm text-slate-500">{product.bankName} • {product.category}</p>
      <p className="mt-4 text-slate-700">{product.description}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div><h2 className="font-bold text-slate-900">Eligibility</h2><p className="text-slate-600">{product.eligibility ?? "-"}</p></div>
        <div><h2 className="font-bold text-slate-900">Required Documents</h2><p className="text-slate-600">{product.requiredDocuments ?? "-"}</p></div>
        <div><h2 className="font-bold text-slate-900">Fees</h2><p className="text-slate-600">{product.fees ?? "-"}</p></div>
        <div><h2 className="font-bold text-slate-900">Limits</h2><p className="text-slate-600">{product.limitsText ?? "-"}</p></div>
      </div>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Do not enter banking passwords, OTPs, card PINs, or CVV on this website. Apply only through the official bank link.
      </div>

      {product.officialSourceUrl && (
        <a href={product.officialSourceUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-md bg-[#0A2342] px-4 py-2 text-white">
          Visit Official Bank Page
        </a>
      )}
    </div>
  );
}
