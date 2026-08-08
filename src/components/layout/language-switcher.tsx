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
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)]"
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {locale === "ar" ? "EN" : "AR"}
    </Link>
  );
}
