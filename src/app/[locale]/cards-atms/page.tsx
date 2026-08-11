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
    title: safeLocale === "ar" ? "البطاقات المصرفية وأجهزة الصراف الآلي" : "Bank Cards & ATMs",
    description:
      safeLocale === "ar"
        ? "دليل بنكي نيوز للبطاقات المصرفية وأجهزة الصراف الآلي: الأنواع والرسوم والحدود والأمان والتصرف عند فقدان البطاقة."
        : "Banki News guide to bank cards and ATMs: card types, fees, limits, security, and what to do if a card is lost.",
    path: `/${safeLocale}/cards-atms`,
  });
}

export default async function CardsAtmsPage({ params }: { params: Promise<{ locale: string }> }) {
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
             LOWER(p.product_category) LIKE '%card%'
             OR LOWER(p.product_category) LIKE '%atm%'
             OR pt.name LIKE '%بطاق%'
             OR pt.name LIKE '%صراف%'
             OR LOWER(pt.name) LIKE '%card%'
             OR LOWER(pt.name) LIKE '%atm%'
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
             at.title LIKE '%بطاق%'
             OR at.title LIKE '%صراف%'
             OR LOWER(at.title) LIKE '%card%'
             OR LOWER(at.title) LIKE '%atm%'
             OR at.summary LIKE '%بطاق%'
             OR at.summary LIKE '%صراف%'
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
        { icon: "💳", title: "بطاقات الخصم المباشر", text: "تُخصم العملية مباشرة من رصيد الحساب. تحقق من رسوم الإصدار والتجديد والسحب والشراء قبل الطلب.", href: "#compare" },
        { icon: "🔐", title: "الاستخدام الآمن للبطاقة", text: "لا تشارك الرقم السري أو رمز التحقق، ولا تسمح لأي شخص بتصوير البطاقة، وفعّل إشعارات العمليات إن كانت متاحة.", href: "#safety" },
        { icon: "🏧", title: "السحب من الصراف الآلي", text: "راجع الحد اليومي ورسوم السحب من أجهزة البنوك الأخرى، وافحص الجهاز وأخفِ لوحة الأرقام عند إدخال الرقم السري.", href: "#atm" },
        { icon: "📱", title: "البطاقات والشراء الإلكتروني", text: "تحقق من تفعيل الشراء عبر الإنترنت والحدود والعملات المدعومة، واستخدم المواقع الموثوقة فقط.", href: "#online" },
        { icon: "🚨", title: "فقدان البطاقة أو احتجازها", text: "أوقف البطاقة فوراً عبر القناة الرسمية للبنك، ثم تواصل مع البنك أو الفرع المسؤول عن جهاز الصراف.", href: "#lost" },
        { icon: "📋", title: "قارن الرسوم والحدود", text: "قارن رسوم الإصدار والتجديد والاستبدال والسحب وحدود الاستخدام، وارجع دائماً إلى جدول رسوم البنك الرسمي.", href: "#compare" },
      ]
    : [
        { icon: "💳", title: "Debit cards", text: "Transactions are deducted directly from the account balance. Check issuance, renewal, withdrawal, and purchase fees before applying.", href: "#compare" },
        { icon: "🔐", title: "Card security", text: "Never share a PIN or verification code, do not let anyone photograph the card, and enable transaction alerts where available.", href: "#safety" },
        { icon: "🏧", title: "ATM withdrawals", text: "Review daily limits and other-bank ATM fees. Inspect the machine and cover the keypad when entering your PIN.", href: "#atm" },
        { icon: "📱", title: "Online purchases", text: "Confirm online-payment activation, limits, and supported currencies, and transact only on trusted websites.", href: "#online" },
        { icon: "🚨", title: "Lost or retained cards", text: "Block the card immediately through an official bank channel, then contact the bank or the branch responsible for the ATM.", href: "#lost" },
        { icon: "📋", title: "Compare fees and limits", text: "Compare issuance, renewal, replacement, and withdrawal fees and usage limits against the bank’s official tariff.", href: "#compare" },
      ];

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-[#005F73]/20 bg-gradient-to-br from-[#0A2342] to-[#005F73] p-6 text-white md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Banki News Guide</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{isArabic ? "البطاقات والصرافات" : "Cards & ATMs"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          {isArabic
            ? "دليل عملي لفهم أنواع البطاقات والرسوم والحدود، واستخدام أجهزة الصراف بأمان، والوصول إلى المنتجات المعلنة من البنوك السودانية."
            : "A practical guide to card types, fees, limits, safe ATM use, and card products published by Sudanese banks."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/${safeLocale}/products`} className="rounded-md bg-white px-4 py-2 text-sm font-bold text-[#0A2342] transition hover:bg-cyan-50">
            {isArabic ? "كل المنتجات المصرفية" : "All banking products"}
          </Link>
          <Link href={`/${safeLocale}/banks`} className="rounded-md border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
            {isArabic ? "دليل البنوك" : "Bank directory"}
          </Link>
        </div>
      </header>

      <section aria-labelledby="cards-atms-basics">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#005F73]">{isArabic ? "ابدأ من هنا" : "Start here"}</p>
            <h2 id="cards-atms-basics" className="mt-1 text-2xl font-black text-[var(--foreground)]">{isArabic ? "دليل البطاقات والصرافات" : "Cards and ATM essentials"}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guideItems.map((item, index) => (
            <article key={item.title} id={`card-guide-${index + 1}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)] transition hover:-translate-y-0.5 hover:border-[#005F73]/50">
              <span aria-hidden="true" className="text-2xl">{item.icon}</span>
              <h3 className="mt-3 text-lg font-black text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {products.length ? (
        <section aria-labelledby="card-products">
          <h2 id="card-products" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "منتجات البطاقات من البنوك" : "Card products from banks"}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{isArabic ? "راجع صفحة المنتج والمصدر الرسمي للبنك للتأكد من الرسوم والحدود الحالية." : "Check the product page and official bank source for current fees and limits."}</p>
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
        <section aria-labelledby="card-news">
          <h2 id="card-news" className="text-2xl font-black text-[var(--foreground)]">{isArabic ? "آخر أخبار البطاقات والصرافات" : "Latest cards and ATM coverage"}</h2>
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
        <h2 className="font-black">{isArabic ? "تنبيه أمني" : "Security reminder"}</h2>
        <p className="mt-1">
          {isArabic
            ? "لن تطلب منك بنكي نيوز أو أي بنك موثوق مشاركة الرقم السري للبطاقة أو رمز التحقق لمرة واحدة. استخدم أرقام وقنوات البنك الرسمية عند الإبلاغ عن مشكلة."
            : "Banki News and legitimate banks will never ask you to share a card PIN or one-time verification code. Use official bank numbers and channels when reporting a problem."}
        </p>
      </aside>
    </div>
  );
}
