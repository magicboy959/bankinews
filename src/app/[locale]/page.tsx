import type { Metadata } from "next";
import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getHomepageData } from "@/services/homepage-service";
import { ArticleCardView } from "@/components/articles/article-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { HeroCarousel } from "@/components/home/hero-carousel";
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
    title: safeLocale === "ar" ? "بنكي نيوز السودان" : "BankiNews Sudan",
    description:
      safeLocale === "ar"
        ? "منصة أخبار ومعلومات مصرفية للسودان — تغطي البنوك والخدمات المالية وأسعار الصرف"
        : "Sudan's banking and financial news platform covering banks, services, and exchange rates",
    path: `/${safeLocale}`,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const data = await getHomepageData(safeLocale);

  if (safeLocale === "en") {
    const hasEnglishHomepageContent = data.latest.length > 0 || data.fintech.length > 0 || data.mostRead.length > 0 || data.editorsPicks.length > 0;
    if (!hasEnglishHomepageContent) {
      const arabicData = await getHomepageData("ar");
      const hasArabicHomepageContent = arabicData.latest.length > 0 || arabicData.fintech.length > 0 || arabicData.mostRead.length > 0 || arabicData.editorsPicks.length > 0;

      if (hasArabicHomepageContent) {
        return <LanguageUnavailableNotice arabicHref="/ar" contextLabel="homepage" />;
      }
    }
  }

  const marketNotes =
    safeLocale === "ar"
      ? [
          "تعكس هذه النشرة اتجاهات السوق بناء على مواد منشورة ومصادر موثقة.",
          "لا تمثل أي مادة نصيحة استثمارية أو توصية مصرفية مباشرة.",
          "يرجى الرجوع إلى الجهة الرسمية قبل اتخاذ قرارات مالية.",
        ]
      : [
          "This briefing summarizes verified market and banking updates.",
          "Published material is informational and not investment advice.",
          "Always confirm details from the official institution before acting.",
        ];

  return (
    <div className="space-y-8 md:space-y-10">
      {data.featured ? <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-red-700">{t.labels.breaking}</p>
        <div className="text-sm text-[var(--text-muted)]">
          {data.featured.title}
        </div>
      </section> : null}

      {data.heroSlides.length ? <HeroCarousel locale={safeLocale} slides={data.heroSlides} /> : null}

      {data.latest.length ? <section>
        <SectionHeading title={t.labels.latest} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.latest.map((article) => (
            <ArticleCardView key={article.id} locale={safeLocale} article={article} />
          ))}
        </div>
      </section> : null}

      {data.fintech.length ? <section>
        <SectionHeading title={safeLocale === "ar" ? "التحول الرقمي والخدمات الحديثة" : "Digital Banking & Fintech"} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.fintech.map((article) => (
            <ArticleCardView key={`fin-${article.id}`} locale={safeLocale} article={article} />
          ))}
        </div>
      </section> : null}

      {data.mostRead.length || data.editorsPicks.length ? <section className="grid gap-6 md:grid-cols-2">
        {data.mostRead.length ? <div>
          <SectionHeading title={t.labels.mostRead} />
          <div className="space-y-3">
            {data.mostRead.map((article) => (
              <ArticleCardView key={`most-${article.id}`} locale={safeLocale} article={article} compact />
            ))}
          </div>
        </div> : null}
        {data.editorsPicks.length ? <div>
          <SectionHeading title={t.labels.editorsPicks} />
          <div className="space-y-3">
            {data.editorsPicks.map((article) => (
              <ArticleCardView key={`pick-${article.id}`} locale={safeLocale} article={article} compact />
            ))}
          </div>
        </div> : null}
      </section> : null}

      {data.featuredBank ? <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
        <SectionHeading title={t.labels.featuredBank} />
          <div>
            <p className="text-lg font-bold text-[var(--foreground)]">{data.featuredBank.name}</p>
            <p className="mt-2 text-sm text-[var(--foreground)]/70">{data.featuredBank.shortDescription}</p>
          </div>
      </section> : null}

      <section className="grid gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] md:grid-cols-2 md:p-6">
        <div>
          <SectionHeading title={safeLocale === "ar" ? "ملاحظات السوق" : "Market Notes"} />
          <ul className="space-y-2 text-sm text-[var(--foreground)]/80">
            {marketNotes.map((note) => (
              <li key={note} className="rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2">
                {note}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading title={safeLocale === "ar" ? "تحديثات تحريرية" : "Editorial Updates"} />
          <div className="space-y-3 text-sm text-[var(--foreground)]/80">
            <p>
              {safeLocale === "ar"
                ? "نعمل يوميا على مراجعة الأخبار المصرفية ومقارنتها مع البيانات الرسمية قبل النشر، مع توضيح تاريخ التحديث والمصدر." 
                : "Our editorial team verifies banking updates against official statements before publication, with clear source and update timestamps."}
            </p>
            <p>
              {safeLocale === "ar"
                ? "يتم تمييز المواد المدفوعة والرأي والبيانات الصحفية بشكل واضح لضمان الشفافية التحريرية."
                : "Sponsored content, opinion pieces, and press releases are clearly labeled to preserve editorial transparency."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
