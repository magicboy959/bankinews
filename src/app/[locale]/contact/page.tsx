import { isLocale, type Locale } from "@/lib/i18n/config";
import { ContactForm } from "@/components/ui/contact-form";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-black text-[#0A2342]">{safeLocale === "ar" ? "اتصل بنا" : "Contact Us"}</h1>
      <p className="text-sm text-slate-600">
        {safeLocale === "ar"
          ? "للاستفسارات العامة والتصحيحات والتحذيرات الأمنية والتغطية التحريرية."
          : "For general inquiries, editorial corrections, security alerts, and press submissions."}
      </p>
      <ContactForm locale={safeLocale} />
    </div>
  );
}
