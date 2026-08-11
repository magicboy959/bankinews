import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NewsletterBottomSheet } from "@/components/ui/newsletter-bottom-sheet";
import { isLocale, localeDirection, type Locale } from "@/lib/i18n/config";
import { getSocialLinks } from "@/services/settings-service";

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
        <SiteFooter locale={typedLocale} socialLinks={socialLinks} />
      </div>
      <NewsletterBottomSheet locale={typedLocale} />
    </div>
  );
}
