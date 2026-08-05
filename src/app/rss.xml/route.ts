import { getPublishedArticles } from "@/services/article-service";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const items = await getPublishedArticles("en", 30);

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>BankiNews Sudan</title>
      <link>${baseUrl}</link>
      <description>Sudan banking and financial news</description>
      ${items
        .map(
          (item) => `<item>
            <title><![CDATA[${item.title}]]></title>
            <link>${baseUrl}/en/news/${item.slug}</link>
            <description><![CDATA[${item.summary}]]></description>
            <pubDate>${item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
          </item>`
        )
        .join("\n")}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
