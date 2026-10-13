import type { Metadata } from "next";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import Link from "next/link";
import { LanguageUnavailableNotice } from "@/components/ui/language-unavailable-notice";
import { buildMetadata } from "@/lib/seo/metadata";

type GuideRow = DbRow & {
  slug: string;
  title: string;
  summary: string;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "أدلة مصرفية عملية" : "Practical Banking Guides",
    description:
      safeLocale === "ar"
        ? "أدلة بنكي نيوز لفهم الخدمات المصرفية، التحقق من الرسوم والمصادر، وحماية الحسابات قبل اتخاذ قرارات مالية."
        : "BankiNews guides for understanding banking services, checking fees and sources, and protecting accounts before financial decisions.",
    path: `/${safeLocale}/guides`,
  });
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  let guides: GuideRow[] = [];
  let arabicGuideCount = 0;
  try {
    guides = await dbQuery<GuideRow[]>(
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

  const guideTopics = isArabic
    ? [
        {
          title: "كيف تتحقق من الرسوم؟",
          text: "ابدأ بجدول الرسوم الرسمي للبنك، ثم راجع رسوم الطرف الثالث والضرائب وفارق سعر الصرف قبل المقارنة بين الخدمات.",
        },
        {
          title: "ما الذي يجب فحصه قبل فتح حساب؟",
          text: "راجع الحد الأدنى للرصيد، المستندات المطلوبة، قنوات الخدمة، رسوم الإدارة، حدود السحب، وآلية إغلاق الحساب.",
        },
        {
          title: "كيف تتعامل مع عرض مصرفي؟",
          text: "افصل بين الإعلان والشروط الفعلية. ابحث عن تاريخ العرض، شروط الأهلية، مدة السريان، ومصدر البنك الرسمي.",
        },
        {
          title: "متى تطلب تصحيحاً؟",
          text: "إذا وجدت رسماً غير محدث أو رابطاً خاطئاً أو معلومة تخالف المصدر الرسمي، أرسل التفاصيل عبر صفحة الاتصال ليتم توثيق المراجعة.",
        },
      ]
    : [
        {
          title: "How to verify fees",
          text: "Start with the bank’s official tariff, then check third-party fees, taxes, and exchange-rate spreads before comparing services.",
        },
        {
          title: "Before opening an account",
          text: "Review minimum balance, required documents, service channels, maintenance fees, withdrawal limits, and closure rules.",
        },
        {
          title: "Reading banking offers",
          text: "Separate the advert from the actual terms. Check the offer date, eligibility rules, validity period, and official bank source.",
        },
        {
          title: "Requesting a correction",
          text: "If a fee, link, or product detail conflicts with the official source, send the details through the contact page for editorial review.",
        },
      ];

  return (
    <div className="space-y-10">
      <header className="rounded-2xl border border-[#005F73]/20 bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#005F73]">
          {isArabic ? "معرفة مصرفية قابلة للتحقق" : "Verifiable Banking Knowledge"}
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--foreground)] md:text-4xl">
          {isArabic ? "أدلة مصرفية عملية" : "Practical Banking Guides"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
          {isArabic
            ? "تجمع هذه الصفحة الأدلة التحريرية التي تساعد القراء على فهم الخدمات المصرفية، مقارنة الشروط، والتحقق من المصادر قبل اتخاذ قرارات مالية."
            : "This page collects editorial guides that help readers understand banking services, compare terms, and verify sources before making financial decisions."}
        </p>
      </header>

      <section aria-labelledby="guide-topics">
        <h2 id="guide-topics" className="text-2xl font-black text-[var(--foreground)]">
          {isArabic ? "موضوعات نراجعها باستمرار" : "Topics We Maintain"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {guideTopics.map((topic) => (
            <article key={topic.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
              <h3 className="text-lg font-black text-[var(--foreground)]">{topic.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{topic.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="published-guides">
        <h2 id="published-guides" className="text-2xl font-black text-[var(--foreground)]">
          {isArabic ? "الأدلة المنشورة" : "Published Guides"}
        </h2>
        {guides.length ? (
          <div className="mt-4 space-y-4">
            {guides.map((guide) => (
              <article key={guide.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  <Link href={`/${safeLocale}/news/${guide.slug}`}>{guide.title}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{guide.summary}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#005F73]/35 bg-[#005F73]/5 p-6">
            <h3 className="text-lg font-black text-[var(--foreground)]">
              {isArabic ? "لا ننشر أدلة غير مكتملة" : "We do not publish incomplete guides"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
              {isArabic
                ? "ستظهر الأدلة هنا بعد مراجعة المصدر وتحرير المحتوى وإضافة تاريخ التحديث. إلى حين ذلك، استخدم صفحات البنوك والمنتجات وأسعار الصرف كمراجع منظمة."
                : "Guides will appear here after source review, editorial editing, and update dating. Until then, use the bank, product, and exchange-rate pages as structured references."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${safeLocale}/banks`} className="rounded-md bg-[#0A2342] px-4 py-2 text-sm font-bold text-white">
                {isArabic ? "دليل البنوك" : "Bank directory"}
              </Link>
              <Link href={`/${safeLocale}/products`} className="rounded-md border border-[#005F73]/30 px-4 py-2 text-sm font-bold text-[#005F73]">
                {isArabic ? "المنتجات المصرفية" : "Bank products"}
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
