import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

const categories = [
  ["news", "أخبار", "News"],
  ["digital-banking", "الخدمات الرقمية", "Digital Banking"],
  ["guides", "الأدلة", "Guides"],
  ["exchange-rates", "أسعار الصرف", "Exchange Rates"],
  ["economy", "الاقتصاد", "Economy"],
  ["jobs", "وظائف", "Jobs"],
  ["security-alerts", "تنبيهات أمنية", "Security Alerts"],
];

const banks = [
  ["bank-of-khartoum", "بنك الخرطوم", "Bank of Khartoum"],
  ["faisal-islamic-bank", "بنك فيصل الإسلامي", "Faisal Islamic Bank"],
  ["omdurman-national-bank", "بنك أم درمان الوطني", "Omdurman National Bank"],
  ["al-salam-bank", "بنك السلام", "Al Salam Bank"],
  ["bank-of-sudan-demo", "البنك السوداني التجريبي", "Sudan Demo Bank"],
];

const products = [
  "Current Account",
  "Savings Account",
  "Business Account",
  "Youth Account",
  "Women Account",
  "Debit Card",
  "Mobile Banking",
  "International Transfer",
];

const jobTitles = [
  "Compliance Officer",
  "Digital Payments Specialist",
  "Cybersecurity Analyst",
  "Retail Banking Manager",
  "Fintech Product Owner",
];

const guideTitles = [
  "How to Open a Bank Account",
  "Safe Mobile Banking Practices",
  "How SWIFT Transfers Work",
  "Understanding IBAN",
  "Protecting Accounts From Fraud",
];

const digitalTitles = [
  "Demo: Wallet upgrade launched by local bank",
  "Demo: New QR payment rollout",
  "Demo: Banking API gateway initiative",
  "Demo: Branchless onboarding pilot",
  "Demo: Fintech partnership on remittances",
];

const securityAlerts = [
  "Demo Alert: Fake banking support pages detected",
  "Demo Alert: Phishing SMS campaign reported",
  "Demo Alert: Fraudulent mobile app warning",
  "Demo Alert: OTP theft attempts on social media",
  "Demo Alert: Card fraud awareness bulletin",
];

const newsTitles = [
  "Demo: Central bank publishes updated circular",
  "Demo: Bank launches SME financing program",
  "Demo: Expansion of ATM network in Khartoum",
  "Demo: New digital KYC process announced",
  "Demo: Islamic finance product update",
  "Demo: Interbank transfer latency reduced",
  "Demo: Financial inclusion campaign begins",
  "Demo: Branch modernization program",
  "Demo: Payments interoperability roadmap",
  "Demo: Currency market policy briefing",
];

const exchangeRates = [
  ["US Dollar", "USD"],
  ["Euro", "EUR"],
  ["Saudi Riyal", "SAR"],
  ["UAE Dirham", "AED"],
  ["Egyptian Pound", "EGP"],
  ["British Pound", "GBP"],
  ["Qatari Riyal", "QAR"],
  ["Bahraini Dinar", "BHD"],
  ["Kuwaiti Dinar", "KWD"],
  ["Turkish Lira", "TRY"],
];

try {
  await connection.beginTransaction();

  const adminPasswordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", 12);

  await connection.execute(
    `INSERT INTO users (email, display_name, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 'super_admin', 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), password_hash = VALUES(password_hash), updated_at = NOW()`,
    ["admin@bankinews.demo", "Demo Super Admin", adminPasswordHash]
  );

  const [users] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", ["admin@bankinews.demo"]);
  const adminUserId = users[0].id;

  await connection.execute(
    `INSERT INTO authors (user_id, display_name, bio, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), bio = VALUES(bio), updated_at = NOW()`,
    [adminUserId, "Demo Editorial Team", "Demonstration author profile for development data only."]
  );

  const [authors] = await connection.execute("SELECT id FROM authors WHERE user_id = ? LIMIT 1", [adminUserId]);
  const authorId = authors[0].id;

  for (const [slug, arTitle, enTitle] of categories) {
    await connection.execute(
      `INSERT INTO categories (slug, created_at, updated_at)
       VALUES (?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [slug]
    );

    const [rows] = await connection.execute("SELECT id FROM categories WHERE slug = ? LIMIT 1", [slug]);
    const categoryId = rows[0].id;

    await connection.execute(
      `INSERT INTO category_translations (category_id, locale, title, description, created_at, updated_at)
       VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), updated_at = NOW()`,
      [categoryId, arTitle, `محتوى توضيحي لقسم ${arTitle}`, categoryId, enTitle, `Demo content for ${enTitle}`]
    );
  }

  for (const [slug, arName, enName] of banks) {
    await connection.execute(
      `INSERT INTO banks (slug, official_website, headquarters, swift_code, is_featured, last_updated_date, created_at, updated_at)
       VALUES (?, 'https://example.com', 'Khartoum', 'DEMOSDSD', 0, CURDATE(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [slug]
    );

    const [rows] = await connection.execute("SELECT id FROM banks WHERE slug = ? LIMIT 1", [slug]);
    const bankId = rows[0].id;

    await connection.execute(
      `INSERT INTO bank_translations (bank_id, locale, name, short_description, full_description, created_at, updated_at)
       VALUES (?, 'ar', ?, ?, ?, NOW(), NOW()), (?, 'en', ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description), full_description = VALUES(full_description), updated_at = NOW()`,
      [
        bankId,
        arName,
        `وصف تجريبي للبنك ${arName} لأغراض العرض فقط.`,
        `هذا المحتوى تجريبي ولا يمثل بيانات حقيقية للبنك ${arName}.`,
        bankId,
        enName,
        `Demo profile for ${enName}.`,
        `Demonstration content only. Do not treat as official bank information.`,
      ]
    );
  }

  const [bankRows] = await connection.execute("SELECT id FROM banks ORDER BY id ASC LIMIT 5");
  const bankIds = bankRows.map((row) => row.id);

  for (let i = 0; i < products.length; i += 1) {
    const name = products[i];
    const slug = slugify(`demo-${name}`);
    const bankId = bankIds[i % bankIds.length];

    await connection.execute(
      `INSERT INTO products (slug, bank_id, product_category, official_source_url, last_verified_date, created_at, updated_at)
       VALUES (?, ?, ?, 'https://example.com', CURDATE(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE bank_id = VALUES(bank_id), product_category = VALUES(product_category), updated_at = NOW()`,
      [slug, bankId, name]
    );

    const [rows] = await connection.execute("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
    const productId = rows[0].id;

    await connection.execute(
      `INSERT INTO product_translations
       (product_id, locale, name, short_description, description, eligibility, required_documents, fees, limits_text, benefits, application_process, created_at, updated_at)
       VALUES
       (?, 'ar', ?, ?, ?, 'محتوى توضيحي', 'محتوى توضيحي', 'محتوى توضيحي', 'محتوى توضيحي', 'محتوى توضيحي', 'تحقق من موقع البنك الرسمي', NOW(), NOW()),
       (?, 'en', ?, ?, ?, 'Demo eligibility', 'Demo documents', 'Demo fees', 'Demo limits', 'Demo benefits', 'Check official bank website', NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       short_description = VALUES(short_description), description = VALUES(description), updated_at = NOW()`,
      [
        productId,
        `تجريبي ${name}`,
        `وصف تجريبي للمنتج ${name}`,
        `هذا المحتوى توضيحي ولا يمثل شروطًا حقيقية.`,
        productId,
        `Demo ${name}`,
        `Demo description for ${name}`,
        `Demonstration content only; verify all terms from official sources.`,
      ]
    );
  }

  const [categoryRows] = await connection.execute("SELECT id, slug FROM categories");
  const categoryMap = new Map(categoryRows.map((row) => [row.slug, row.id]));

  async function createArticlePair(title, localeCategorySlug, articleType = "news") {
    const slug = slugify(title);

    await connection.execute(
      `INSERT INTO articles
       (slug, status, article_type, author_id, reading_time_minutes, is_breaking, created_by, updated_by, published_at, created_at, updated_at)
       VALUES (?, 'published', ?, ?, 4, 0, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'published', article_type = VALUES(article_type), updated_at = NOW()`,
      [slug, articleType, authorId, adminUserId, adminUserId]
    );

    const [rows] = await connection.execute("SELECT id FROM articles WHERE slug = ? LIMIT 1", [slug]);
    const articleId = rows[0].id;

    await connection.execute(
      `INSERT INTO article_translations
       (article_id, locale, title, summary, content_html, seo_title, seo_description, created_at, updated_at)
       VALUES
       (?, 'ar', ?, ?, ?, ?, ?, NOW(), NOW()),
       (?, 'en', ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       title = VALUES(title), summary = VALUES(summary), content_html = VALUES(content_html), updated_at = NOW()`,
      [
        articleId,
        `${title} (نسخة توضيحية)`,
        "هذا خبر تجريبي لأغراض التطوير ولا يمثل إعلانًا رسميًا.",
        "<p>هذا المحتوى تجريبي لبيئة التطوير. يرجى التحقق من المصادر الرسمية قبل اتخاذ أي قرار مالي.</p>",
        `${title} - توضيحي`,
        "محتوى تجريبي",
        articleId,
        `${title} (Demo)`,
        "Demonstration-only article for development and testing.",
        "<p>This is demonstration content only. Verify official sources before financial decisions.</p>",
        `${title} - Demo`,
        "Demonstration content",
      ]
    );

    const categoryId = categoryMap.get(localeCategorySlug) ?? categoryMap.get("news");
    await connection.execute(
      `INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)`,
      [articleId, categoryId]
    );

    return articleId;
  }

  for (const title of newsTitles) {
    await createArticlePair(title, "news", "news");
  }

  for (const title of digitalTitles) {
    await createArticlePair(title, "digital-banking", "news");
  }

  for (const title of guideTitles) {
    await createArticlePair(`Demo Guide: ${title}`, "guides", "guide");
  }

  for (const title of securityAlerts) {
    await createArticlePair(title, "security-alerts", "security_alert");
  }

  for (const title of jobTitles) {
    const slug = slugify(`demo-${title}`);
    await connection.execute(
      `INSERT INTO jobs
       (slug, organization, location, employment_type, application_deadline, official_application_url, source, verification_status, status, created_at, updated_at)
       VALUES (?, 'Demo Financial Institution', 'Khartoum', 'Full-time', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'https://example.com/jobs', 'Demonstration Source', 'verified', 'published', NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [slug]
    );

    const [rows] = await connection.execute("SELECT id FROM jobs WHERE slug = ? LIMIT 1", [slug]);
    const jobId = rows[0].id;

    await connection.execute(
      `INSERT INTO job_translations (job_id, locale, title, description, requirements, created_at, updated_at)
       VALUES (?, 'ar', ?, 'إعلان وظيفي تجريبي لأغراض العرض.', 'متطلبات تجريبية', NOW(), NOW()),
              (?, 'en', ?, 'Demonstration job listing for development only.', 'Demo requirements', NOW(), NOW())
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), updated_at = NOW()`,
      [jobId, `${title} (تجريبي)`, jobId, `${title} (Demo)`]
    );
  }

  for (let i = 0; i < exchangeRates.length; i += 1) {
    const [currencyName, currencyCode] = exchangeRates[i];
    const buy = 500 + i * 8;
    const sell = buy + 4;

    await connection.execute(
      `INSERT INTO exchange_rates
       (currency_name, currency_code, official_buy, official_sell, parallel_buy, parallel_sell, rate_date, source, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), 'Demonstration Source', 'Demonstration data only. Not real-time or official.', ?, NOW(), NOW())`,
      [currencyName, currencyCode, buy, sell, buy + 15, sell + 15, i, adminUserId]
    );
  }

  await connection.execute(
    `INSERT INTO homepage_sections (section_key, enabled, sort_order, config_json, updated_by, created_at, updated_at)
     VALUES
     ('breaking_news_ticker', 1, 1, JSON_OBJECT('label','Demo'), ?, NOW(), NOW()),
     ('main_featured_story', 1, 2, JSON_OBJECT('label','Demo'), ?, NOW(), NOW()),
     ('latest_banking_news', 1, 3, JSON_OBJECT('label','Demo'), ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), sort_order = VALUES(sort_order), updated_at = NOW()`,
    [adminUserId, adminUserId, adminUserId]
  );

  await connection.commit();
  console.log("Seed completed with demonstration content.");
  console.log("Demo admin: admin@bankinews.demo");
  console.log("Demo password:", process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!");
} catch (error) {
  await connection.rollback();
  console.error("Seed failed", error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
