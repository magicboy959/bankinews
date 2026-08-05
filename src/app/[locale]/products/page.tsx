import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let products: any[] = [];
  try {
    products = await dbQuery<any[]>(
      `SELECT p.slug, p.product_category AS category, bt.name AS bankName,
              pt.name, pt.short_description AS shortDescription
       FROM products p
       JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       JOIN banks b ON b.id = p.bank_id
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE p.deleted_at IS NULL
       ORDER BY p.updated_at DESC`,
      [safeLocale, safeLocale]
    );
  } catch {
    products = [];
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((product) => (
        <article key={product.slug} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">
            <Link href={`/${safeLocale}/products/${product.slug}`}>{product.name}</Link>
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.bankName} • {product.category}</p>
          <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
        </article>
      ))}
    </div>
  );
}
