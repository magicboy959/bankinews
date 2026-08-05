import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-black text-[#0A2342]">{safeLocale === "ar" ? "من نحن" : "About Us"}</h1>
      <p className="mt-4 leading-8 text-slate-700">
        {safeLocale === "ar"
          ? "بنكي نيوز السودان منصة تحريرية مستقلة تغطي الأخبار المصرفية والمالية والتقنية المالية في السودان، مع التزام واضح بالدقة والتحقق من المصادر والتصحيحات والتمييز بين الأخبار والمحتوى الإعلاني."
          : "BankiNews Sudan is an independent editorial platform covering banking, financial services, fintech, and economic trends in Sudan with strict source verification and transparency."}
      </p>
    </div>
  );
}
