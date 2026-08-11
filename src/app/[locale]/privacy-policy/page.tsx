import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Privacy Policy | Banki News",
  description: "How Banki News collects, uses, protects, and manages personal information.",
};

const effectiveDate = "11 August 2026";

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  const sections = isArabic
    ? [
        {
          title: "1. نطاق هذه السياسة",
          content: "توضح هذه السياسة كيفية تعامل بنكي نيوز مع المعلومات عند زيارة موقعنا، الاشتراك في نشراتنا، إرسال تعليق أو رسالة، أو التفاعل مع خدماتنا على منصات التواصل الاجتماعي.",
        },
        {
          title: "2. المعلومات التي نجمعها",
          content: "قد نجمع الاسم والبريد الإلكتروني عند الاشتراك، والمعلومات التي تقدمها في نماذج التواصل أو التعليقات، وبيانات تقنية محدودة مثل عنوان IP ونوع المتصفح والجهاز والصفحات التي تمت زيارتها وسجلات الأمان. لا نطلب كلمات المرور المصرفية أو أرقام البطاقات أو رموز التحقق البنكية.",
        },
        {
          title: "3. كيفية استخدام المعلومات",
          content: "نستخدم المعلومات لتشغيل الموقع، إرسال النشرات التي طلبتها، الرد على الاستفسارات، إدارة التعليقات، قياس وتحسين الأداء، حماية الموقع من الاحتيال والإساءة، والوفاء بالالتزامات القانونية والتحريرية.",
        },
        {
          title: "4. النشرات والتواصل التسويقي",
          content: "لا نرسل رسائل تسويقية إلا عند وجود أساس مشروع لذلك، ويمكنك إلغاء الاشتراك في أي وقت عبر رابط الإلغاء الموجود في الرسالة. قد نحتفظ بسجل محدود لطلب الإلغاء حتى لا نعيد الاشتراك دون موافقتك.",
        },
        {
          title: "5. ملفات الارتباط والتحليلات",
          content: "نستخدم ملفات ارتباط ضرورية لتشغيل الموقع وأمانه، وقد نستخدم أدوات قياس وتحليل لفهم الاستخدام وتحسين المحتوى. يمكنك التحكم في ملفات الارتباط من إعدادات المتصفح، وقد يؤثر تعطيل الضروري منها في بعض الوظائف.",
        },
        {
          title: "6. تكاملات Facebook وInstagram ومنصات التواصل",
          content: "تستخدم أدوات النشر الإدارية في بنكي نيوز واجهات المنصات لنشر المحتوى على حساباتنا الرسمية. نحفظ مفاتيح الوصول ومعرفات الحسابات في بيئة خادم محمية ولا نعرضها للزوار. قد تزودنا المنصة ببيانات تشغيلية مثل معرف المنشور وحالة النشر واسم الحساب. يخضع استخدامك لتلك المنصات أيضاً لسياسات الخصوصية الخاصة بها.",
        },
        {
          title: "7. مشاركة المعلومات ومقدمو الخدمات",
          content: "لا نبيع البيانات الشخصية. قد نشارك الحد الأدنى اللازم مع مزودي الاستضافة والبريد والتحليلات والأمان ومنصات التواصل الذين يساعدوننا في تشغيل الخدمة، أو عندما يطلب القانون ذلك، أو لحماية الحقوق والسلامة. نلزم مقدمي الخدمات بالتعامل مع البيانات للغرض المحدد فقط.",
        },
        {
          title: "8. الاحتفاظ بالبيانات",
          content: "نحتفظ بالمعلومات بقدر الحاجة للغرض الذي جُمعت من أجله، ولحماية الموقع، والوفاء بالمتطلبات القانونية والمحاسبية. تختلف المدة حسب نوع البيانات، ثم نحذفها أو نجعلها غير قابلة للتعريف عندما لا تعود مطلوبة.",
        },
        {
          title: "9. الأمان",
          content: "نطبق إجراءات تقنية وتنظيمية معقولة لحماية المعلومات، ومنها تقييد الوصول وحماية الاتصالات والأسرار التشغيلية. لا توجد وسيلة نقل أو تخزين إلكتروني آمنة بنسبة مئة في المئة، لذلك لا يمكن ضمان الحماية المطلقة.",
        },
        {
          title: "10. حقوقك وحذف البيانات",
          content: "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها، أو الاعتراض على بعض الاستخدامات، أو سحب موافقتك حيث تنطبق. سنطلب معلومات كافية للتحقق من الهوية والطلب، وقد نحتفظ بما يفرضه القانون أو يلزم لحماية الحقوق. يمكنك أيضاً حذف بيانات مرتبطة بتفاعل مباشر معنا عبر تقديم طلب من صفحة التواصل.",
        },
        {
          title: "11. خصوصية الأطفال",
          content: "خدمات بنكي نيوز موجهة لجمهور عام وليست مصممة للأطفال دون 13 عاماً، ولا نجمع عن علم بيانات شخصية منهم. إذا علمنا بجمعها دون موافقة مناسبة فسنتخذ خطوات معقولة لحذفها.",
        },
        {
          title: "12. الروابط الخارجية والنقل الدولي",
          content: "قد يحتوي الموقع على روابط لمواقع أخرى لا نديرها. وقد يعالج مقدمو الخدمات البيانات في دول مختلفة وفق ضماناتهم القانونية والأمنية. ننصح بمراجعة سياسة كل خدمة خارجية قبل تزويدها بمعلوماتك.",
        },
        {
          title: "13. تحديث السياسة",
          content: "قد نحدث هذه السياسة عند تغير خدماتنا أو متطلباتنا القانونية. سننشر النسخة الجديدة في هذه الصفحة ونعدل تاريخ السريان، وقد نقدم إشعاراً إضافياً عند وجود تغيير جوهري.",
        },
      ]
    : [
        { title: "1. Scope", content: "This policy explains how Banki News handles information when you visit our website, subscribe to newsletters, submit a comment or message, or interact with our services on social platforms." },
        { title: "2. Information we collect", content: "We may collect your name and email when you subscribe, information submitted through contact forms or comments, and limited technical data such as IP address, browser and device type, visited pages, and security logs. We do not ask for banking passwords, card numbers, or bank verification codes." },
        { title: "3. How we use information", content: "We use information to operate the site, deliver requested newsletters, respond to inquiries, moderate comments, measure and improve performance, prevent fraud and abuse, and meet legal and editorial obligations." },
        { title: "4. Newsletters and marketing", content: "We send marketing communications only where we have a lawful basis. You can unsubscribe through the link in each email. We may retain a limited suppression record so you are not subscribed again without permission." },
        { title: "5. Cookies and analytics", content: "We use essential cookies for site operation and security and may use measurement tools to understand usage and improve content. Browser settings let you control cookies, although disabling essential cookies may affect functionality." },
        { title: "6. Facebook, Instagram, and social integrations", content: "Banki News administrative publishing tools use platform APIs to publish content to our official accounts. Access credentials and account identifiers are stored in a protected server environment and are not exposed to visitors. Platforms may provide operational data such as post identifiers, publishing status, and account names. Your use of those platforms is also governed by their own privacy policies." },
        { title: "7. Sharing and service providers", content: "We do not sell personal data. We may share the minimum necessary information with hosting, email, analytics, security, and social-platform providers that help us operate, when required by law, or to protect rights and safety. Providers are expected to process data only for the relevant purpose." },
        { title: "8. Retention", content: "We retain information only as long as reasonably needed for its purpose, site protection, and legal or accounting requirements. Retention varies by data type, after which information is deleted or de-identified when no longer required." },
        { title: "9. Security", content: "We use reasonable technical and organizational safeguards, including restricted access and protection of communications and operational secrets. No electronic transmission or storage method is completely secure, so absolute security cannot be guaranteed." },
        { title: "10. Your rights and data deletion", content: "You may request access, correction, or deletion of your data; object to certain uses; or withdraw consent where applicable. We may request enough information to verify your identity and request and may retain information required by law or necessary to protect rights. Requests concerning data from direct interactions with us can be submitted through our contact page." },
        { title: "11. Children", content: "Banki News is a general-audience service and is not designed for children under 13. We do not knowingly collect their personal information. If we learn that such information was collected without appropriate consent, we will take reasonable steps to delete it." },
        { title: "12. External links and international processing", content: "Our site may link to services we do not operate. Service providers may process information in different countries under their legal and security safeguards. Review each external service’s privacy policy before providing information." },
        { title: "13. Policy changes", content: "We may update this policy as our services or legal requirements change. We will publish the revised version here, update its effective date, and may provide additional notice for material changes." },
      ];

  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-8">
      <header className="border-b border-[var(--border)] pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005F73]">Banki News</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--foreground)]">{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {isArabic ? `تاريخ السريان: 11 أغسطس 2026` : `Effective date: ${effectiveDate}`}
        </p>
      </header>

      <div className="mt-6 space-y-7 text-sm leading-7 text-[var(--text-muted)]">
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 font-medium text-[var(--foreground)]">
          {isArabic
            ? "تحترم بنكي نيوز خصوصيتك وتلتزم بجمع أقل قدر لازم من المعلومات لتقديم خدمة إخبارية آمنة وموثوقة."
            : "Banki News respects your privacy and limits collection to information reasonably needed to provide a safe, reliable news service."}
        </p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-black text-[var(--foreground)]">{section.title}</h2>
            <p className="mt-2">{section.content}</p>
          </section>
        ))}

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "14. التواصل وطلبات الخصوصية" : "14. Contact and privacy requests"}</h2>
          <p className="mt-2">
            {isArabic
              ? "للاستفسار عن هذه السياسة أو تقديم طلب متعلق بالخصوصية أو حذف البيانات، استخدم صفحة التواصل وحدد أن الرسالة طلب خصوصية."
              : "For questions, privacy requests, or data deletion requests, use our contact page and identify the message as a privacy request."}
          </p>
          <Link href={`/${safeLocale}/contact`} className="mt-3 inline-flex rounded-md bg-[#005F73] px-4 py-2 font-bold text-white transition hover:bg-[#004a59]">
            {isArabic ? "التواصل مع بنكي نيوز" : "Contact Banki News"}
          </Link>
        </section>
      </div>
    </article>
  );
}
