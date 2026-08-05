import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function BanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let banks: any[] = [];
  try {
    banks = await dbQuery<any[]>(
      `SELECT b.slug, bt.name, bt.short_description AS shortDescription
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.deleted_at IS NULL
       ORDER BY bt.name ASC`,
      [safeLocale]
    );
  } catch {
    banks = [];
  }

  return (
    <div className="space-y-4">
      {banks.map((bank) => (
        <article key={bank.slug} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">
            <Link href={`/${safeLocale}/banks/${bank.slug}`}>{bank.name}</Link>
          </h2>
          <p className="mt-2 text-sm text-slate-600">{bank.shortDescription}</p>
        </article>
      ))}
    </div>
  );
}
