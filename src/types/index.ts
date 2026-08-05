import type { Locale } from "@/lib/i18n/config";

export type PublishStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "archived";

export type ArticleType =
  | "news"
  | "breaking_news"
  | "product_announcement"
  | "bank_update"
  | "central_bank_announcement"
  | "guide"
  | "analysis"
  | "report"
  | "interview"
  | "opinion"
  | "press_release"
  | "sponsored_content"
  | "job_listing"
  | "security_alert";

export interface Article {
  id: number;
  slug: string;
  status: PublishStatus;
  articleType: ArticleType;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  isBreaking: boolean;
  isSponsored: boolean;
  isOpinion: boolean;
  isPressRelease: boolean;
}

export interface ArticleTranslation {
  articleId: number;
  locale: Locale;
  title: string;
  summary: string;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ArticleCard {
  id: number;
  slug: string;
  locale: Locale;
  title: string;
  summary: string;
  categoryName: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number;
  isBreaking: boolean;
  isSponsored: boolean;
}

export interface BankCard {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  logoUrl: string | null;
}

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  bankName: string;
  category: string;
  shortDescription: string;
}

export interface ExchangeRateRow {
  id: number;
  currencyName: string;
  currencyCode: string;
  officialBuy: number | null;
  officialSell: number | null;
  parallelBuy: number | null;
  parallelSell: number | null;
  rateDate: string;
  source: string;
  notes: string | null;
}

export interface JobCard {
  id: number;
  slug: string;
  title: string;
  organization: string;
  location: string;
  employmentType: string;
  applicationDeadline: string;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "super_admin" | "administrator" | "editor" | "author" | "contributor";
}
