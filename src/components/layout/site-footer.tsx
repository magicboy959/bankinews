import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { NewsletterForm } from "@/components/ui/newsletter-form";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  return (
    <footer className="mt-16 border-t border-slate-800 bg-[#0C1426] text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <Link href={`/${locale}`} className="inline-flex" aria-label={t.siteName}>
            <img
              src="/banki-news-primary-logo-footer.png"
              alt={t.siteName}
              className="h-auto w-[220px] max-w-full object-contain md:w-[280px]"
            />
          </Link>
          <p className="mt-3 text-sm text-slate-300">
            {locale === "ar"
              ? "منصة أخبار ومعلومات مصرفية للسودان تغطي البنوك والخدمات المالية والتكنولوجيا المالية."
              : "A Sudan-focused banking and financial news portal covering banks, fintech, and economic trends."}
          </p>
        </div>
        <div>
          <p className="font-bold text-white">{locale === "ar" ? "روابط مهمة" : "Important Links"}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><Link href={`/${locale}/about`} className="transition hover:text-cyan-300">{t.nav.about}</Link></li>
            <li><Link href={`/${locale}/contact`} className="transition hover:text-cyan-300">{t.nav.contact}</Link></li>
            <li><Link href={`/${locale}/privacy-policy`} className="transition hover:text-cyan-300">{locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
            <li><Link href={`/${locale}/editorial-policy`} className="transition hover:text-cyan-300">{locale === "ar" ? "السياسة التحريرية" : "Editorial Policy"}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white">{locale === "ar" ? "الأقسام" : "Sections"}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><Link href={`/${locale}/news`} className="transition hover:text-cyan-300">{t.nav.latest}</Link></li>
            <li><Link href={`/${locale}/banks`} className="transition hover:text-cyan-300">{t.nav.banks}</Link></li>
            <li><Link href={`/${locale}/products`} className="transition hover:text-cyan-300">{t.nav.products}</Link></li>
            <li><Link href={`/${locale}/exchange-rates`} className="transition hover:text-cyan-300">{t.nav.rates}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white">{t.labels.newsletter}</p>
          <NewsletterForm locale={locale} />
          <p className="mt-2 text-xs text-slate-400">
            {locale === "ar" ? "حقوق النشر محفوظة" : "All rights reserved"} © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
