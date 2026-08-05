import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  const navItems = [
    ["home", ""],
    ["latest", "news"],
    ["banks", "banks"],
    ["centralBank", "central-bank"],
    ["digitalBanking", "digital-banking"],
    ["fintech", "fintech"],
    ["products", "products"],
    ["transfers", "money-transfers"],
    ["cards", "cards-atms"],
    ["rates", "exchange-rates"],
    ["economy", "economy"],
    ["guides", "guides"],
    ["reports", "reports"],
    ["interviews", "interviews"],
    ["opinion", "opinion"],
    ["jobs", "jobs"],
    ["about", "about"],
    ["contact", "contact"],
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href={`/${locale}`} className="text-xl font-black tracking-tight text-[#0A2342]">
          {t.siteName}
        </Link>
        <LanguageSwitcher locale={locale} />
      </div>
      <nav className="mx-auto max-w-7xl overflow-x-auto px-4 pb-3 md:px-6">
        <ul className="flex min-w-max items-center gap-4 text-sm font-semibold text-slate-700">
          {navItems.map(([key, href]) => (
            <li key={key}>
              <Link href={`/${locale}/${href}`.replace(/\/$/, "")} className="hover:text-[#0A2342]">
                {t.nav[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
