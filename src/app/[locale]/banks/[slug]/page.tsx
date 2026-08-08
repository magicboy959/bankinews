import { notFound } from "next/navigation";
import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";

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
    if (safeLocale === "en") {
      try {
        const fallbackRows = await dbQuery<Array<{ slug: string }>>(
          `SELECT b.slug
           FROM banks b
           JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = 'ar'
           WHERE b.slug = ? AND b.deleted_at IS NULL
           LIMIT 1`,
          [slug]
        );

        if (fallbackRows.length) {
          return <LanguageUnavailableNotice arabicHref={`/ar/banks/${slug}`} contextLabel="bank profile" />;
        }
      } catch {
        // Keep default notFound behavior if fallback check fails.
      }
    }

    notFound();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-3xl font-black text-[var(--foreground)]">{bank.name}</h1>
      <p className="mt-3 text-[var(--text-muted)]">{bank.shortDescription}</p>
      <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="font-semibold text-[var(--text-muted)]">Website</dt><dd className="mt-1 text-[var(--text-subtle)]">{bank.officialWebsite ?? "-"}</dd></div>
        <div><dt className="font-semibold text-[var(--text-muted)]">SWIFT</dt><dd className="mt-1 text-[var(--text-subtle)]">{bank.swiftCode ?? "-"}</dd></div>
        <div><dt className="font-semibold text-[var(--text-muted)]">Headquarters</dt><dd className="mt-1 text-[var(--text-subtle)]">{bank.headquarters ?? "-"}</dd></div>
        <div><dt className="font-semibold text-[var(--text-muted)]">Customer Service</dt><dd className="mt-1 text-[var(--text-subtle)]">{bank.customerServiceNumbers ?? "-"}</dd></div>
      </dl>
      {bank.fullDescription && <p className="mt-6 whitespace-pre-wrap text-[var(--text-muted)]">{bank.fullDescription}</p>}
    </div>
  );
}
