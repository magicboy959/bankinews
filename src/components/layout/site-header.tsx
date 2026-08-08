"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type NavKey = keyof (typeof dictionary)["ar"]["nav"];
type NavItem = readonly [NavKey, string];

type SocialLink = {
  label: string;
  href: string;
};

type SocialPlatform = "facebook" | "x" | "linkedin" | "instagram" | "youtube" | "other";

function detectSocialPlatform(link: SocialLink): SocialPlatform {
  const label = link.label.toLowerCase();
  const href = link.href.toLowerCase();

  if (label.includes("instagram") || label === "ig" || href.includes("instagram.com")) return "instagram";
  if (label.includes("facebook") || label === "fb" || href.includes("facebook.com")) return "facebook";
  if (label === "x" || label.includes("twitter") || href.includes("x.com") || href.includes("twitter.com")) return "x";
  if (label.includes("linkedin") || label === "in" || href.includes("linkedin.com")) return "linkedin";
  if (label.includes("youtube") || label === "yt" || href.includes("youtube.com") || href.includes("youtu.be")) return "youtube";

  return "other";
}

function socialButtonClass(platform: SocialPlatform, mobile = false): string {
  if (mobile) {
    if (platform === "instagram") return "border-pink-300 bg-pink-500/20 text-pink-100";
    if (platform === "facebook") return "border-blue-300 bg-blue-500/20 text-blue-100";
    if (platform === "x") return "border-slate-300 bg-slate-100/15 text-slate-100";
    if (platform === "linkedin") return "border-cyan-300 bg-cyan-500/20 text-cyan-100";
    if (platform === "youtube") return "border-red-300 bg-red-500/20 text-red-100";
    return "border-slate-400 bg-white/10 text-slate-100";
  }

  if (platform === "instagram") return "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300 hover:bg-pink-100";
  if (platform === "facebook") return "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100";
  if (platform === "x") return "border-slate-300 bg-slate-100 text-slate-800 hover:border-slate-400 hover:bg-slate-200";
  if (platform === "linkedin") return "border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100";
  if (platform === "youtube") return "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100";
  return "border-slate-300 bg-white text-slate-700 hover:border-[#0A2342] hover:text-[#0A2342]";
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "facebook") {
    return <span aria-hidden="true" className="font-black">f</span>;
  }

  if (platform === "x") {
    return <span aria-hidden="true" className="font-black">X</span>;
  }

  if (platform === "linkedin") {
    return <span aria-hidden="true" className="font-black">in</span>;
  }

  if (platform === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11.25 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    );
  }

  if (platform === "youtube") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M23 12s0-3.54-.45-5.24a2.93 2.93 0 0 0-2.06-2.06C18.79 4.25 12 4.25 12 4.25s-6.79 0-8.49.45A2.93 2.93 0 0 0 1.45 6.76C1 8.46 1 12 1 12s0 3.54.45 5.24a2.93 2.93 0 0 0 2.06 2.06c1.7.45 8.49.45 8.49.45s6.79 0 8.49-.45a2.93 2.93 0 0 0 2.06-2.06C23 15.54 23 12 23 12Zm-13.5 3.88V8.12L15.75 12 9.5 15.88Z" />
      </svg>
    );
  }

  return <span aria-hidden="true" className="font-black">•</span>;
}

type SearchResult = {
  articles: Array<{ id: number; slug: string; title: string }>;
  banks: Array<{ id: number; slug: string; name: string }>;
};

type SearchSuggestion = {
  id: string;
  label: string;
  href: string;
  kind: "article" | "bank" | "viewAll" | "arabicFallback";
};

const SEARCH_HINT_STORAGE_KEY = "bankinews.searchShortcutsHintHidden";

export function SiteHeader({ locale, socialLinks }: { locale: Locale; socialLinks: SocialLink[] }) {
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showArabicCoverageHint, setShowArabicCoverageHint] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showShortcutHint, setShowShortcutHint] = useState(true);
  const [showSearchSettingsMenu, setShowSearchSettingsMenu] = useState(false);
  const t = dictionary[locale];
  const desktopListboxId = `header-search-listbox-desktop-${locale}`;
  const mobileListboxId = `header-search-listbox-mobile-${locale}`;

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SEARCH_HINT_STORAGE_KEY);
      setShowShortcutHint(saved !== "1");
    } catch {
      setShowShortcutHint(true);
    }
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResult(null);
      setSearchLoading(false);
      setShowArabicCoverageHint(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
        const json = await response.json();
        const nextResult = (json?.data ?? null) as SearchResult | null;
        if (!active) {
          return;
        }

        setSearchResult(nextResult);
        setShowArabicCoverageHint(false);

        if (locale === "en" && nextResult && nextResult.articles.length === 0 && nextResult.banks.length === 0) {
          const arabicResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=ar`);
          const arabicJson = await arabicResponse.json();
          const arabicResult = (arabicJson?.data ?? null) as SearchResult | null;
          if (!active) {
            return;
          }
          if (arabicResult && (arabicResult.articles.length > 0 || arabicResult.banks.length > 0)) {
            setShowArabicCoverageHint(true);
          }
        }
      } catch {
        if (active) {
          setSearchResult(null);
          setShowArabicCoverageHint(false);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [locale, searchQuery]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchQuery, locale, searchResult, showArabicCoverageHint]);

  useEffect(() => {
    if (!showSearchOverlay) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const insideDesktop = desktopSearchRef.current?.contains(target) ?? false;
      const insideMobile = mobileSearchRef.current?.contains(target) ?? false;

      if (!insideDesktop && !insideMobile) {
        setShowSearchOverlay(false);
        setActiveSuggestionIndex(-1);
        setShowSearchSettingsMenu(false);
      }
    }

    function handleFocusTrap(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return;
      }

      const activeContainer = menuOpen ? mobileSearchRef.current : desktopSearchRef.current;
      if (!activeContainer) {
        return;
      }

      const focusable = Array.from(
        activeContainer.querySelectorAll<HTMLElement>("input, button, a[href], [tabindex]:not([tabindex='-1'])")
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1 && element.offsetParent !== null);

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeContainer.contains(activeElement)) {
        first.focus();
        event.preventDefault();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        last.focus();
        event.preventDefault();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleFocusTrap);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleFocusTrap);
    };
  }, [menuOpen, showSearchOverlay]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const query = searchQuery.trim();
    if (!query || !searchResult) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];

    if (locale === "en" && showArabicCoverageHint) {
      suggestions.push({
        id: "arabic-fallback",
        label: "Open Arabic Search",
        href: "/ar/search",
        kind: "arabicFallback",
      });
    }

    for (const article of searchResult.articles.slice(0, 4)) {
      suggestions.push({
        id: `article-${article.id}`,
        label: article.title,
        href: `/${locale}/news/${article.slug}`,
        kind: "article",
      });
    }

    for (const bank of searchResult.banks.slice(0, 4)) {
      suggestions.push({
        id: `bank-${bank.id}`,
        label: bank.name,
        href: `/${locale}/banks/${bank.slug}`,
        kind: "bank",
      });
    }

    suggestions.push({
      id: "view-all",
      label: locale === "ar" ? "عرض كل النتائج" : "View all results",
      href: `/${locale}/search?q=${encodeURIComponent(query)}`,
      kind: "viewAll",
    });

    return suggestions;
  }, [locale, searchQuery, searchResult, showArabicCoverageHint]);
  const activeSuggestion = activeSuggestionIndex >= 0 ? searchSuggestions[activeSuggestionIndex] : null;

  function getOptionId(prefix: "desktop" | "mobile", suggestionId: string) {
    return `header-search-option-${prefix}-${suggestionId}`;
  }

  function getSuggestionAriaLabel(suggestion: SearchSuggestion) {
    if (suggestion.kind === "article") {
      return locale === "ar" ? `مقالة: ${suggestion.label}` : `Article: ${suggestion.label}`;
    }

    if (suggestion.kind === "bank") {
      return locale === "ar" ? `بنك: ${suggestion.label}` : `Bank: ${suggestion.label}`;
    }

    if (suggestion.kind === "arabicFallback") {
      return locale === "ar" ? "فتح البحث العربي" : "Open Arabic search";
    }

    return locale === "ar" ? "عرض كل نتائج البحث" : "View all search results";
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      return;
    }

    setShowSearchOverlay(false);
    setShowSearchSettingsMenu(false);
    setMenuOpen(false);
    router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
  }

  function dismissShortcutHint() {
    setShowShortcutHint(false);
    try {
      window.localStorage.setItem(SEARCH_HINT_STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors and keep UI functional.
    }
  }

  function restoreShortcutHint() {
    setShowShortcutHint(true);
    try {
      window.localStorage.removeItem(SEARCH_HINT_STORAGE_KEY);
    } catch {
      // Ignore storage errors and keep UI functional.
    }
  }

  function resetSearchState() {
    setSearchQuery("");
    setSearchResult(null);
    setShowSearchOverlay(false);
    setShowArabicCoverageHint(false);
    setActiveSuggestionIndex(-1);
    setSearchLoading(false);
    setShowSearchSettingsMenu(false);
  }

  function openSuggestion(href: string) {
    clearSearchState();
    setShowSearchSettingsMenu(false);
    setMenuOpen(false);
    router.push(href);
  }

  function onDesktopSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setShowSearchOverlay(false);
      setActiveSuggestionIndex(-1);
      setShowSearchSettingsMenu(false);
      return;
    }

    if (!showSearchOverlay) {
      setShowSearchOverlay(true);
    }

    if (!searchSuggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1 >= searchSuggestions.length ? 0 : prev + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 < 0 ? searchSuggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      openSuggestion(searchSuggestions[activeSuggestionIndex].href);
    }
  }

  function clearSearchState() {
    setShowSearchOverlay(false);
    setSearchResult(null);
    setShowArabicCoverageHint(false);
    setActiveSuggestionIndex(-1);
    setShowSearchSettingsMenu(false);
  }

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
                (() => {
                  const platform = detectSocialPlatform(link);
                  return (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-black transition ${socialButtonClass(platform)}`}
                  aria-label={link.label}
                  title={link.label}
                >
                  <SocialIcon platform={platform} />
                </a>
                  );
                })()
              ))}
            </div>
          ) : null}
          <div ref={desktopSearchRef} className="relative hidden md:block">
            <div className="flex items-center gap-1">
              <form onSubmit={submitSearch}>
                <input
                  className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-[#0A2342] focus:outline-none"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setShowSearchOverlay(true)}
                  onKeyDown={onDesktopSearchKeyDown}
                  placeholder={locale === "ar" ? "ابحث..." : "Search..."}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSearchOverlay}
                  aria-controls={desktopListboxId}
                  aria-activedescendant={activeSuggestion ? getOptionId("desktop", activeSuggestion.id) : undefined}
                  aria-label={locale === "ar" ? "بحث الموقع" : "Site search"}
                />
              </form>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSearchSettingsMenu((value) => !value)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-sm text-slate-600 hover:bg-slate-100"
                  aria-label={locale === "ar" ? "إعدادات البحث" : "Search settings"}
                  aria-expanded={showSearchSettingsMenu && !menuOpen}
                >
                  ⚙
                </button>
                {showSearchSettingsMenu && !menuOpen ? (
                  <div className="search-settings-pop absolute end-0 z-50 mt-1 w-44 origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={showShortcutHint ? dismissShortcutHint : restoreShortcutHint}
                      className="w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {showShortcutHint
                        ? locale === "ar"
                          ? "إخفاء الاختصارات"
                          : "Hide shortcuts"
                        : locale === "ar"
                          ? "إظهار الاختصارات"
                          : "Show shortcuts"}
                    </button>
                    <button
                      type="button"
                      onClick={resetSearchState}
                      className="mt-1 w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {locale === "ar" ? "إعادة ضبط البحث" : "Reset search state"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {showShortcutHint ? (
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {locale === "ar" ? "الاختصارات: ↑ ↓ للتنقل • Enter للاختيار • Esc للإغلاق" : "Shortcuts: Arrow Up/Down to navigate • Enter to open • Esc to close"}
              </p>
            ) : null}
            {showSearchOverlay && (searchQuery.trim().length >= 2 || searchLoading) ? (
              <div id={desktopListboxId} role="listbox" aria-label={locale === "ar" ? "اقتراحات البحث" : "Search suggestions"} className="absolute end-0 z-50 mt-2 w-[26rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <p className="sr-only" aria-live="polite">
                  {searchLoading
                    ? locale === "ar"
                      ? "جاري تحديث نتائج البحث"
                      : "Updating search results"
                    : locale === "ar"
                      ? `${searchSuggestions.length} عناصر متاحة في الاقتراحات`
                      : `${searchSuggestions.length} suggestion items available`}
                </p>
                {searchLoading ? <p className="text-sm text-slate-500">{locale === "ar" ? "جاري البحث..." : "Searching..."}</p> : null}

                {!searchLoading && showArabicCoverageHint ? (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {locale === "ar"
                      ? "المحتوى العربي هو المصدر الرئيسي حاليا لبعض المواضيع."
                      : "Arabic is currently the primary source for some topics."}
                    <div className="mt-2">
                      <Link
                        href="/ar/search"
                        id={getOptionId("desktop", "arabic-fallback")}
                        role="option"
                        aria-selected={searchSuggestions[activeSuggestionIndex]?.id === "arabic-fallback"}
                        aria-label={getSuggestionAriaLabel({ id: "arabic-fallback", label: "Open Arabic Search", href: "/ar/search", kind: "arabicFallback" })}
                        className="font-semibold text-[#0A2342] underline"
                        onMouseEnter={() => {
                          const hintIndex = searchSuggestions.findIndex((item) => item.kind === "arabicFallback");
                          if (hintIndex >= 0) {
                            setActiveSuggestionIndex(hintIndex);
                          }
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          openSuggestion("/ar/search");
                        }}
                      >
                        {locale === "ar" ? "فتح البحث العربي" : "Open Arabic Search"}
                      </Link>
                    </div>
                  </div>
                ) : null}

                {!searchLoading && searchResult ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">{locale === "ar" ? "المقالات" : "Articles"}</p>
                      <div className="space-y-1">
                        {searchResult.articles.slice(0, 4).map((article) => (
                          <Link
                            key={`article-${article.id}`}
                            href={`/${locale}/news/${article.slug}`}
                            id={getOptionId("desktop", `article-${article.id}`)}
                            role="option"
                            aria-selected={searchSuggestions[activeSuggestionIndex]?.id === `article-${article.id}`}
                            aria-label={getSuggestionAriaLabel({ id: `article-${article.id}`, label: article.title, href: `/${locale}/news/${article.slug}`, kind: "article" })}
                            onMouseEnter={() => {
                              const index = searchSuggestions.findIndex((item) => item.id === `article-${article.id}`);
                              if (index >= 0) {
                                setActiveSuggestionIndex(index);
                              }
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              openSuggestion(`/${locale}/news/${article.slug}`);
                            }}
                            className={`block rounded-md border px-2 py-1.5 text-sm hover:bg-slate-50 ${
                              searchSuggestions[activeSuggestionIndex]?.id === `article-${article.id}`
                                ? "border-[#0A2342] bg-slate-100 text-slate-900"
                                : "border-slate-200 text-slate-700"
                            }`}
                          >
                            {article.title}
                          </Link>
                        ))}
                        {searchResult.articles.length === 0 ? <p className="text-xs text-slate-500">{locale === "ar" ? "لا توجد نتائج." : "No results."}</p> : null}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">{locale === "ar" ? "البنوك" : "Banks"}</p>
                      <div className="space-y-1">
                        {searchResult.banks.slice(0, 4).map((bank) => (
                          <Link
                            key={`bank-${bank.id}`}
                            href={`/${locale}/banks/${bank.slug}`}
                            id={getOptionId("desktop", `bank-${bank.id}`)}
                            role="option"
                            aria-selected={searchSuggestions[activeSuggestionIndex]?.id === `bank-${bank.id}`}
                            aria-label={getSuggestionAriaLabel({ id: `bank-${bank.id}`, label: bank.name, href: `/${locale}/banks/${bank.slug}`, kind: "bank" })}
                            onMouseEnter={() => {
                              const index = searchSuggestions.findIndex((item) => item.id === `bank-${bank.id}`);
                              if (index >= 0) {
                                setActiveSuggestionIndex(index);
                              }
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              openSuggestion(`/${locale}/banks/${bank.slug}`);
                            }}
                            className={`block rounded-md border px-2 py-1.5 text-sm hover:bg-slate-50 ${
                              searchSuggestions[activeSuggestionIndex]?.id === `bank-${bank.id}`
                                ? "border-[#0A2342] bg-slate-100 text-slate-900"
                                : "border-slate-200 text-slate-700"
                            }`}
                          >
                            {bank.name}
                          </Link>
                        ))}
                        {searchResult.banks.length === 0 ? <p className="text-xs text-slate-500">{locale === "ar" ? "لا توجد نتائج." : "No results."}</p> : null}
                      </div>
                    </div>

                    <Link
                      href={`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`}
                      id={getOptionId("desktop", "view-all")}
                      role="option"
                      aria-selected={searchSuggestions[activeSuggestionIndex]?.kind === "viewAll"}
                      aria-label={getSuggestionAriaLabel({ id: "view-all", label: locale === "ar" ? "عرض كل النتائج" : "View all results", href: `/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`, kind: "viewAll" })}
                      onMouseEnter={() => {
                        const viewAllIndex = searchSuggestions.findIndex((item) => item.kind === "viewAll");
                        if (viewAllIndex >= 0) {
                          setActiveSuggestionIndex(viewAllIndex);
                        }
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        openSuggestion(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className={`inline-flex text-xs font-semibold underline ${
                        searchSuggestions[activeSuggestionIndex]?.kind === "viewAll" ? "text-[#0A2342]" : "text-slate-700"
                      }`}
                    >
                      {locale === "ar" ? "عرض كل النتائج" : "View all results"}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
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
          <div ref={mobileSearchRef}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <form onSubmit={submitSearch} className="flex w-full gap-2">
                <input
                  className="w-full rounded-md border border-slate-500 bg-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setShowSearchOverlay(true)}
                  onKeyDown={onDesktopSearchKeyDown}
                  placeholder={locale === "ar" ? "ابحث..." : "Search..."}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSearchOverlay}
                  aria-controls={mobileListboxId}
                  aria-activedescendant={activeSuggestion ? getOptionId("mobile", activeSuggestion.id) : undefined}
                  aria-label={locale === "ar" ? "بحث الموقع" : "Site search"}
                />
                <button type="submit" className="rounded-md border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-100">
                  {locale === "ar" ? "بحث" : "Search"}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSearchSettingsMenu((value) => !value)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-500 text-sm text-slate-100 hover:bg-white/10"
                    aria-label={locale === "ar" ? "إعدادات البحث" : "Search settings"}
                    aria-expanded={showSearchSettingsMenu && menuOpen}
                  >
                    ⚙
                  </button>
                  {showSearchSettingsMenu && menuOpen ? (
                    <div className="search-settings-pop absolute end-0 z-50 mt-1 w-44 origin-top-right rounded-lg border border-slate-600 bg-[#213155] p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={showShortcutHint ? dismissShortcutHint : restoreShortcutHint}
                        className="w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-100 hover:bg-white/10"
                      >
                        {showShortcutHint
                          ? locale === "ar"
                            ? "إخفاء الاختصارات"
                            : "Hide shortcuts"
                          : locale === "ar"
                            ? "إظهار الاختصارات"
                            : "Show shortcuts"}
                      </button>
                      <button
                        type="button"
                        onClick={resetSearchState}
                        className="mt-1 w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-100 hover:bg-white/10"
                      >
                        {locale === "ar" ? "إعادة ضبط البحث" : "Reset search state"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </form>
              {showShortcutHint ? (
                <p className="w-full text-[11px] font-medium text-slate-300">
                  {locale === "ar" ? "الاختصارات: ↑ ↓ للتنقل • Enter للاختيار • Esc للإغلاق" : "Shortcuts: Arrow Up/Down to navigate • Enter to open • Esc to close"}
                </p>
              ) : null}
              {socialLinks.map((link) => (
                (() => {
                  const platform = detectSocialPlatform(link);
                  return (
                <a
                  key={`${link.label}-${link.href}-mobile`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-semibold ${socialButtonClass(platform, true)}`}
                >
                  <SocialIcon platform={platform} />
                  {link.label}
                </a>
                  );
                })()
              ))}
            </div>
            {showSearchOverlay && (searchQuery.trim().length >= 2 || searchLoading) ? (
              <div id={mobileListboxId} role="listbox" aria-label={locale === "ar" ? "اقتراحات البحث" : "Search suggestions"} className="mb-3 rounded-xl border border-slate-600 bg-[#213155] p-3">
              <p className="sr-only" aria-live="polite">
                {searchLoading
                  ? locale === "ar"
                    ? "جاري تحديث نتائج البحث"
                    : "Updating search results"
                  : locale === "ar"
                    ? `${searchSuggestions.length} عناصر متاحة في الاقتراحات`
                    : `${searchSuggestions.length} suggestion items available`}
              </p>
              {searchLoading ? <p className="text-sm text-slate-200">{locale === "ar" ? "جاري البحث..." : "Searching..."}</p> : null}

              {!searchLoading && showArabicCoverageHint ? (
                <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-100/10 px-3 py-2 text-xs text-amber-100">
                  {locale === "ar"
                    ? "المحتوى العربي هو المصدر الرئيسي حاليا لبعض المواضيع."
                    : "Arabic is currently the primary source for some topics."}
                  <div className="mt-2">
                    <Link
                      href="/ar/search"
                      id={getOptionId("mobile", "arabic-fallback")}
                      role="option"
                      aria-selected={searchSuggestions[activeSuggestionIndex]?.id === "arabic-fallback"}
                      aria-label={getSuggestionAriaLabel({ id: "arabic-fallback", label: "Open Arabic Search", href: "/ar/search", kind: "arabicFallback" })}
                      className="font-semibold underline"
                      onMouseEnter={() => {
                        const hintIndex = searchSuggestions.findIndex((item) => item.kind === "arabicFallback");
                        if (hintIndex >= 0) {
                          setActiveSuggestionIndex(hintIndex);
                        }
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        openSuggestion("/ar/search");
                      }}
                    >
                      {locale === "ar" ? "فتح البحث العربي" : "Open Arabic Search"}
                    </Link>
                  </div>
                </div>
              ) : null}

              {!searchLoading && searchResult ? (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-300">{locale === "ar" ? "المقالات" : "Articles"}</p>
                    <div className="space-y-1">
                      {searchResult.articles.slice(0, 4).map((article) => (
                        <Link
                          key={`mobile-article-${article.id}`}
                          href={`/${locale}/news/${article.slug}`}
                          id={getOptionId("mobile", `article-${article.id}`)}
                          role="option"
                          aria-selected={searchSuggestions[activeSuggestionIndex]?.id === `article-${article.id}`}
                          aria-label={getSuggestionAriaLabel({ id: `article-${article.id}`, label: article.title, href: `/${locale}/news/${article.slug}`, kind: "article" })}
                          onMouseEnter={() => {
                            const index = searchSuggestions.findIndex((item) => item.id === `article-${article.id}`);
                            if (index >= 0) {
                              setActiveSuggestionIndex(index);
                            }
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            openSuggestion(`/${locale}/news/${article.slug}`);
                          }}
                          className={`block rounded-md border px-2 py-1.5 text-sm ${
                            searchSuggestions[activeSuggestionIndex]?.id === `article-${article.id}`
                              ? "border-cyan-300 bg-white/20 text-white"
                              : "border-slate-500 text-slate-100"
                          }`}
                        >
                          {article.title}
                        </Link>
                      ))}
                      {searchResult.articles.length === 0 ? <p className="text-xs text-slate-300">{locale === "ar" ? "لا توجد نتائج." : "No results."}</p> : null}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-300">{locale === "ar" ? "البنوك" : "Banks"}</p>
                    <div className="space-y-1">
                      {searchResult.banks.slice(0, 4).map((bank) => (
                        <Link
                          key={`mobile-bank-${bank.id}`}
                          href={`/${locale}/banks/${bank.slug}`}
                          id={getOptionId("mobile", `bank-${bank.id}`)}
                          role="option"
                          aria-selected={searchSuggestions[activeSuggestionIndex]?.id === `bank-${bank.id}`}
                          aria-label={getSuggestionAriaLabel({ id: `bank-${bank.id}`, label: bank.name, href: `/${locale}/banks/${bank.slug}`, kind: "bank" })}
                          onMouseEnter={() => {
                            const index = searchSuggestions.findIndex((item) => item.id === `bank-${bank.id}`);
                            if (index >= 0) {
                              setActiveSuggestionIndex(index);
                            }
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            openSuggestion(`/${locale}/banks/${bank.slug}`);
                          }}
                          className={`block rounded-md border px-2 py-1.5 text-sm ${
                            searchSuggestions[activeSuggestionIndex]?.id === `bank-${bank.id}`
                              ? "border-cyan-300 bg-white/20 text-white"
                              : "border-slate-500 text-slate-100"
                          }`}
                        >
                          {bank.name}
                        </Link>
                      ))}
                      {searchResult.banks.length === 0 ? <p className="text-xs text-slate-300">{locale === "ar" ? "لا توجد نتائج." : "No results."}</p> : null}
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`}
                    id={getOptionId("mobile", "view-all")}
                    role="option"
                    aria-selected={searchSuggestions[activeSuggestionIndex]?.kind === "viewAll"}
                    aria-label={getSuggestionAriaLabel({ id: "view-all", label: locale === "ar" ? "عرض كل النتائج" : "View all results", href: `/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`, kind: "viewAll" })}
                    onMouseEnter={() => {
                      const viewAllIndex = searchSuggestions.findIndex((item) => item.kind === "viewAll");
                      if (viewAllIndex >= 0) {
                        setActiveSuggestionIndex(viewAllIndex);
                      }
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      openSuggestion(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className={`inline-flex text-xs font-semibold underline ${
                      searchSuggestions[activeSuggestionIndex]?.kind === "viewAll" ? "text-cyan-200" : "text-slate-100"
                    }`}
                  >
                    {locale === "ar" ? "عرض كل النتائج" : "View all results"}
                  </Link>
                </div>
              ) : null}
              </div>
            ) : null}
          </div>
          {locale === "en" && showArabicCoverageHint ? (
            <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-100/10 px-3 py-2 text-xs text-amber-100">
              Arabic is currently the primary source for some topics.
              <div className="mt-1">
                <Link
                  href="/ar/search"
                  onClick={(event) => {
                    event.preventDefault();
                    openSuggestion("/ar/search");
                  }}
                  className="font-semibold underline"
                >
                  Open Arabic Search
                </Link>
              </div>
            </div>
          ) : null}
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
