"use client";

import { useState } from "react";
import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useEffect } from "react";

type NavKey = keyof (typeof dictionary)["ar"]["nav"];
type NavItem = readonly [NavKey, string];

export function SiteHeader({ locale }: { locale: Locale }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = dictionary[locale];

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navGroups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: locale === "ar" ? "الأخبار" : "News",
      items: [
        ["home", ""],
        ["latest", "news"],
        ["centralBank", "central-bank"],
        ["economy", "economy"],
        ["reports", "reports"],
        ["interviews", "interviews"],
        ["opinion", "opinion"],
      ],
    },
    {
      title: locale === "ar" ? "الخدمات" : "Services",
      items: [
        ["banks", "banks"],
        ["digitalBanking", "digital-banking"],
        ["fintech", "fintech"],
        ["products", "products"],
        ["transfers", "money-transfers"],
        ["cards", "cards-atms"],
        ["rates", "exchange-rates"],
        ["guides", "guides"],
        ["jobs", "jobs"],
      ],
    },
    {
      title: locale === "ar" ? "الموقع" : "Site",
      items: [
        ["about", "about"],
        ["contact", "contact"],
      ],
    },
  ];

  const desktopItems = navGroups.reduce<NavItem[]>((acc, group) => {
    acc.push(...group.items);
    return acc;
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="text-xl leading-none">{menuOpen ? "×" : "☰"}</span>
          </button>
          <Link href={`/${locale}`} className="text-lg font-black tracking-tight text-[#0A2342] md:text-xl">
            {t.siteName}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/search`}
            className="hidden rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex"
          >
            {locale === "ar" ? "بحث" : "Search"}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>

      <nav className="mx-auto hidden max-w-7xl overflow-x-auto px-4 pb-3 md:block md:px-6" aria-label="Desktop navigation">
        <ul className="flex min-w-max items-center gap-4 text-sm font-semibold text-slate-700">
          {desktopItems.map(([key, href]) => (
            <li key={key}>
              <Link href={`/${locale}/${href}`.replace(/\/$/, "")} className="hover:text-[#0A2342]">
                {t.nav[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {menuOpen && (
        <button
          type="button"
          aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
          className="fixed inset-0 z-30 bg-slate-900/35 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`relative z-40 border-t border-slate-200 bg-white px-4 py-4 transition-all duration-300 md:hidden ${
          menuOpen ? "max-h-[75vh] opacity-100" : "max-h-0 overflow-hidden border-t-0 py-0 opacity-0"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="overflow-y-auto">
          <div className="mb-3">
            <Link
              href={`/${locale}/search`}
              className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
              onClick={() => setMenuOpen(false)}
            >
              {locale === "ar" ? "بحث" : "Search"}
            </Link>
          </div>
          <div className="space-y-5">
            {navGroups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{group.title}</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {group.items.map(([key, href]) => (
                    <li key={key}>
                      <Link
                        href={`/${locale}/${href}`.replace(/\/$/, "")}
                        className="block rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t.nav[key]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
