import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

const siteName = "BankiNews Sudan";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function buildAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value.startsWith("/") ? value : `/${value}`, baseUrl).toString();
}

export function buildMetadata(args: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${baseUrl}${args.path}`;
  const alternates = {
    canonical: url,
    languages: {
      "ar-SD": `${baseUrl}/ar${args.path.replace(/^\/(ar|en)/, "")}`,
      "en-US": `${baseUrl}/en${args.path.replace(/^\/(ar|en)/, "")}`,
    },
  };

  return {
    title: `${args.title} | ${siteName}`,
    description: args.description,
    alternates,
    openGraph: {
      title: `${args.title} | ${siteName}`,
      description: args.description,
      url,
      siteName,
      locale: args.locale === "ar" ? "ar_SD" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${args.title} | ${siteName}`,
      description: args.description,
    },
  };
}

export function buildArticleMetadata(args: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  featuredImageUrl?: string | null;
  videoUrl?: string | null;
}) : Metadata {
  const base = buildMetadata({
    locale: args.locale,
    title: args.title,
    description: args.description,
    path: args.path,
  });

  const imageUrl = args.featuredImageUrl ? buildAbsoluteUrl(args.featuredImageUrl) : undefined;
  const pageUrl = `${baseUrl}${args.path}`;

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: args.publishedAt ?? undefined,
      modifiedTime: args.updatedAt ?? undefined,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: args.title,
            },
          ]
        : undefined,
      videos: args.videoUrl
        ? [
            {
              url: args.videoUrl,
            },
          ]
        : undefined,
    },
    twitter: {
      ...base.twitter,
      card: imageUrl ? "summary_large_image" : "summary",
      images: imageUrl ? [imageUrl] : undefined,
    },
    other: {
      "article:published_time": args.publishedAt ?? "",
      "article:modified_time": args.updatedAt ?? "",
      ...(imageUrl ? { "og:image": imageUrl } : {}),
      ...(args.videoUrl ? { "og:video": args.videoUrl } : {}),
      "og:url": pageUrl,
    },
  };
}
