# BankiNews Sudan

Production-oriented bilingual (Arabic/English) banking and fintech news platform for Sudan, built with Next.js App Router, TypeScript, Tailwind CSS, and direct MySQL access.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- MySQL (external server) + mysql2 (no Prisma)
- Route Handlers for API
- Secure custom JWT session cookies (HTTP-only)
- Zod request validation
- Cloudinary-ready media metadata flow
- GA4 + Microsoft Clarity integration hooks

## Key Features Implemented

- URL locale routing: /ar and /en
- Arabic default routing and RTL/LTR layout handling
- Banking news homepage with structured sections
- News listing and article pages
- Banks and products profile pages
- Exchange-rates section with informational disclaimer
- Secure admin area at /admin with login and role guard
- Core API endpoints for auth, articles, categories, tags, banks, products, jobs, rates, comments, newsletter, contact, search, homepage, media, analytics, admin users
- SQL migration with required core tables and relations
- Seed script for demonstration bilingual content
- Sitemap, news sitemap, RSS, robots

## Project Structure

- src/app/[locale]
- src/app/admin
- src/app/api
- src/components
- src/lib/auth
- src/lib/db
- src/lib/i18n
- src/lib/seo
- src/lib/validation
- src/services
- src/types
- sql
- scripts

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Configure external MySQL credentials in .env.

4. Run migration:

```bash
npm run db:migrate
```

The migrator now tracks applied SQL files in a `schema_migrations` table and only applies new files once. On an existing database that predates migration tracking, the first run records a baseline instead of replaying all historical SQL files.

5. Seed demonstration data:

```bash
npm run db:seed
```

6. Start dev server:

```bash
npm run dev
```

7. Open:

- Arabic: http://localhost:3000/ar
- English: http://localhost:3000/en
- Admin: http://localhost:3000/admin/login

## Demo Admin Account

- Email: admin@bankinews.demo
- Password: value of SEED_ADMIN_PASSWORD (default ChangeMe123!)

Change credentials immediately in production.

## Build and Production

```bash
npm run build
npm run start
```

## Deployment on Vercel

- Deploy Next.js app to Vercel.
- Keep MySQL on external managed host.
- Ensure external DB allows remote connections from deployment region.
- Prefer SSL DB connections (DB_SSL=true where supported).
- Use a dedicated limited-privilege DB user.
- Configure all secrets in Vercel Environment Variables.

### Production release checklist

1. Rotate any credential that has appeared in logs, chat, screenshots, or source history.
2. Set `NEXT_PUBLIC_APP_URL=https://www.bankinews.com` for Production before building.
3. Set unique secrets of at least 32 characters for `AUTH_SECRET` and `CRON_SECRET`.
4. Configure the database variables and run `npm run db:migrate` against the production database.
5. Configure only the publishing integrations that are ready; keep all access tokens server-only and never prefix them with `NEXT_PUBLIC_`.
6. Run `npm run check:release` with the production environment loaded.
7. Deploy, then smoke-test `/ar`, `/ar/news`, `/ar/products`, `/ar/fintech`, `/robots.txt`, `/sitemap.xml`, Admin login, newsletter signup, and read-only social connection checks.

Vercel Cron authenticates `/api/cron/marketing-campaigns/send-due` with `Authorization: Bearer $CRON_SECRET`. Never place the cron secret in `vercel.json` or a query string.

## External MySQL Notes

- Use pooled connections.
- Keep connection limits conservative for serverless workloads.
- Add DB indexes for query-heavy fields (included in schema).
- Run periodic backups and point-in-time recovery where available.

## Security Notes

- Password hashing with bcrypt
- HTTP-only session cookie
- Zod validation on request payloads
- Parameterized SQL queries (no raw interpolation for user values)
- Role-based authorization checks in admin APIs
- Security headers configured in next.config.ts

## Editorial and Compliance Notes

- Demonstration content is clearly labeled and non-official.
- Exchange-rate seed entries are demonstration-only and not live rates.
- Do not request or collect passwords, OTPs, PINs, CVV, or full card data.
- Product pages must direct users to verified official bank websites for applications.

## Cloudinary Integration

The platform stores media metadata in MySQL and is ready for Cloudinary credential wiring through environment variables.

## Analytics

- Set NEXT_PUBLIC_GA4_ID for Google Analytics 4
- Set NEXT_PUBLIC_CLARITY_ID for Microsoft Clarity

## AI Writing Helper

- Set GOOGLE_AI_API_KEY to enable Google AI article editing and Image Studio photo generation/editing
- Optionally set GOOGLE_AI_TEXT_MODEL and GOOGLE_AI_IMAGE_MODEL to override the default Gemini models

## Publish Everywhere

The Admin **Publish Everywhere** screen can publish an article to the website, Facebook Page, Instagram professional account, X, Telegram channel, and LinkedIn organization from one reviewed preview. Configure the platform credentials documented in `.env.example`.

Facebook uses `META_PAGE_ID` and `META_PAGE_ACCESS_TOKEN`. Instagram is configured independently with `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN`; never expose either access token through a `NEXT_PUBLIC_*` variable.

WhatsApp Channel updates use a manual copy/open handoff because Meta's official WhatsApp Business API does not provide an endpoint for publishing WhatsApp Channel updates. Unofficial WhatsApp Web automation is intentionally not used.

## Recommended Next Enhancements

- Add full TipTap admin editor UX
- Add moderation UI for comments and workflows
- Add ad impression/click tracking UI
- Add full multi-language content editing per entity
- Add automated tests and CI pipeline
