import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <p>
          {safeLocale === "ar"
            ? "نجمع الحد الأدنى من البيانات اللازمة لتشغيل الموقع مثل البريد الإلكتروني للاشتراك والرسائل الواردة عبر نموذج التواصل." 
            : "We collect the minimum data necessary to operate the platform, such as newsletter emails and contact form submissions."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا ننشر البريد الإلكتروني أو معلومات الاتصال الخاصة بالمستخدمين بشكل علني، ولا نبيع البيانات لطرف ثالث."
            : "User emails and private contact details are never displayed publicly and are not sold to third parties."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "يمكن للمستخدم طلب حذف بياناته أو إلغاء الاشتراك في أي وقت عبر روابط الإلغاء أو التواصل معنا مباشرة."
            : "Users may request data deletion or unsubscribe at any time via unsubscribe links or direct contact."}
        </p>
      </div>
    </div>
  );
}
