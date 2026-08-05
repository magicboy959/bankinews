import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

const siteName = "BankiNews Sudan";

export function buildMetadata(args: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
