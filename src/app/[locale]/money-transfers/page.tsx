import type { Metadata } from "next";
import Link from "next/link";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";

type ProductRow = DbRow & {
  slug: string;
  category: string;
  bankName: string;
  name: string;
  shortDescription: string;
};

type ArticleRow = DbRow & {
  slug: string;
  title: string;
  summary: string;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  return buildMetadata({
    locale: safeLocale,
    title: safeLocale === "ar" ? "التحويلات والحوالات المالية" : "Money Transfers & Remittances",
    description:
      safeLocale === "ar"
        ? "دليل التحويلات المالية في السودان: التحويل المحلي والدولي، الرسوم، أسعار الصرف، البيانات المطلوبة، والأمان."
        : "A guide to money transfers in Sudan: local and international transfers, fees, exchange rates, required details, and security.",
    path: `/${safeLocale}/money-transfers`,
  });
}

export default async function MoneyTransfersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";
  const isArabic = safeLocale === "ar";

  let products: ProductRow[] = [];
  let articles: ArticleRow[] = [];
  try {
    [products, articles] = await Promise.all([
      dbQuery<ProductRow[]>(
        `SELECT p.slug, p.product_category AS category, bt.name AS bankName,
                pt.name, pt.short_description AS shortDescription
         FROM products p
         JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
         JOIN banks b ON b.id = p.bank_id
         JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
         WHERE p.deleted_at IS NULL
           AND p.slug NOT LIKE 'demo-%'
           AND (
             LOWER(p.product_category) LIKE '%transfer%'
             OR LOWER(p.product_category) LIKE '%remittance%'
             OR pt.name LIKE '%تحويل%'
             OR pt.name LIKE '%حوال%'
             OR LOWER(pt.name) LIKE '%transfer%'
             OR LOWER(pt.name) LIKE '%remittance%'
           )
         ORDER BY p.updated_at DESC
         LIMIT 12`,
        [safeLocale, safeLocale]
      ),
      dbQuery<ArticleRow[]>(
        `SELECT a.slug, at.title, at.summary
         FROM articles a
         JOIN article_translations at ON at.article_id = a.id AND at.locale = ?
         WHERE a.status = 'published'
           AND a.deleted_at IS NULL
           AND (
             at.title LIKE '%تحويل%'
             OR at.title LIKE '%حوال%'
             OR LOWER(at.title) LIKE '%transfer%'
             OR LOWER(at.title) LIKE '%remittance%'
             OR at.summary LIKE '%تحويل%'
             OR at.summary LIKE '%حوال%'
           )
         ORDER BY a.published_at DESC
         LIMIT 6`,
        [safeLocale]
      ),
    ]);
  } catch {
    products = [];
    articles = [];
  }

  const guideItems = isArabic
    ? [
        { icon: "🏦", title: "التحويل بين الحسابات", text: "تحقق من اسم المستفيد ورقم الحساب أو المعرف المطلوب والحد اليومي ورسوم التحويل قبل التأكيد." },
        { icon: "🌍", title: "الحوالات الدولية", text: "قارن الرسوم وسعر الصرف والبنوك الوسيطة والمدة المتوقعة، وتأكد من الدول والعملات المدعومة رسمياً." },
        { icon: "💱", title: "سعر الصرف والتكلفة", text: "لا تقارن الرسم وحده؛ احسب المبلغ النهائي الذي سيصل للمستفيد بعد سعر الصرف وجميع الخصومات." },
        { icon: "🧾", title: "بيانات المستفيد", text: "راجع الاسم كما يظهر في الهوية أو الحساب، ورقم الحساب أو IBAN وSWIFT عند طلبهما، والغرض من التحويل." },
        { icon: "⏱️", title: "المدة وتتبع الحوالة", text: "احتفظ بالرقم المرجعي والإيصال، واسأل عن أيام العمل ومواعيد القطع وأسباب التأخير المحتملة." },
        { icon: "🔐", title: "الحماية من الاحتيال", text: "لا ترسل المال بطلب من جهة مجهولة، ولا تشارك كلمة المرور أو رمز التحقق، واستخدم قنوات البنك الرسمية فقط." },
      ]
    : [
        { icon: "🏦", title: "Account-to-account transfers", text: "Verify the beneficiary name, account number or required identifier, daily limit, and transfer fee before confirming." },
        { icon: "🌍", title: "International remittances", text: "Compare fees, exchange rates, intermediary banks, expected timing, and officially supported countries and currencies." },
        { icon: "💱", title: "Exchange rate and total cost", text: "Do not compare the fee alone; calculate the final amount the recipient gets after conversion and all deductions." },
        { icon: "🧾", title: "Beneficiary details", text: "Check the name against the identity document or account and confirm the account, IBAN, SWIFT, and transfer purpose where required." },
        { icon: "⏱️", title: "Timing and tracking", text: "Keep the reference number and receipt, and confirm business days, cutoff times, and possible reasons for delay." },
        { icon: "🔐", title: "Fraud prevention", text: "Do not transfer money at an unknown party’s request, never share passwords or verification codes, and use official bank channels only." },
      ];

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-[#005F73]/20 bg-gradient-to-br from-[#0A2342] to-[#005F73] p-6 text-white md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Banki News Guide</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{isArabic ? "التحويلات المالية" : "Money Transfers"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          {isArabic
            ? "دليل عملي للتحويلات المحلية والدولية يساعدك على مراجعة البيانات والرسوم وسعر الصرف والمدة والأمان قبل إرسال الأموال."
            : "A practical guide to local and international transfers, covering recipient details, fees, exchange rates, timing, and security."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/${safeLocale}/products`} className="rounded-md bg-white px-4 py-2 text-sm font-bold text-[#0A2342] transition hover:bg-cyan-50">
            {isArabic ? "كل المنتجات المصرفية" : "All banking products"}
          </Link>
          <Link href={`/${safeLocale}/exchange-rates`} className="rounded-md border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
            {isArabic ? "أسعار الصرف" : "Exchange rates"}
          </Link>
        </div>
      </header>

      <section aria-labelledby="transfer-guide">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#005F73]">{isArabic ? "قبل إرسال الأموال" : "Before sending money"}</p>
        <h2 id="transfer-guide" className="mt-1 text-2xl font-black text-[var(--foreground)]">{isArabic ? "دليل التحويلات والحوالات" : "Transfer and remittance essentials"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guideItems.map((item) => (
            <article key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)] transition hover:-translate-y-0.5 hover:border-[#005F73]/50">
              <span aria-hidden="true" className="text-2xl">{item.icon}</span>
              <h3 className="mt-3 text-lg font-black text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {products.length ? (
        <section aria-labelledby="transfer-products">
          <h2 id="transfer-products" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "خدمات التحويل من البنوك" : "Bank transfer services"}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{isArabic ? "تحقق من المصدر الرسمي للبنك للتأكد من الرسوم والعملات والدول والحدود الحالية." : "Verify current fees, currencies, countries, and limits with the bank’s official source."}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <article key={product.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#005F73]">{product.bankName} • {product.category}</p>
                <h3 className="mt-2 text-xl font-black text-[var(--foreground)]">
                  <Link href={`/${safeLocale}/products/${product.slug}`} className="hover:text-[#005F73]">{product.name}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{product.shortDescription}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {articles.length ? (
        <section aria-labelledby="transfer-news">
          <h2 id="transfer-news" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "آخر أخبار التحويلات" : "Latest transfer coverage"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <article key={article.slug} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <h3 className="text-lg font-black text-[var(--foreground)]">
                  <Link href={`/${safeLocale}/news/${article.slug}`} className="hover:text-[#005F73]">{article.title}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{article.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <aside className="rounded-xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="font-black">{isArabic ? "تنبيه مهم" : "Important reminder"}</h2>
        <p className="mt-1">
          {isArabic
            ? "لا تعتمد على رسالة أو رقم هاتف غير موثق عند إرسال الأموال. أكد بيانات المستفيد عبر قناة مستقلة، ولا تشارك رمز التحقق لمرة واحدة مع أي شخص."
            : "Do not rely on an unverified message or phone number when sending money. Confirm beneficiary details through an independent channel and never share a one-time verification code."}
        </p>
      </aside>
    </div>
  );
}
