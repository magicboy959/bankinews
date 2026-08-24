INSERT INTO banks
  (slug, official_website, headquarters, is_featured, show_on_website, last_updated_date, created_at, updated_at)
VALUES
  ('nile-bank', NULL, 'Khartoum', 0, 1, CURDATE(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  headquarters = VALUES(headquarters),
  show_on_website = 1,
  last_updated_date = VALUES(last_updated_date),
  updated_at = NOW();

SET @nile_bank_id = (
  SELECT id FROM banks WHERE slug = 'nile-bank' LIMIT 1
);

INSERT INTO bank_translations
  (bank_id, locale, name, short_description, full_description, created_at, updated_at)
VALUES
  (
    @nile_bank_id,
    'ar',
    'بنك النيل',
    'بنك سوداني يقدم خدمات مصرفية للأفراد والشركات.',
    'بنك النيل هو بنك سوداني يقدم مجموعة من الخدمات والمنتجات المصرفية للأفراد والشركات.',
    NOW(),
    NOW()
  ),
  (
    @nile_bank_id,
    'en',
    'Nile Bank',
    'A Sudanese bank providing banking services for individuals and businesses.',
    'Nile Bank is a Sudanese bank providing a range of banking services and products for individuals and businesses.',
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_description = VALUES(short_description),
  full_description = VALUES(full_description),
  updated_at = NOW();