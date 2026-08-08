"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeToggle({ locale }: { locale: "ar" | "en" }) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bankinews-theme") as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme ?? (prefersDark ? "dark" : "light");
    applyTheme(initialTheme);
  }, []);

  function applyTheme(nextTheme: ThemeMode) {
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("bankinews-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition hover:bg-[var(--surface-muted)]"
      aria-label={locale === "ar" ? (theme === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الليلي") : (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
      title={locale === "ar" ? (theme === "dark" ? "الوضع الفاتح" : "الوضع الليلي") : (theme === "dark" ? "Light mode" : "Dark mode")}
    >
      {theme === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
