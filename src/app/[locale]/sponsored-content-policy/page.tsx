import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function SponsoredContentPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "سياسة المحتوى المدعوم" : "Sponsored Content Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <p>
          {safeLocale === "ar"
            ? "يتم وسم أي مادة مدفوعة بوضوح بكلمة (محتوى برعاية) أو (Sponsored) في أعلى المقال وبشكل ظاهر."
            : "Any paid placement is clearly labeled as Sponsored at the top of the article."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "تخضع المواد المدعومة لمراجعة تحريرية للتأكد من خلوها من الادعاءات الزائفة أو المعلومات غير القابلة للتحقق."
            : "Sponsored material is reviewed to prevent false claims and unverifiable financial assertions."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا ينشر الموقع أي محتوى مدعوم يطلب كلمات مرور مصرفية أو رموز تحقق أو بيانات بطاقات حساسة."
            : "We do not publish sponsored content that solicits banking passwords, OTPs, or sensitive card data."}
        </p>
      </div>
    </div>
  );
}
