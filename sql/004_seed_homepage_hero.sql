INSERT INTO homepage_sections (section_key, enabled, sort_order, config_json, created_at, updated_at)
SELECT
  'hero_carousel',
  1,
  5,
  JSON_OBJECT(
    'slides',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'hero-1',
        'title', 'الخطة الاستراتيجية للقطاع المصرفي في السودان',
        'summary', 'واجهة رئيسية داخلية بعرض محدود وخلفية داكنة وصورة بطابع مصرفي يمكن تعديلها من لوحة الإدارة في أي وقت.',
        'imageUrl', '/hero-banking-1.svg',
        'href', '/ar',
        'eyebrow', 'واجهة الأخبار',
        'ctaLabel', 'اكتشف المزيد'
      ),
      JSON_OBJECT(
        'id', 'hero-2',
        'title', 'تغطية اقتصادية ومصرفية بصور متغيرة',
        'summary', 'يعرض الموقع الشرائح بشكل دائري مع اختيار عشوائي لأول شريحة عند تحميل الصفحة لتبدو الواجهة أكثر حيوية.',
        'imageUrl', '/hero-banking-2.svg',
        'href', '/ar/news',
        'eyebrow', 'آخر الأخبار',
        'ctaLabel', 'تصفح الأخبار'
      ),
      JSON_OBJECT(
        'id', 'hero-3',
        'title', 'مساحة بطول الصفحة وليست بعرض الشاشة الكامل',
        'summary', 'القسم الجديد يلتزم بنفس حاوية الصفحة مع خلفية منقوشة، ويمكن تغيير الصور والروابط والنصوص من إعدادات الموقع.',
        'imageUrl', '/hero-banking-3.svg',
        'href', '/ar/about',
        'eyebrow', 'مخصص للإدارة',
        'ctaLabel', 'إدارة المحتوى'
      )
    )
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_sections WHERE section_key = 'hero_carousel'
);
