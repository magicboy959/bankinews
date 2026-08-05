import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { isLocale, localeDirection, type Locale } from "@/lib/i18n/config";

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

  return (
    <div dir={localeDirection(typedLocale)} className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader locale={typedLocale} />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
      <SiteFooter locale={typedLocale} />
    </div>
  );
}
