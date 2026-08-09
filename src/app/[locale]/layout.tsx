import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NewsletterBottomSheet } from "@/components/ui/newsletter-bottom-sheet";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, localeDirection, type Locale } from "@/lib/i18n/config";

type SettingRow = DbRow & {
  settingValue: unknown;
};

type SocialLink = {
  label: string;
  href: string;
};

function normalizeDbJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
}

async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const rows = await dbQuery<SettingRow[]>(
      `SELECT setting_value AS settingValue
       FROM settings
       WHERE setting_key = 'social_links'
       LIMIT 1`
    );

    const normalized = normalizeDbJson(rows[0]?.settingValue);
    const links =
      normalized && typeof normalized === "object" && Array.isArray((normalized as { links?: unknown[] }).links)
        ? (normalized as { links: Array<{ label?: string; href?: string }> }).links
        : [];

    return links
      .map((item) => ({
        label: item.label?.trim() ?? "",
        href: item.href?.trim() ?? "",
      }))
      .filter((item) => item.label && item.href);
  } catch {
    return [];
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const socialLinks = await getSocialLinks();

  return (
    <div dir={localeDirection(typedLocale)} className="site-page min-h-screen px-3 md:px-5">
      <div className="site-shell mx-auto flex min-h-screen w-full max-w-[1080px] flex-col overflow-hidden border-x shadow-[0_22px_80px_rgba(15,23,42,0.10)]">
        <SiteHeader locale={typedLocale} socialLinks={socialLinks} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">{children}</main>
        <SiteFooter locale={typedLocale} />
      </div>
      <NewsletterBottomSheet locale={typedLocale} />
    </div>
  );
}
