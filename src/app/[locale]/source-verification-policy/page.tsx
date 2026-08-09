import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function SourceVerificationPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <h1 className="text-2xl font-black text-[var(--foreground)]">{safeLocale === "ar" ? "سياسة المصادر والتحقق" : "Source and Verification Policy"}</h1>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <p>
          {safeLocale === "ar"
            ? "نعتمد على بيانات الجهات الرسمية، تصريحات المتحدثين المعتمدين، الوثائق المنشورة، والمصادر المهنية القابلة للتتبع."
            : "We prioritize official publications, authorized spokesperson statements, published documents, and traceable professional sources."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "عند تعذر الوصول إلى مصدر أولي، يتم توضيح ذلك بوضوح داخل المادة مع الإشارة إلى مستوى التحقق."
            : "If a primary source is unavailable, we disclose this clearly and indicate the verification level in the article."}
        </p>
        <p>
          {safeLocale === "ar"
            ? "البيانات المالية المتغيرة مثل أسعار الصرف تعرض بصيغة معلوماتية مع ذكر التاريخ والمصدر وإخلاء مسؤولية مناسب."
            : "Time-sensitive financial data such as exchange rates is presented informationally with source/date attribution and clear disclaimers."}
        </p>
      </div>
    </div>
  );
}
