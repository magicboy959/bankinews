import type { Metadata } from "next";
import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";
import { buildMetadata } from "@/lib/seo/metadata";

type BankRow = DbRow & {
  slug: string;
  name: string;
  shortDescription: string;
};

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
  const isArabic = safeLocale === "ar";

  let banks: BankRow[] = [];
  let arabicBankCount = 0;
  try {
    banks = await dbQuery<BankRow[]>(
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

  const reviewPoints = isArabic
    ? [
        "تحقق من الاسم القانوني للبنك وقنواته الرسمية قبل استخدام أي رابط أو رقم هاتف.",
        "راجع الخدمات الرقمية والفروع وأجهزة الصراف المتاحة في منطقتك قبل فتح حساب.",
        "قارن الرسوم والحدود من المصدر الرسمي، خصوصاً عند التحويلات والبطاقات والحسابات التجارية.",
      ]
    : [
        "Confirm the bank’s legal name and official channels before using any link or phone number.",
        "Review digital services, branches, and ATM access in your area before opening an account.",
        "Compare fees and limits from the official source, especially for transfers, cards, and business accounts.",
      ];

  return (
    <div className="space-y-10">
      <header className="rounded-2xl border border-[#005F73]/20 bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#005F73]">
          {isArabic ? "دليل مؤسسات مصرفية" : "Banking Institution Directory"}
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--foreground)] md:text-4xl">
          {isArabic ? "البنوك السودانية" : "Sudanese Banks"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
          {isArabic
            ? "دليل منظم للبنوك التي تتم مراجعتها للنشر على بنكي نيوز، مع روابط إلى ملفات البنوك والمنتجات والأخبار ذات الصلة عند توفرها."
            : "A structured directory of banks reviewed for publication on BankiNews, with links to bank profiles, products, and related coverage when available."}
        </p>
      </header>

      <section aria-labelledby="bank-review-guide" className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 id="bank-review-guide" className="text-lg font-black">
          {isArabic ? "قبل التعامل مع أي بنك" : "Before Using Any Bank"}
        </h2>
        <ul className="mt-3 space-y-2">
          {reviewPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="bank-list">
        <h2 id="bank-list" className="text-2xl font-black text-[var(--foreground)]">
          {isArabic ? "قائمة البنوك" : "Bank List"}
        </h2>
        {banks.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {banks.map((bank) => (
              <article key={bank.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  <Link href={`/${safeLocale}/banks/${bank.slug}`}>{bank.name}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{bank.shortDescription}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#005F73]/35 bg-[#005F73]/5 p-6">
            <h3 className="text-lg font-black text-[var(--foreground)]">
              {isArabic ? "لا توجد ملفات بنوك جاهزة للنشر" : "No bank profiles are ready for publication"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
              {isArabic
                ? "نعرض فقط الملفات التي تمت مراجعتها وتفعيلها للموقع. يمكنك متابعة الأخبار والمنتجات المنشورة إلى حين اكتمال مراجعة ملفات البنوك."
                : "We display only profiles that have been reviewed and enabled for the website. You can follow published news and products while bank profiles are being reviewed."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
