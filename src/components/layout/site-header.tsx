"use client";

import { useState } from "react";
import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useEffect } from "react";

type NavKey = keyof (typeof dictionary)["ar"]["nav"];
type NavItem = readonly [NavKey, string];

type SocialLink = {
  label: string;
  href: string;
};

export function SiteHeader({ locale, socialLinks }: { locale: Locale; socialLinks: SocialLink[] }) {
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

  const websiteItems: NavItem[] = [
    ["home", ""],
    ["latest", "news"],
    ["about", "about"],
    ["contact", "contact"],
  ];

  const serviceItems: NavItem[] = [
    ["banks", "banks"],
    ["digitalBanking", "digital-banking"],
    ["fintech", "fintech"],
    ["products", "products"],
    ["transfers", "money-transfers"],
    ["cards", "cards-atms"],
    ["rates", "exchange-rates"],
    ["guides", "guides"],
    ["jobs", "jobs"],
  ];

  const navGroups: Array<{ title: string; tone: "website" | "services"; items: NavItem[] }> = [
    {
      title: locale === "ar" ? "روابط الموقع" : "Website",
      tone: "website",
      items: websiteItems,
    },
    {
      title: locale === "ar" ? "الخدمات المالية" : "Financial Services",
      tone: "services",
      items: serviceItems,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/96 backdrop-blur">
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
          <BrandMark href={`/${locale}`} locale={locale} className="hidden md:flex" />
          <BrandMark href={`/${locale}`} locale={locale} compact className="md:hidden" />
        </div>

        <div className="flex items-center gap-2">
          {socialLinks.length ? (
            <div className="hidden items-center gap-1 md:flex">
              {socialLinks.map((link) => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-300 px-2 text-xs font-black text-slate-700 transition hover:border-[#0A2342] hover:text-[#0A2342]"
                  aria-label={link.label}
                  title={link.label}
                >
                  {link.label.slice(0, 2).toUpperCase()}
                </a>
              ))}
            </div>
          ) : null}
          <Link
            href={`/${locale}/search`}
            className="hidden rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex"
          >
            {locale === "ar" ? "بحث" : "Search"}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>

      <div className="hidden md:block">
        <div className="border-t border-slate-200 bg-[#223253] text-white">
          <nav className="mx-auto flex max-w-7xl items-center overflow-x-auto px-4 py-3 md:px-6" aria-label="Website navigation">
            <ul className="flex min-w-max items-center gap-4 text-sm font-semibold text-slate-100">
              {websiteItems.map(([key, href]) => (
                <li key={key}>
                  <Link href={`/${locale}/${href}`.replace(/\/$/, "")} className="transition hover:text-[#78d7d3]">
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-emerald-800 bg-[#0E6B57] text-white">
          <nav className="mx-auto flex max-w-7xl items-center overflow-x-auto px-4 py-3 md:px-6" aria-label="Financial services navigation">
            <ul className="flex min-w-max items-center gap-4 text-sm font-semibold text-white">
              {serviceItems.map(([key, href]) => (
                <li key={key}>
                  <Link href={`/${locale}/${href}`.replace(/\/$/, "")} className="transition hover:text-[#d8fff3]">
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
          className="fixed inset-0 z-30 bg-slate-900/35 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`relative z-40 border-t border-slate-700 bg-[#172544] px-4 py-4 text-white transition-all duration-300 md:hidden ${
          menuOpen ? "max-h-[75vh] opacity-100" : "max-h-0 overflow-hidden border-t-0 py-0 opacity-0"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="overflow-y-auto">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/${locale}/search`}
              className="inline-flex rounded-md border border-slate-500 px-3 py-1.5 text-sm font-semibold text-slate-100"
              onClick={() => setMenuOpen(false)}
            >
              {locale === "ar" ? "بحث" : "Search"}
            </Link>
            {socialLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}-mobile`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md border border-slate-500 px-3 py-1.5 text-sm font-semibold text-slate-100"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="space-y-5">
            {navGroups.map((group) => (
              <section
                key={group.title}
                className={group.tone === "website" ? "rounded-xl border border-slate-700 bg-[#223253] p-3" : "rounded-xl border border-emerald-800 bg-[#0E6B57] p-3"}
              >
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100">{group.title}</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {group.items.map(([key, href]) => (
                    <li key={key}>
                      <Link
                        href={`/${locale}/${href}`.replace(/\/$/, "")}
                        className="block rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100"
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
