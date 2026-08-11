import type { Metadata } from "next";
import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";

type ArticleRow = DbRow & { slug: string; title: string; summary: string };
type ProductRow = DbRow & { slug: string; name: string; bankName: string; shortDescription: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "التقنية المالية في السودان" : "Fintech in Sudan",
    description:
      safeLocale === "ar"
        ? "أخبار وأدلة التقنية المالية في السودان: المدفوعات الرقمية والمحافظ والخدمات المصرفية المفتوحة والأمن والهوية الرقمية."
        : "Sudan fintech news and guides covering digital payments, wallets, open banking, security, and digital identity.",
    path: `/${safeLocale}/fintech`,
  });
}

export default async function FintechPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  let articles: ArticleRow[] = [];
  let products: ProductRow[] = [];
  try {
    [articles, products] = await Promise.all([
      dbQuery<ArticleRow[]>(
        `SELECT a.slug, at.title, at.summary
         FROM articles a
         JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
         WHERE a.status = 'published'
           AND a.deleted_at IS NULL
           AND (
             EXISTS (
               SELECT 1
               FROM article_categories ac
               JOIN categories c ON c.id = ac.category_id AND c.deleted_at IS NULL
               WHERE ac.article_id = a.id AND (LOWER(c.slug) LIKE '%fintech%' OR LOWER(c.slug) LIKE '%digital%')
             )
             OR at.title LIKE '%فنتك%'
             OR at.title LIKE '%تقنية مالية%'
             OR at.title LIKE '%دفع إلكتروني%'
             OR LOWER(at.title) LIKE '%fintech%'
             OR at.summary LIKE '%تقنية مالية%'
           )
         ORDER BY a.published_at DESC
         LIMIT 12`,
        [safeLocale]
      ),
      dbQuery<ProductRow[]>(
        `SELECT p.slug, pt.name, bt.name AS bankName, pt.short_description AS shortDescription
         FROM products p
         JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
         JOIN banks b ON b.id = p.bank_id
         JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
         WHERE p.deleted_at IS NULL
           AND p.slug NOT LIKE 'demo-%'
           AND (
             LOWER(p.product_category) LIKE '%mobile%'
             OR LOWER(p.product_category) LIKE '%digital%'
             OR LOWER(p.product_category) LIKE '%wallet%'
             OR pt.name LIKE '%رقمي%'
             OR pt.name LIKE '%محفظ%'
           )
         ORDER BY p.updated_at DESC
         LIMIT 6`,
        [safeLocale, safeLocale]
      ),
    ]);
  } catch {
    articles = [];
    products = [];
  }

  const topics = isArabic
    ? [
        { icon: "📱", title: "المحافظ والخدمات المصرفية عبر الهاتف", text: "تغطية التطبيقات والمحافظ والتحويل والدفع وإدارة الحساب عبر الهاتف، مع الرجوع دائماً إلى القنوات الرسمية." },
        { icon: "💳", title: "المدفوعات الرقمية", text: "نقاط البيع والدفع عبر الإنترنت والرموز السريعة وتقنيات قبول المدفوعات لدى التجار." },
        { icon: "🔗", title: "واجهات الربط والخدمات المفتوحة", text: "كيف تسمح واجهات API والتكاملات الآمنة بابتكار خدمات مالية مترابطة حول الحسابات والمدفوعات." },
        { icon: "🪪", title: "الهوية والتحقق الرقمي", text: "التعرف الإلكتروني على العميل والتحقق من الهوية وما يرتبط بهما من وصول أسهل وحماية للبيانات." },
        { icon: "🛡️", title: "الأمن السيبراني ومكافحة الاحتيال", text: "حماية الحسابات والتطبيقات، والتصيد، وسرقة الرموز، والوعي بالمخاطر الرقمية المتغيرة." },
        { icon: "⚖️", title: "التنظيم والامتثال التقني", text: "السياسات والضوابط التي تنظم الابتكار المالي، وحماية المستهلك، والخصوصية، ومكافحة غسل الأموال." },
      ]
    : [
        { icon: "📱", title: "Mobile banking and wallets", text: "Coverage of apps, wallets, transfers, payments, and mobile account management, always linked back to official channels." },
        { icon: "💳", title: "Digital payments", text: "Point-of-sale systems, online payments, QR codes, and technologies that help merchants accept payments." },
        { icon: "🔗", title: "APIs and open services", text: "How secure APIs and integrations enable connected financial services around accounts and payments." },
        { icon: "🪪", title: "Digital identity and verification", text: "Electronic know-your-customer processes, identity checks, access, and responsible data protection." },
        { icon: "🛡️", title: "Cybersecurity and fraud prevention", text: "Account and app security, phishing, code theft, and awareness of changing digital risks." },
        { icon: "⚖️", title: "Regulation and regtech", text: "Rules governing financial innovation, consumer protection, privacy, and anti-money-laundering controls." },
      ];

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-[#005F73]/20 bg-gradient-to-br from-[#0A2342] via-[#064a60] to-[#008C95] p-6 text-white md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Banki News Fintech</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{isArabic ? "التقنية المالية في السودان" : "Fintech in Sudan"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          {isArabic
            ? "أخبار وأدلة تشرح كيف تغير التقنية المالية المدفوعات والخدمات المصرفية والوصول إلى المال، مع التركيز على المصادر الرسمية والأمان."
            : "News and guides explaining how fintech is changing payments, banking, and access to money, with an emphasis on official sources and security."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/${safeLocale}/cards-atms`} className="rounded-md bg-white px-4 py-2 text-sm font-bold text-[#0A2342] transition hover:bg-cyan-50">{isArabic ? "البطاقات والصرافات" : "Cards & ATMs"}</Link>
          <Link href={`/${safeLocale}/money-transfers`} className="rounded-md border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">{isArabic ? "التحويلات المالية" : "Money transfers"}</Link>
        </div>
      </header>

      <section aria-labelledby="fintech-topics">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#005F73]">{isArabic ? "افهم القطاع" : "Understand the sector"}</p>
        <h2 id="fintech-topics" className="mt-1 text-2xl font-black text-[var(--foreground)]">{isArabic ? "موضوعات التقنية المالية" : "Fintech topics"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <article key={topic.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)] transition hover:-translate-y-0.5 hover:border-[#005F73]/50">
              <span aria-hidden="true" className="text-2xl">{topic.icon}</span>
              <h3 className="mt-3 text-lg font-black text-[var(--foreground)]">{topic.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{topic.text}</p>
            </article>
          ))}
        </div>
      </section>

      {articles.length ? (
        <section aria-labelledby="fintech-news">
          <h2 id="fintech-news" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "أحدث أخبار الفنتك" : "Latest fintech coverage"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <article key={article.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <h3 className="text-lg font-black text-[var(--foreground)]"><Link href={`/${safeLocale}/news/${article.slug}`} className="hover:text-[#005F73]">{article.title}</Link></h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-[#005F73]/35 bg-[#005F73]/5 p-6 text-center">
          <h2 className="text-lg font-black text-[var(--foreground)]">{isArabic ? "نعمل على توسيع تغطية التقنية المالية" : "We are expanding our fintech coverage"}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{isArabic ? "ستظهر هنا الأخبار والتقارير المنشورة بعد تصنيفها ومراجعة مصادرها." : "Published news and reports will appear here after categorization and source review."}</p>
        </section>
      )}

      {products.length ? (
        <section aria-labelledby="digital-products">
          <h2 id="digital-products" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "خدمات رقمية من البنوك" : "Digital services from banks"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <article key={product.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#005F73]">{product.bankName}</p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]"><Link href={`/${safeLocale}/products/${product.slug}`}>{product.name}</Link></h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{product.shortDescription}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <aside className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="font-black">{isArabic ? "أمانك الرقمي" : "Your digital safety"}</h2>
        <p className="mt-1">{isArabic ? "نزّل التطبيقات من الروابط الرسمية فقط، ولا تشارك كلمة المرور أو الرقم السري أو رمز التحقق لمرة واحدة، وتحقق من عنوان الموقع قبل تسجيل الدخول." : "Download apps only from official links, never share passwords, PINs, or one-time codes, and verify the website address before signing in."}</p>
      </aside>
    </div>
  );
}
