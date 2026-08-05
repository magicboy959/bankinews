import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function DisclaimerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black text-[#0A2342]">{safeLocale === "ar" ? "إخلاء المسؤولية" : "Disclaimer"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        <p>
          {safeLocale === "ar"
            ? "المحتوى المنشور في هذا الموقع مخصص للأغراض المعلوماتية ولا يشكل مشورة استثمارية أو قانونية أو مصرفية." 
            : "Content published on this platform is informational and does not constitute financial, legal, or investment advice."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "لا نقوم بطلب كلمات مرور الحسابات البنكية أو رموز OTP أو CVV أو أرقام PIN." 
            : "We never request online banking passwords, OTPs, CVV values, or card PINs."}
        </p>
      </div>
    </div>
  );
}
