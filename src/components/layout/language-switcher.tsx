"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const targetLocale: Locale = locale === "ar" ? "en" : "ar";
  const nextPath = pathname.replace(/^\/(ar|en)/, `/${targetLocale}`) || `/${targetLocale}`;

  return (
    <Link
      href={nextPath}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {locale === "ar" ? "EN" : "AR"}
    </Link>
  );
}
