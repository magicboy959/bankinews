import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function CookiePolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <p>
          {safeLocale === "ar"
            ? "نستخدم ملفات تعريف الارتباط الأساسية لتشغيل الموقع وتحسين الأداء، بالإضافة إلى ملفات تحليلية عند تفعيل أدوات القياس."
            : "We use essential cookies for core site functionality and optional analytics cookies when measurement tools are enabled."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "يمكن للمستخدم إدارة تفضيلات ملفات الارتباط من إعدادات المتصفح، وقد يؤثر التعطيل على بعض وظائف الموقع."
            : "Users can manage cookie preferences in browser settings; disabling cookies may affect certain features."}
        </p>
      </div>
    </div>
  );
}
