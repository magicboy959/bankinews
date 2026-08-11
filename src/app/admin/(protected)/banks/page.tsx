import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { BankAdminManager } from "@/components/admin/bank-admin-manager";

type BankRow = DbRow & {
  id: number;
  slug: string;
  name: string;
  headquarters: string | null;
  swiftCode: string | null;
  showOnWebsite: number | boolean;
  officialWebsite: string | null;
  shortDescription: string | null;
  lastUpdatedDate: string | null;
  updatedAt: string;
};

export default async function AdminBanksPage() {
  const rows = await dbQuery<BankRow[]>(
    `SELECT b.id, b.slug, bt.name, bt.short_description AS shortDescription,
            b.official_website AS officialWebsite, b.headquarters, b.swift_code AS swiftCode,
            b.show_on_website AS showOnWebsite, b.last_updated_date AS lastUpdatedDate,
            b.updated_at AS updatedAt
     FROM banks b
     LEFT JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
     WHERE b.deleted_at IS NULL
     ORDER BY b.updated_at DESC
     LIMIT 50`
  );

  return <BankAdminManager initialRows={rows} />;
}
