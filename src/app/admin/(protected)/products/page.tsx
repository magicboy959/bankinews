import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { ProductAdminManager } from "@/components/admin/product-admin-manager";

type ProductRow = DbRow & {
  id: number;
  slug: string;
  category: string;
  bankName: string | null;
  name: string | null;
  updatedAt: string;
};

type BankOptionRow = DbRow & {
  id: number;
  name: string;
};

export default async function AdminProductsPage() {
  const [rows, bankOptions] = await Promise.all([
    dbQuery<ProductRow[]>(
      `SELECT p.id, p.slug, p.product_category AS category, p.updated_at AS updatedAt,
              bt.name AS bankName, pt.name
       FROM products p
       LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'ar'
       LEFT JOIN banks b ON b.id = p.bank_id
       LEFT JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
       WHERE p.deleted_at IS NULL
       ORDER BY p.updated_at DESC
       LIMIT 50`
    ),
    dbQuery<BankOptionRow[]>(
      `SELECT b.id, bt.name
       FROM banks b
       LEFT JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
       WHERE b.deleted_at IS NULL AND bt.name IS NOT NULL
       ORDER BY bt.name ASC`
    ),
  ]);

  return <ProductAdminManager initialRows={rows} bankOptions={bankOptions} />;
}