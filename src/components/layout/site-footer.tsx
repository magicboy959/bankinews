import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { NewsletterForm } from "@/components/ui/newsletter-form";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <p className="text-lg font-black text-[#0A2342]">{t.siteName}</p>
          <p className="mt-3 text-sm text-slate-600">
            {locale === "ar"
              ? "منصة أخبار ومعلومات مصرفية للسودان تغطي البنوك والخدمات المالية والتكنولوجيا المالية."
              : "A Sudan-focused banking and financial news portal covering banks, fintech, and economic trends."}
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-800">{locale === "ar" ? "روابط مهمة" : "Important Links"}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href={`/${locale}/about`}>{t.nav.about}</Link></li>
            <li><Link href={`/${locale}/contact`}>{t.nav.contact}</Link></li>
            <li><Link href={`/${locale}/privacy-policy`}>{locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
            <li><Link href={`/${locale}/editorial-policy`}>{locale === "ar" ? "السياسة التحريرية" : "Editorial Policy"}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-800">{locale === "ar" ? "الأقسام" : "Sections"}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href={`/${locale}/news`}>{t.nav.latest}</Link></li>
            <li><Link href={`/${locale}/banks`}>{t.nav.banks}</Link></li>
            <li><Link href={`/${locale}/products`}>{t.nav.products}</Link></li>
            <li><Link href={`/${locale}/exchange-rates`}>{t.nav.rates}</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-800">{t.labels.newsletter}</p>
          <NewsletterForm locale={locale} />
          <p className="mt-2 text-xs text-slate-500">
            {locale === "ar" ? "حقوق النشر محفوظة" : "All rights reserved"} © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
