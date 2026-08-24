INSERT INTO banks
  (slug, official_website, headquarters, is_featured, show_on_website, last_updated_date, created_at, updated_at)
VALUES
  ('central-bank-of-sudan', 'https://cbos.gov.sd', 'Khartoum', 0, 1, CURDATE(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  official_website = VALUES(official_website),
  headquarters = VALUES(headquarters),
  show_on_website = 1,
  last_updated_date = VALUES(last_updated_date),
  updated_at = NOW();

SET @central_bank_of_sudan_id = (
  SELECT id FROM banks WHERE slug = 'central-bank-of-sudan' LIMIT 1
);

INSERT INTO bank_translations
  (bank_id, locale, name, short_description, full_description, created_at, updated_at)
VALUES
  (
    @central_bank_of_sudan_id,
    'ar',
    'بنك السودان المركزي',
    'البنك المركزي لجمهورية السودان والجهة المسؤولة عن تنظيم السياسة النقدية والقطاع المصرفي.',
    'بنك السودان المركزي هو البنك المركزي لجمهورية السودان، ويعمل على تنظيم السياسة النقدية والإشراف على النظام المصرفي وتعزيز الاستقرار المالي.',
    NOW(),
    NOW()
  ),
  (
    @central_bank_of_sudan_id,
    'en',
    'Central Bank of Sudan',
    'The central bank of the Republic of Sudan responsible for monetary policy and banking-sector regulation.',
    'The Central Bank of Sudan is the central bank of the Republic of Sudan, responsible for monetary policy, banking supervision, and financial stability.',
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_description = VALUES(short_description),
  full_description = VALUES(full_description),
  updated_at = NOW();