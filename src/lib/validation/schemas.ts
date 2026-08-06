import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const articleCreateSchema = z.object({
  locale: z.enum(["ar", "en"]),
  title: z.string().min(5).max(255),
  summary: z.string().min(20).max(1000),
  contentHtml: z.string().min(50),
  articleType: z.string().min(2),
  status: z.enum(["draft", "review", "scheduled", "published", "archived"]).default("draft"),
  featuredImageUrl: z.url().optional().nullable(),
  sourceUrl: z.url().optional().nullable(),
  sourceAttribution: z.string().max(255).optional().nullable(),
  relatedBankId: z.number().int().positive().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  publishAt: z.iso.datetime().optional().nullable(),
  expiresAt: z.iso.datetime().optional().nullable(),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  isOpinion: z.boolean().default(false),
  isPressRelease: z.boolean().default(false),
});

export const categorySchema = z.object({
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(180),
  description: z.string().max(600).optional(),
  locale: z.enum(["ar", "en"]),
});

export const tagSchema = z.object({
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(180),
  locale: z.enum(["ar", "en"]),
});

export const bankSchema = z.object({
  slug: z.string().min(2).max(120),
  name: z.string().min(2).max(180),
  shortDescription: z.string().min(10).max(800),
  officialWebsite: z.url().optional().nullable(),
  headquarters: z.string().max(255).optional().nullable(),
  swiftCode: z.string().max(40).optional().nullable(),
  showOnWebsite: z.boolean().default(true),
});

export const productSchema = z.object({
  slug: z.string().min(2).max(120),
  bankId: z.number().int().positive(),
  category: z.string().min(2).max(120),
  name: z.string().min(2).max(180),
  description: z.string().min(20).max(3000),
  officialSourceUrl: z.url().optional().nullable(),
});

export const exchangeRateSchema = z.object({
  currencyName: z.string().min(2).max(120),
  currencyCode: z.string().length(3).toUpperCase(),
  officialBuy: z.number().positive().nullable().optional(),
  officialSell: z.number().positive().nullable().optional(),
  parallelBuy: z.number().positive().nullable().optional(),
  parallelSell: z.number().positive().nullable().optional(),
  rateDate: z.iso.date(),
  source: z.string().min(2).max(255),
  notes: z.string().max(1000).optional().nullable(),
});

export const rateSourceAdminSchema = z.object({
  trustTier: z.enum(["high", "medium", "low", "unverified"]),
  trustScore: z.number().int().min(0).max(100),
  lastVerifiedAt: z.iso.date().optional().nullable(),
  isActive: z.boolean(),
});

export const jobSchema = z.object({
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(255),
  organization: z.string().min(2).max(255),
  location: z.string().min(2).max(180),
  employmentType: z.string().min(2).max(120),
  applicationDeadline: z.iso.date(),
  description: z.string().min(20),
  officialApplicationUrl: z.url(),
});

export const newsletterSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.email(),
  preferredLanguage: z.enum(["ar", "en"]),
  consent: z.literal(true),
});

export const contactSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().max(40).optional(),
  subject: z.string().min(3).max(180),
  message: z.string().min(10).max(5000),
  consent: z.literal(true),
});

export const commentSchema = z.object({
  articleId: z.number().int().positive(),
  name: z.string().min(2).max(120),
  email: z.email(),
  comment: z.string().min(2).max(2000),
});
