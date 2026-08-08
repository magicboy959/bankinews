import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { dictionary } from "@/lib/i18n/dictionary";
import { getArticleBySlug, getArticleCorrectionHistory, getPublishedArticleLocalesBySlug, getPublishedArticles } from "@/services/article-service";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleCardView } from "@/components/articles/article-card";
import { ArticleReaderExperience } from "@/components/articles/article-reader-experience";
import { formatDate } from "@/lib/utils";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const article = await getArticleBySlug(safeLocale, slug);

  if (!article) {
    if (safeLocale === "en") {
      const availableLocales = await getPublishedArticleLocalesBySlug(slug);
      if (availableLocales.includes("ar")) {
        const relatedArabic = await getPublishedArticles("ar", 6);

        return (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h1 className="text-2xl font-black text-slate-900">Arabic Is Our Main Language</h1>
              <p className="mt-3 text-base leading-7 text-slate-700">
                This content is not available in this language right now.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                For the full story, please switch to the Arabic version.
              </p>
              <Link
                href={`/ar/news/${slug}`}
                className="mt-5 inline-flex rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white hover:bg-[#091b35]"
              >
                Open Arabic Version
              </Link>
            </article>

            <aside>
              <h2 className="mb-4 text-xl font-black text-[#0A2342]">Latest In Arabic</h2>
              <div className="space-y-3">
                {relatedArabic.map((card) => (
                  <ArticleCardView key={card.id} locale="ar" article={card} />
                ))}
              </div>
            </aside>
          </div>
        );
      }
    }

    notFound();
  }

  const related = (await getPublishedArticles(safeLocale, 6)).filter((a) => a.slug !== slug);
  const correctionHistory = await getArticleCorrectionHistory(article.id);

  function historyLabel(action: string): string {
    if (safeLocale === "ar") {
      if (action === "article_created") return "تم النشر";
      if (action === "article_updated") return "تم التحديث";
      if (action === "article_deleted") return "تم الحذف";
      return "تغيير";
    }

    if (action === "article_created") return "Published";
    if (action === "article_updated") return "Updated";
    if (action === "article_deleted") return "Deleted";
    return "Change";
  }

  function historySummary(item: (typeof correctionHistory)[number]): string {
    const changes = item.metadata?.changes as Record<string, { from: unknown; to: unknown }> | undefined;
    if (!changes) {
      return safeLocale === "ar" ? "لا توجد تفاصيل إضافية." : "No additional details.";
    }

    const changedFields = Object.entries(changes)
      .filter(([, value]) => String(value.from ?? "") !== String(value.to ?? ""))
      .slice(0, 3)
      .map(([key]) => key);

    if (!changedFields.length) {
      return safeLocale === "ar" ? "لا توجد حقول متغيرة مهمة." : "No material field changes were recorded.";
    }

    const joined = changedFields.join(", ");
    return safeLocale === "ar" ? `الحقول المعدلة: ${joined}` : `Changed fields: ${joined}`;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <article className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
          {article.isSponsored && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">{t.labels.sponsored}</span>}
          {article.isOpinion && <span className="rounded bg-cyan-100 px-2 py-1 text-cyan-700">{t.labels.opinion}</span>}
          {article.isPressRelease && <span className="rounded bg-slate-200 px-2 py-1 text-slate-700">{t.labels.pressRelease}</span>}
        </div>

        <h1 className="text-3xl font-black text-slate-900">{article.title}</h1>
        <p className="mt-3 text-lg text-slate-600">{article.summary}</p>

        <div className="mt-4 text-sm text-slate-500">
          {article.publishedAt ? formatDate(article.publishedAt, safeLocale) : "-"}
          <span className="mx-2">•</span>
          {article.readingTimeMinutes} min
        </div>

        <div className="mt-8">
          <ArticleReaderExperience
            articleId={article.id}
            locale={safeLocale}
            slug={slug}
            title={article.title}
            readingTimeMinutes={article.readingTimeMinutes}
          >
            <ArticleContent html={article.contentHtml} />
          </ArticleReaderExperience>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-black text-[#0A2342]">
            {safeLocale === "ar" ? "المصدر والتحقق" : "Source & Verification"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {safeLocale === "ar"
              ? "نراجع الأخبار المالية والمصرفية عبر مصادر رسمية أو موثوقة قبل النشر، ونوضح مصدر المادة كلما توفر ذلك."
              : "We verify banking and financial coverage against official or trusted sources before publication and disclose source attribution whenever available."}
          </p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <dt className="font-semibold text-slate-500">
                {safeLocale === "ar" ? "مستوى التحقق" : "Verification level"}
              </dt>
              <dd className="mt-1 font-medium text-slate-800">
                {safeLocale === "ar" ? "مراجعة تحريرية" : "Editorial review"}
              </dd>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <dt className="font-semibold text-slate-500">
                {safeLocale === "ar" ? "آخر تحديث" : "Last updated"}
              </dt>
              <dd className="mt-1 font-medium text-slate-800">
                {article.updatedAt ? formatDate(article.updatedAt, safeLocale) : "-"}
              </dd>
            </div>
          </dl>

          {article.sourceAttribution && (
            <p className="mt-4 text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">
                {safeLocale === "ar" ? "الإسناد: " : "Attribution: "}
              </span>
              {article.sourceAttribution}
            </p>
          )}

          {article.sourceUrl && (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">
                {safeLocale === "ar" ? "المصدر الأصلي: " : "Original source: "}
              </span>
              <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="text-[#005F73] underline">
                {article.sourceUrl}
              </a>
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/${safeLocale}/source-verification-policy`} className="text-[#005F73] underline">
              {safeLocale === "ar" ? "سياسة التحقق" : "Verification policy"}
            </Link>
            <Link href={`/${safeLocale}/corrections-policy`} className="text-[#005F73] underline">
              {safeLocale === "ar" ? "سياسة التصحيحات" : "Corrections policy"}
            </Link>
            <Link href={`/${safeLocale}/contact`} className="text-[#005F73] underline">
              {safeLocale === "ar" ? "إبلاغ عن خطأ" : "Report an error"}
            </Link>
          </div>
        </section>

        {correctionHistory.length > 1 && (
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-black text-[#0A2342]">
              {safeLocale === "ar" ? "سجل التصحيحات" : "Correction History"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {safeLocale === "ar"
                ? "يعرض هذا السجل التغييرات التحريرية الجوهرية المسجلة على المادة."
                : "This log shows the material editorial changes recorded for the article."}
            </p>

            <div className="mt-4 space-y-3">
              {correctionHistory.map((item) => (
                <div key={`${item.action}-${item.createdAt}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="font-semibold text-slate-800">{historyLabel(item.action)}</p>
                    <p className="text-slate-500">{formatDate(item.createdAt, safeLocale)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{historySummary(item)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      <aside>
        <h2 className="mb-4 text-xl font-black text-[#0A2342]">{t.labels.mostRead}</h2>
        <div className="space-y-3">
          {related.map((card) => (
            <ArticleCardView key={card.id} locale={safeLocale} article={card} />
          ))}
        </div>
      </aside>
    </div>
  );
}
