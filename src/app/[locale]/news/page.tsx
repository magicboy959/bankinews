import { dictionary } from "@/lib/i18n/dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getPublishedArticles } from "@/services/article-service";
import { ArticleCardView } from "@/components/articles/article-card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const t = dictionary[safeLocale];
  const articles = await getPublishedArticles(safeLocale, 30);

  return (
    <div>
      <SectionHeading title={t.nav.latest} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCardView key={article.id} locale={safeLocale} article={article} />
        ))}
      </div>
    </div>
  );
}
