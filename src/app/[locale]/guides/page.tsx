import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import Link from "next/link";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let guides: any[] = [];
  let arabicGuideCount = 0;
  try {
    guides = await dbQuery<any[]>(
      `SELECT a.slug, at.title, at.summary
       FROM articles a
       JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
       WHERE a.status = 'published' AND a.article_type = 'guide' AND a.deleted_at IS NULL
       ORDER BY a.published_at DESC
       LIMIT 50`,
      [safeLocale]
    );

    if (safeLocale === "en") {
      const arabicRows = await dbQuery<Array<{ count: number }>>(
        `SELECT COUNT(*) AS count
         FROM articles a
         JOIN article_translations at ON at.article_id = a.id AND at.locale = 'ar'
         WHERE a.status = 'published' AND a.article_type = 'guide' AND a.deleted_at IS NULL`
      );
      arabicGuideCount = Number(arabicRows[0]?.count ?? 0);
    }
  } catch {
    guides = [];
  }

  if (safeLocale === "en" && guides.length === 0 && arabicGuideCount > 0) {
    return <LanguageUnavailableNotice arabicHref="/ar/guides" contextLabel="guides" />;
  }

  return (
    <div className="space-y-4">
      {guides.map((guide) => (
        <article key={guide.slug} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">
            <Link href={`/${safeLocale}/news/${guide.slug}`}>{guide.title}</Link>
          </h2>
          <p className="mt-2 text-sm text-slate-600">{guide.summary}</p>
        </article>
      ))}
    </div>
  );
}
