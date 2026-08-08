import type { Metadata } from "next";
import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";
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
    title: safeLocale === "ar" ? "البنوك السودانية" : "Sudanese Banks",
    description:
      safeLocale === "ar"
        ? "دليل البنوك السودانية العاملة وخدماتها المصرفية"
        : "Directory of active Sudanese banks and their banking services",
    path: `/${safeLocale}/banks`,
  });
}

export default async function BanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let banks: any[] = [];
  let arabicBankCount = 0;
  try {
    banks = await dbQuery<any[]>(
      `SELECT b.slug, bt.name, bt.short_description AS shortDescription
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.deleted_at IS NULL AND b.show_on_website = 1
       ORDER BY bt.name ASC`,
      [safeLocale]
    );

    if (safeLocale === "en") {
      const arabicRows = await dbQuery<Array<{ count: number }>>(
        `SELECT COUNT(*) AS count
         FROM banks b
         JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
         WHERE b.deleted_at IS NULL AND b.show_on_website = 1`
      );
      arabicBankCount = Number(arabicRows[0]?.count ?? 0);
    }
  } catch {
    banks = [];
  }

  if (safeLocale === "en" && banks.length === 0 && arabicBankCount > 0) {
    return <LanguageUnavailableNotice arabicHref="/ar/banks" contextLabel="bank listings" />;
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
