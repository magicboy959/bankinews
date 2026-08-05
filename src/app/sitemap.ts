import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const locales = ["ar", "en"];

  const staticPaths = [
    "",
    "/news",
    "/banks",
    "/products",
    "/exchange-rates",
    "/jobs",
    "/guides",
    "/about",
    "/contact",
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
