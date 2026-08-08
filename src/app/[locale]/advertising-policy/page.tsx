import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function AdvertisingPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-2xl font-black text-[var(--foreground)]">{safeLocale === "ar" ? "سياسة الإعلانات" : "Advertising Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <p>
          {safeLocale === "ar"
            ? "تقبل المنصة الإعلانات المتعلقة بالقطاع المالي والمصرفي بما يتوافق مع القوانين والضوابط الأخلاقية، ويتم تمييزها بصريا بشكل واضح."
            : "The platform accepts finance-related advertising subject to legal and ethical standards, with clear visual labeling."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا تؤثر الإعلانات على القرارات التحريرية أو ترتيب الأخبار أو نتائج التغطية الصحفية."
            : "Advertising does not influence editorial decisions, article ranking, or newsroom coverage outcomes."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "يحق للإدارة رفض أي إعلان يحتوي على ادعاءات مضللة، أو روابط غير آمنة، أو محتوى يطلب بيانات مصرفية حساسة من المستخدمين."
            : "We may reject ads containing misleading claims, unsafe links, or content requesting sensitive banking credentials."}
        </p>
      </div>
    </div>
  );
}
