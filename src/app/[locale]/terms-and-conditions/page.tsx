import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Terms of Use | Banki News",
  description: "Terms governing access to and use of the Banki News website and services.",
};

const effectiveDate = "11 August 2026";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  const sections = isArabic
    ? [
        { title: "1. قبول الشروط", content: "باستخدام موقع بنكي نيوز أو أي خدمة مرتبطة به، فإنك توافق على هذه الشروط وسياسة الخصوصية والسياسات المنشورة ذات الصلة. إذا كنت لا توافق، فيرجى عدم استخدام الخدمة." },
        { title: "2. طبيعة الخدمة", content: "بنكي نيوز منصة إخبارية ومعلوماتية مستقلة تغطي المصارف والخدمات المالية والاقتصاد والتكنولوجيا المالية. قد نغير المحتوى أو التصميم أو الخصائص أو نوقف جزءاً من الخدمة عند الحاجة." },
        { title: "3. ليست نصيحة مالية", content: "المحتوى مقدم لأغراض إخبارية وتعليمية عامة فقط، ولا يشكل نصيحة مالية أو استثمارية أو قانونية أو ضريبية، ولا توصية بشراء منتج أو فتح حساب أو إجراء معاملة. تحقق من المعلومات لدى الجهة الرسمية واستشر مختصاً مؤهلاً قبل اتخاذ قرار مالي." },
        { title: "4. دقة المعلومات وأسعار الصرف", content: "نسعى إلى الدقة والتحقق من المصادر، لكن المعلومات والأسعار والرسوم والشروط قد تتغير أو تتأخر أو تحتوي على خطأ. أسعار الصرف المنشورة إرشادية ما لم يذكر خلاف ذلك، وقد تختلف عن السعر الفعلي لدى البنك أو السوق أو مقدم الخدمة." },
        { title: "5. الحسابات والتعليقات والمحتوى المرسل", content: "عند إرسال تعليق أو رسالة أو مادة، يجب أن تكون المعلومات صحيحة وألا تنتهك القانون أو حقوق الآخرين. تمنح بنكي نيوز إذناً غير حصري لعرض المحتوى الذي تختار نشره وإدارته لأغراض تشغيل الخدمة، مع بقاء حقوقك الأصلية محفوظة." },
        { title: "6. الاستخدام المقبول", content: "يحظر استخدام الموقع للاحتيال أو انتحال صفة بنك أو شخص، وطلب كلمات مرور أو رموز تحقق أو بيانات بطاقات، ونشر البرمجيات الضارة أو الرسائل المزعجة، وجمع بيانات المستخدمين دون إذن، والتحايل على الحماية، وتعطيل الموقع، أو استخدام المحتوى بطريقة غير قانونية أو مضللة." },
        { title: "7. الملكية الفكرية", content: "يعود محتوى بنكي نيوز وتصميمه وشعاراته ومواده الأصلية إلى بنكي نيوز أو أصحاب الحقوق. يجوز مشاركة روابط المقالات واقتباس أجزاء محدودة مع ذكر المصدر والرابط. لا يجوز نسخ المواد كاملة أو إعادة نشرها تجارياً أو إزالة نسبتها دون إذن مكتوب، باستثناء ما يسمح به القانون." },
        { title: "8. المواد والصور التابعة لأطراف أخرى", content: "قد نستخدم أسماء وشعارات وصوراً أو بيانات لأغراض إخبارية أو بموجب ترخيص أو إذن. تظل العلامات التجارية ملكاً لأصحابها، وظهورها لا يعني الرعاية أو الشراكة ما لم نذكر ذلك بوضوح." },
        { title: "9. المحتوى المدفوع والإعلانات", content: "نميز المحتوى المدفوع أو برعاية بوسم واضح. لا يعني الإعلان أو الرعاية أن بنكي نيوز يضمن المعلن أو المنتج أو الخدمة. تقع مسؤولية التحقق من العروض والشروط والتعاملات على المستخدم والجهة المقدمة." },
        { title: "10. الروابط والخدمات الخارجية", content: "قد تتضمن الخدمة روابط أو تضمينات من بنوك ومنصات اجتماعية ومواقع أخرى. لا ندير تلك الخدمات ولا نتحكم في محتواها أو توفرها أو ممارساتها، واستخدامك لها يخضع لشروطها وسياساتها." },
        { title: "11. النشرات والإشعارات", content: "عند الاشتراك، توافق على تلقي الرسائل التي اخترتها. يمكنك إلغاء الاشتراك عبر الرابط الموجود في البريد. قد نرسل رسائل تشغيلية ضرورية تتعلق بطلب أو أمان الخدمة عندما يكون ذلك مناسباً." },
        { title: "12. توفر الخدمة والأمان", content: "نحاول توفير خدمة آمنة ومستقرة، لكننا لا نضمن عملها دون انقطاع أو خلوها تماماً من الأخطاء أو المخاطر. يجوز لنا تقييد الوصول أو حظر النشاط المسيء أو إجراء صيانة أو تغييرات أمنية دون إشعار مسبق عند الضرورة." },
        { title: "13. إخلاء المسؤولية", content: "تقدم الخدمة والمحتوى على أساس «كما هو» و«حسب التوفر» ضمن الحد الذي يسمح به القانون. لا نقدم ضماناً ضمنياً بشأن الاكتمال أو الملاءمة لغرض معين أو النتائج المترتبة على الاعتماد على المحتوى." },
        { title: "14. تحديد المسؤولية", content: "إلى أقصى حد يسمح به القانون، لا تتحمل بنكي نيوز أو فريقها مسؤولية الخسائر غير المباشرة أو التبعية أو فقدان الأرباح أو البيانات الناتج عن استخدام الخدمة أو الاعتماد على محتواها. لا تستبعد هذه الشروط مسؤولية لا يجوز استبعادها قانوناً." },
        { title: "15. التعويض", content: "توافق، في الحدود التي يسمح بها القانون، على تحمل المسؤولية عن المطالبات المعقولة الناتجة عن إساءة استخدامك للخدمة أو مخالفتك لهذه الشروط أو انتهاكك حقوق الغير." },
        { title: "16. الخصوصية", content: "ينظم جمع المعلومات الشخصية واستخدامها وحمايتها وفق سياسة الخصوصية المنشورة لدينا، وهي جزء من هذه الشروط." },
        { title: "17. التعديلات", content: "قد نحدث هذه الشروط لتعكس تغير الخدمة أو القانون. ننشر النسخة المحدثة وتاريخ سريانها في هذه الصفحة. استمرار الاستخدام بعد دخول التعديل حيز التنفيذ يعني قبول الشروط المحدثة." },
        { title: "18. القانون وتسوية النزاعات", content: "تفسر هذه الشروط وفق القوانين واجبة التطبيق على بنكي نيوز، مع مراعاة حقوق المستهلك الإلزامية في بلد المستخدم. نشجع على التواصل معنا أولاً لمحاولة حل أي نزاع بحسن نية." },
      ]
    : [
        { title: "1. Acceptance", content: "By using the Banki News website or related services, you agree to these Terms, our Privacy Policy, and applicable published policies. If you do not agree, do not use the service." },
        { title: "2. The service", content: "Banki News is an independent news and information platform covering banking, financial services, economics, and fintech. We may change content, design, features, or discontinue part of the service when necessary." },
        { title: "3. No financial advice", content: "Content is provided for general news and educational purposes only. It is not financial, investment, legal, or tax advice and is not a recommendation to buy a product, open an account, or complete a transaction. Verify information with the official institution and consult a qualified professional before making financial decisions." },
        { title: "4. Accuracy and exchange rates", content: "We seek accuracy and source verification, but information, rates, fees, and terms may change, be delayed, or contain errors. Published exchange rates are indicative unless stated otherwise and may differ from actual bank, market, or provider rates." },
        { title: "5. Comments and submitted content", content: "Information you submit must be accurate and must not violate law or third-party rights. You grant Banki News a non-exclusive permission to display and manage content you choose to publish for operation of the service, while retaining your underlying rights." },
        { title: "6. Acceptable use", content: "You must not use the site for fraud, impersonation, requesting passwords, verification codes or card data, distributing malware or spam, collecting user data without permission, bypassing safeguards, disrupting the service, or using content unlawfully or deceptively." },
        { title: "7. Intellectual property", content: "Banki News content, design, logos, and original materials belong to Banki News or their respective rights holders. You may share article links and quote limited excerpts with attribution and a link. Full copying, commercial republication, or removal of attribution requires written permission unless permitted by law." },
        { title: "8. Third-party materials", content: "We may use names, logos, images, or data for news reporting or under license or permission. Trademarks remain the property of their owners. Their appearance does not imply sponsorship or partnership unless clearly stated." },
        { title: "9. Advertising and sponsored content", content: "Paid or sponsored material is identified with a clear label. Advertising or sponsorship does not mean Banki News guarantees an advertiser, product, or service. Users and providers remain responsible for verifying offers, terms, and transactions." },
        { title: "10. External links and services", content: "The service may link to or embed banks, social platforms, and other websites. We do not operate or control their content, availability, or practices. Your use of them is governed by their own terms and policies." },
        { title: "11. Newsletters and notices", content: "When you subscribe, you agree to receive the communications selected. You may unsubscribe through the email link. Where appropriate, we may send necessary operational messages concerning a request or service security." },
        { title: "12. Availability and security", content: "We aim to provide a secure, reliable service but do not guarantee uninterrupted or completely error-free operation. We may restrict access, block abusive activity, perform maintenance, or make security changes without prior notice where necessary." },
        { title: "13. Disclaimer", content: "The service and content are provided “as is” and “as available” to the extent permitted by law. We make no implied guarantee of completeness, fitness for a particular purpose, or outcomes from reliance on content." },
        { title: "14. Limitation of liability", content: "To the maximum extent permitted by law, Banki News and its team are not liable for indirect or consequential loss, lost profits, or lost data arising from use of the service or reliance on content. These Terms do not exclude liability that cannot legally be excluded." },
        { title: "15. Indemnity", content: "To the extent permitted by law, you are responsible for reasonable claims resulting from misuse of the service, violation of these Terms, or infringement of another person’s rights." },
        { title: "16. Privacy", content: "Our collection, use, and protection of personal information are governed by our published Privacy Policy, which forms part of these Terms." },
        { title: "17. Changes", content: "We may update these Terms to reflect service or legal changes. We will publish the revised version and effective date here. Continued use after changes take effect means acceptance of the updated Terms." },
        { title: "18. Governing law and disputes", content: "These Terms are interpreted under laws applicable to Banki News, subject to mandatory consumer rights in the user’s country. We encourage contacting us first to seek a good-faith resolution of any dispute." },
      ];

  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-8">
      <header className="border-b border-[var(--border)] pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005F73]">Banki News</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">{isArabic ? "شروط الاستخدام" : "Terms of Use"}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {isArabic ? "تاريخ السريان: 11 أغسطس 2026" : `Effective date: ${effectiveDate}`}
        </p>
      </header>

      <div className="mt-6 space-y-7 text-sm leading-7 text-[var(--text-muted)]">
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 font-medium text-[var(--foreground)]">
          {isArabic
            ? "يرجى قراءة هذه الشروط بعناية قبل استخدام بنكي نيوز."
            : "Please read these Terms carefully before using Banki News."}
        </p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-black text-[var(--foreground)]">{section.title}</h2>
            <p className="mt-2">{section.content}</p>
          </section>
        ))}

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "19. التواصل" : "19. Contact"}</h2>
          <p className="mt-2">
            {isArabic ? "للاستفسار عن هذه الشروط أو الإبلاغ عن إساءة استخدام، تواصل مع فريق بنكي نيوز." : "For questions about these Terms or to report misuse, contact the Banki News team."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={`/${safeLocale}/contact`} className="inline-flex rounded-md bg-[#005F73] px-4 py-2 font-bold text-white transition hover:bg-[#004a59]">
              {isArabic ? "صفحة التواصل" : "Contact us"}
            </Link>
            <Link href={`/${safeLocale}/privacy-policy`} className="inline-flex rounded-md border border-[#005F73]/30 px-4 py-2 font-bold text-[#005F73] transition hover:bg-[#005F73]/10">
              {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
