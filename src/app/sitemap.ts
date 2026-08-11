import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bankinews.com";
  const locales = ["ar", "en"];

  const staticPaths = [
    "",
    "/news",
    "/banks",
    "/products",
    "/cards-atms",
    "/money-transfers",
    "/fintech",
    "/exchange-rates",
    "/jobs",
    "/guides",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/data-deletion",
    "/editorial-policy",
  ];

  return locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
    }))
  );
}
