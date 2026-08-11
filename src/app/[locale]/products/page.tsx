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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((product) => (
        <article key={product.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
          <h2 className="text-xl font-black text-[var(--foreground)]">
            <Link href={`/${safeLocale}/products/${product.slug}`}>{product.name}</Link>
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.bankName} • {product.category}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{product.shortDescription}</p>
        </article>
      ))}
    </div>
  );
}
