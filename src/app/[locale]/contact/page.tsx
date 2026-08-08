import { isLocale, type Locale } from "@/lib/i18n/config";
import { ContactForm } from "@/components/ui/contact-form";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-3xl font-black text-[var(--foreground)]">{safeLocale === "ar" ? "اتصل بنا" : "Contact Us"}</h1>
      <p className="text-sm text-[var(--text-muted)]">
        {safeLocale === "ar"
          ? "للاستفسارات العامة والتصحيحات والتحذيرات الأمنية والتغطية التحريرية."
          : "For general inquiries, editorial corrections, security alerts, and press submissions."}
      </p>
      <ContactForm locale={safeLocale} />
    </div>
  );
}
