import { getPublishedArticles } from "@/services/article-service";

function cdata(value: string) {
  return value.replaceAll("]]>", "]]]]><![CDATA[>");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bankinews.com";
  const arItems = await getPublishedArticles("ar", 300);
  const enItems = await getPublishedArticles("en", 300);
  const items = [...arItems, ...enItems];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items
  .map(
    (item) => `  <url>
    <loc>${baseUrl}/${item.locale}/news/${item.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>BankiNews Sudan</news:name>
        <news:language>${item.locale}</news:language>
      </news:publication>
      <news:publication_date>${item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString()}</news:publication_date>
      <news:title><![CDATA[${cdata(item.title)}]]></news:title>
    </news:news>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
