import type { Locale } from "@/lib/i18n/config";

type Dictionary = {
  siteName: string;
  nav: Record<string, string>;
  labels: {
    latest: string;
    breaking: string;
    mostRead: string;
    editorsPicks: string;
    featuredBank: string;
    newsletter: string;
    searchPlaceholder: string;
    readMore: string;
    informationalRates: string;
    sponsored: string;
    opinion: string;
    pressRelease: string;
  };
};

export const dictionary: Record<Locale, Dictionary> = {
  ar: {
    siteName: "بنكي نيوز السودان",
    nav: {
      home: "الرئيسية",
      latest: "آخر الأخبار",
      banks: "البنوك",
      centralBank: "البنك المركزي",
      digitalBanking: "الخدمات الرقمية",
      fintech: "فنتك",
      products: "المنتجات والخدمات",
      transfers: "التحويلات المالية",
      cards: "البطاقات والصرافات",
      rates: "أسعار الصرف",
      economy: "الاقتصاد",
      guides: "الأدلة",
      reports: "التقارير",
      interviews: "المقابلات",
      opinion: "الرأي",
      jobs: "وظائف بنكية",
      about: "من نحن",
      contact: "اتصل بنا",
    },
    labels: {
      latest: "أحدث الأخبار",
      breaking: "عاجل",
      mostRead: "الأكثر قراءة",
      editorsPicks: "اختيارات التحرير",
      featuredBank: "بنك مميز",
      newsletter: "النشرة البريدية",
      searchPlaceholder: "ابحث في الأخبار والبنوك والمنتجات...",
      readMore: "اقرأ المزيد",
      informationalRates: "الأسعار لأغراض معلوماتية فقط وقد تتغير.",
      sponsored: "محتوى برعاية",
      opinion: "مقال رأي",
      pressRelease: "بيان صحفي",
    },
  },
  en: {
    siteName: "BankiNews Sudan",
    nav: {
      home: "Home",
      latest: "Latest News",
      banks: "Banks",
      centralBank: "Central Bank",
      digitalBanking: "Digital Banking",
      fintech: "Fintech",
      products: "Products & Services",
      transfers: "Money Transfers",
      cards: "Cards & ATMs",
      rates: "Exchange Rates",
      economy: "Economy",
      guides: "Guides",
      reports: "Reports",
      interviews: "Interviews",
      opinion: "Opinion",
      jobs: "Banking Jobs",
      about: "About",
      contact: "Contact",
    },
    labels: {
      latest: "Latest News",
      breaking: "Breaking",
      mostRead: "Most Read",
      editorsPicks: "Editor's Picks",
      featuredBank: "Featured Bank",
      newsletter: "Newsletter",
      searchPlaceholder: "Search articles, banks, products...",
      readMore: "Read more",
      informationalRates: "Rates are for informational purposes only and may change.",
      sponsored: "Sponsored",
      opinion: "Opinion",
      pressRelease: "Press Release",
    },
  },
};
