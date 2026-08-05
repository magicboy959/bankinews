import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function CorrectionsPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "سياسة التصحيحات" : "Corrections Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <p>
          {safeLocale === "ar"
            ? "نلتزم بتصحيح الأخطاء الواقعية فور التأكد منها، مع توضيح تاريخ التحديث ونوع التصحيح داخل المادة إن كان التعديل جوهريا."
            : "We correct factual errors promptly once verified, and we note material changes with update timestamps where applicable."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "يمكن للقراء إرسال طلبات التصحيح عبر صفحة التواصل مع ذكر الرابط والملاحظة المدعومة بمصدر موثوق."
            : "Readers can submit correction requests via the contact page and should include the article URL and reliable supporting source."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا تعتبر الاختلافات التحليلية أو الآراء المهنية أخطاء إلا إذا تضمنت معلومات غير دقيقة يمكن التحقق منها."
            : "Differences in analysis or opinion are not treated as factual errors unless verifiable inaccuracies are present."}
        </p>
      </div>
    </div>
  );
}
