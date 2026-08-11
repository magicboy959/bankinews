import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "User Data Deletion | Banki News",
  description: "Instructions for requesting deletion of personal information held by Banki News.",
};

export default async function DataDeletionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-8">
      <header className="border-b border-[var(--border)] pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005F73]">Banki News</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">
          {isArabic ? "حذف بيانات المستخدم" : "User Data Deletion"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {isArabic ? "آخر تحديث: 11 أغسطس 2026" : "Last updated: 11 August 2026"}
        </p>
      </header>

      <div className="mt-6 space-y-7 text-sm leading-7 text-[var(--text-muted)]">
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 font-medium text-[var(--foreground)]">
          {isArabic
            ? "يمكنك طلب حذف المعلومات الشخصية التي قدمتها مباشرة إلى بنكي نيوز. تقديم الطلب مجاني ولا يتطلب إرسال كلمة مرور أو رمز تحقق أو بيانات مصرفية."
            : "You may request deletion of personal information submitted directly to Banki News. Requests are free, and we will never ask for your password, verification code, or banking details."}
        </p>

        <section>
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "البيانات التي يمكن طلب حذفها" : "Information you may ask us to delete"}</h2>
          <ul className="mt-2 list-disc space-y-2 ps-5">
            <li>{isArabic ? "بيانات الاشتراك في النشرة البريدية، مثل الاسم والبريد الإلكتروني." : "Newsletter subscription data, such as your name and email address."}</li>
            <li>{isArabic ? "الرسائل والمعلومات المقدمة عبر نماذج التواصل." : "Messages and information submitted through contact forms."}</li>
            <li>{isArabic ? "التعليقات أو المعلومات المرتبطة بها، عندما يمكن التحقق من ملكيتك لها." : "Comments and associated information where we can verify ownership."}</li>
            <li>{isArabic ? "أي بيانات تشغيلية مرتبطة بتفاعل مصرح به مع خدمات بنكي نيوز الاجتماعية، إن وجدت." : "Operational data associated with an authorized interaction with Banki News social services, if any."}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "كيفية تقديم الطلب" : "How to submit a request"}</h2>
          <ol className="mt-2 list-decimal space-y-2 ps-5">
            <li>{isArabic ? "افتح صفحة التواصل عبر الزر أدناه." : "Open the contact page using the button below."}</li>
            <li>{isArabic ? "اكتب «طلب حذف بيانات» في بداية الرسالة." : "Begin your message with “Data deletion request.”"}</li>
            <li>{isArabic ? "استخدم البريد الإلكتروني نفسه المرتبط بالاشتراك أو التفاعل المطلوب حذفه." : "Use the same email address associated with the subscription or interaction."}</li>
            <li>{isArabic ? "حدد نوع البيانات أو الخدمة المعنية، من دون إرسال كلمات مرور أو معلومات مالية حساسة." : "Identify the relevant data or service without sending passwords or sensitive financial information."}</li>
          </ol>
          <Link href={`/${safeLocale}/contact`} className="mt-4 inline-flex rounded-md bg-[#005F73] px-4 py-2 font-bold text-white transition hover:bg-[#004a59]">
            {isArabic ? "تقديم طلب حذف البيانات" : "Submit a deletion request"}
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "التحقق والمدة المتوقعة" : "Verification and timing"}</h2>
          <p className="mt-2">
            {isArabic
              ? "قد نطلب معلومات محدودة للتحقق من الهوية ومنع حذف بيانات شخص آخر. نؤكد استلام الطلب عادة خلال سبعة أيام، ونستكمل الطلب الصحيح خلال 30 يوماً، أو نوضح سبب الحاجة إلى وقت إضافي حيث يسمح القانون."
              : "We may request limited information to verify identity and prevent deletion of another person’s data. We normally acknowledge a request within seven days and complete a valid request within 30 days, or explain why additional time is needed where permitted by law."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "Facebook وInstagram" : "Facebook and Instagram"}</h2>
          <p className="mt-2">
            {isArabic
              ? "يمكنك إزالة وصول أي تطبيق من إعدادات التطبيقات ومواقع الويب في حساب Facebook أو Instagram. لإزالة بيانات سبق إرسالها مباشرة إلى بنكي نيوز، قدم طلباً عبر الخطوات أعلاه. لا نطلب بيانات تسجيل الدخول إلى حسابك الاجتماعي لتنفيذ الحذف."
              : "You can remove an app’s access through the Apps and Websites settings in your Facebook or Instagram account. To remove information previously sent directly to Banki News, submit a request using the steps above. We do not require your social-account login credentials to process deletion."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "ما قد نحتفظ به" : "Information we may retain"}</h2>
          <p className="mt-2">
            {isArabic
              ? "قد نحتفظ بالحد الأدنى من المعلومات عندما يفرض القانون ذلك، أو لحماية الحقوق والأمان ومنع الاحتيال، أو للاحتفاظ بسجل إلغاء الاشتراك حتى لا نرسل رسائل غير مرغوبة. نحذف البيانات الأخرى أو نجعلها غير قابلة للتعريف عند اكتمال الطلب. قد تستغرق النسخ الاحتياطية الآمنة وقتاً إضافياً حتى تدور تلقائياً."
              : "We may retain the minimum information required by law, needed to protect rights and security or prevent fraud, or necessary to preserve an unsubscribe suppression record. Other data is deleted or de-identified when the request is completed. Secure backups may take additional time to rotate automatically."}
          </p>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "المساعدة والسياسات المرتبطة" : "Help and related policies"}</h2>
          <p className="mt-2">
            {isArabic ? "إذا تعذر عليك استخدام نموذج التواصل، راجع صفحة التواصل للحصول على وسائل الاتصال المتاحة. يمكنك الاطلاع أيضاً على كيفية تعاملنا مع المعلومات في سياسة الخصوصية." : "If you cannot use the contact form, review our contact page for available contact methods. Our Privacy Policy provides more information about how we handle information."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={`/${safeLocale}/contact`} className="font-bold text-[#005F73] underline">
              {isArabic ? "التواصل" : "Contact"}
            </Link>
            <Link href={`/${safeLocale}/privacy-policy`} className="font-bold text-[#005F73] underline">
              {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href={`/${safeLocale}/terms`} className="font-bold text-[#005F73] underline">
              {isArabic ? "شروط الاستخدام" : "Terms of Use"}
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
