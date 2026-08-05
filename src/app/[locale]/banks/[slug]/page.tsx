import { notFound } from "next/navigation";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function BankProfilePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let bank: any = null;
  try {
    const rows = await dbQuery<any[]>(
      `SELECT b.slug, b.official_website AS officialWebsite, b.headquarters, b.swift_code AS swiftCode,
              b.customer_service_numbers AS customerServiceNumbers,
              bt.name, bt.short_description AS shortDescription, bt.full_description AS fullDescription
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.slug = ? AND b.deleted_at IS NULL
       LIMIT 1`,
      [safeLocale, slug]
    );
    bank = rows[0] ?? null;
  } catch {
    bank = null;
  }

  if (!bank) {
    notFound();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-black text-slate-900">{bank.name}</h1>
      <p className="mt-3 text-slate-600">{bank.shortDescription}</p>
      <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="font-semibold text-slate-700">Website</dt><dd>{bank.officialWebsite ?? "-"}</dd></div>
        <div><dt className="font-semibold text-slate-700">SWIFT</dt><dd>{bank.swiftCode ?? "-"}</dd></div>
        <div><dt className="font-semibold text-slate-700">Headquarters</dt><dd>{bank.headquarters ?? "-"}</dd></div>
        <div><dt className="font-semibold text-slate-700">Customer Service</dt><dd>{bank.customerServiceNumbers ?? "-"}</dd></div>
      </dl>
      {bank.fullDescription && <p className="mt-6 whitespace-pre-wrap text-slate-700">{bank.fullDescription}</p>}
    </div>
  );
}
