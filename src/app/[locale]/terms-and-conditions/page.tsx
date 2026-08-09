import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-2xl font-black text-[var(--foreground)]">{safeLocale === "ar" ? "الشروط والأحكام" : "Terms and Conditions"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <p>
          {safeLocale === "ar"
            ? "باستخدام هذا الموقع فإنك توافق على استخدام المحتوى لأغراض معلوماتية فقط، مع احترام حقوق النشر ونسب المحتوى لمصدره."
            : "By using this website, you agree that content is for informational use and should be attributed properly when referenced."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا يجوز استخدام الموقع لانتحال صفة جهة مصرفية أو طلب معلومات حساسة من المستخدمين."
            : "The platform must not be used to impersonate financial institutions or solicit sensitive banking information."}
        </p>
      </div>
    </div>
  );
}
