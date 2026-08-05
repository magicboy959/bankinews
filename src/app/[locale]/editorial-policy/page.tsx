import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function EditorialPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "السياسة التحريرية" : "Editorial Policy"}</h1>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
        <li>{safeLocale === "ar" ? "الدقة: يتم التحقق من المعلومات عبر مصادر رسمية أو موثوقة قبل النشر." : "Accuracy: Information is verified against official or trusted sources before publication."}</li>
        <li>{safeLocale === "ar" ? "الاستقلالية: يتم الفصل بوضوح بين الأخبار، الرأي، والإعلانات." : "Independence: News, opinion, and advertising are clearly separated."}</li>
        <li>{safeLocale === "ar" ? "الشفافية: نعرض المصدر وتاريخ التحديث متى توفرت البيانات." : "Transparency: Source attribution and update timestamps are shown whenever available."}</li>
        <li>{safeLocale === "ar" ? "التصحيحات: يتم توثيق أي تعديل جوهري في المحتوى المنشور." : "Corrections: Material edits are logged and reflected in published updates."}</li>
      </ul>
    </div>
  );
}
