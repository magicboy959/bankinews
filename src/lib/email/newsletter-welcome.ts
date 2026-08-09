import type { Locale } from "@/lib/i18n/config";
import { appendUnsubscribeFooter } from "@/lib/newsletter-unsubscribe";

export function getNewsletterWelcomeMessage(locale: Locale, siteUrl: string) {
  const normalizedUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

  const subject =
    locale === "ar"
      ? "مرحبا بكم في بنكي أخبار السودان"
      : "Welcome to Banki News";

  const htmlAr = `
  <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height:1.8; color:#0f172a;">
    <h2 style="margin:0 0 12px;">مرحبًا بكم في بنكي أخبار السودان</h2>
    <p>يسعدنا انضمامكم إلى <strong>بنكي أخبار السودان</strong>، منصتكم المتخصصة في متابعة آخر أخبار القطاع المصرفي والمالي في السودان.</p>
    <p>من خلال نشرتنا البريدية ستصلكم:</p>
    <ul>
      <li>📰 آخر الأخبار المصرفية الموثوقة</li>
      <li>🏦 أخبار البنوك السودانية</li>
      <li>💳 المنتجات والخدمات المصرفية الجديدة</li>
      <li>📱 تحديثات الخدمات الرقمية وتطبيقات البنوك</li>
      <li>📈 التحليلات والتقارير الاقتصادية</li>
      <li>🔒 تنبيهات الأمن السيبراني والاحتيال المالي</li>
      <li>📚 أدلة ومقالات توعوية تساعدكم على اتخاذ قرارات مالية أفضل</li>
    </ul>
    <p>نلتزم بنشر معلومات دقيقة وموثقة من المصادر الرسمية، مع تحديثات مستمرة لتبقى على اطلاع بكل جديد.</p>
    <p><strong>تابعونا يوميًا وكونوا أول من يعرف أحدث مستجدات القطاع المصرفي في السودان.</strong></p>
    <p><a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">زيارة الموقع</a></p>
    <p>مع خالص التحية،<br /><strong>فريق بنكي أخبار السودان</strong></p>
  </div>`;

  const htmlEn = `
  <div dir="ltr" style="font-family: Arial, sans-serif; line-height:1.8; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Welcome to Banki News</h2>
    <p>Thank you for joining <strong>Banki News</strong>, your trusted source for banking and financial news from Sudan.</p>
    <p>As a subscriber, you'll receive:</p>
    <ul>
      <li>📰 Verified banking news</li>
      <li>🏦 Updates from Sudanese banks</li>
      <li>💳 New banking products and services</li>
      <li>📱 Digital banking and mobile app updates</li>
      <li>📈 Financial insights and market trends</li>
      <li>🔒 Fraud prevention and cybersecurity alerts</li>
      <li>📚 Practical banking guides and educational articles</li>
    </ul>
    <p>Our editorial team is committed to providing accurate, timely, and well-sourced information from official and trusted sources.</p>
    <p>Stay informed with the latest developments in Sudan's banking sector.</p>
    <p><a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">Visit our website</a></p>
    <p>Best regards,<br /><strong>The Banki News Team</strong></p>
  </div>`;

  const textAr = [
    "مرحبًا بكم في بنكي أخبار السودان",
    "",
    "يسعدنا انضمامكم إلى بنكي أخبار السودان، منصتكم المتخصصة في متابعة آخر أخبار القطاع المصرفي والمالي في السودان.",
    "",
    "من خلال نشرتنا البريدية ستصلكم:",
    "- 📰 آخر الأخبار المصرفية الموثوقة",
    "- 🏦 أخبار البنوك السودانية",
    "- 💳 المنتجات والخدمات المصرفية الجديدة",
    "- 📱 تحديثات الخدمات الرقمية وتطبيقات البنوك",
    "- 📈 التحليلات والتقارير الاقتصادية",
    "- 🔒 تنبيهات الأمن السيبراني والاحتيال المالي",
    "- 📚 أدلة ومقالات توعوية تساعدكم على اتخاذ قرارات مالية أفضل",
    "",
    "نلتزم بنشر معلومات دقيقة وموثقة من المصادر الرسمية، مع تحديثات مستمرة لتبقى على اطلاع بكل جديد.",
    "",
    "تابعونا يوميًا وكونوا أول من يعرف أحدث مستجدات القطاع المصرفي في السودان.",
    "",
    "زيارة الموقع:",
    normalizedUrl,
    "",
    "مع خالص التحية،",
    "فريق بنكي أخبار السودان",
  ].join("\n");

  const textEn = [
    "Welcome to Banki News",
    "",
    "Thank you for joining Banki News, your trusted source for banking and financial news from Sudan.",
    "",
    "As a subscriber, you'll receive:",
    "- 📰 Verified banking news",
    "- 🏦 Updates from Sudanese banks",
    "- 💳 New banking products and services",
    "- 📱 Digital banking and mobile app updates",
    "- 📈 Financial insights and market trends",
    "- 🔒 Fraud prevention and cybersecurity alerts",
    "- 📚 Practical banking guides and educational articles",
    "",
    "Our editorial team is committed to providing accurate, timely, and well-sourced information from official and trusted sources.",
    "",
    "Stay informed with the latest developments in Sudan's banking sector.",
    "",
    "Visit our website:",
    normalizedUrl,
    "",
    "Best regards,",
    "",
    "The Banki News Team",
  ].join("\n");

  if (locale === "ar") {
    return {
      subject,
      html: htmlAr,
      text: textAr,
    };
  }

  return {
    subject,
    html: htmlEn,
    text: textEn,
  };
}

export function getNewsletterWelcomeMessageWithUnsubscribe(
  locale: Locale,
  siteUrl: string,
  subscriber: { id: number; email: string; preferredLanguage: Locale }
) {
  const base = getNewsletterWelcomeMessage(locale, siteUrl);
  const footer = appendUnsubscribeFooter(base.html, base.text, subscriber);

  return {
    subject: base.subject,
    html: footer.html,
    text: footer.text,
    unsubscribeUrl: footer.unsubscribeUrl,
  };
}
