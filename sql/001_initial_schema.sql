SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','administrator','editor','author','contributor') NOT NULL DEFAULT 'contributor',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS authors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  display_name VARCHAR(160) NOT NULL,
  bio TEXT NULL,
  photo_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_authors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  parent_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(800) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_translation (category_id, locale),
  CONSTRAINT fk_category_translations_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_translations_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tag_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tag_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  title VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tag_translation (tag_id, locale),
  CONSTRAINT fk_tag_translations_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_tag_translations_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  logo_url VARCHAR(500) NULL,
  official_website VARCHAR(500) NULL,
  customer_service_numbers VARCHAR(255) NULL,
  headquarters VARCHAR(255) NULL,
  swift_code VARCHAR(60) NULL,
  mobile_app_url VARCHAR(500) NULL,
  social_links JSON NULL,
  branch_info JSON NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  last_updated_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_banks_featured (is_featured),
  INDEX idx_banks_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bank_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  name VARCHAR(220) NOT NULL,
  short_description VARCHAR(900) NOT NULL,
  full_description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bank_translation (bank_id, locale),
  CONSTRAINT fk_bank_translations_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
  INDEX idx_bank_translations_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bank_services (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_id BIGINT UNSIGNED NOT NULL,
  service_code VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bank_service (bank_id, service_code),
  CONSTRAINT fk_bank_services_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  bank_id BIGINT UNSIGNED NOT NULL,
  product_category VARCHAR(160) NOT NULL,
  official_source_url VARCHAR(500) NULL,
  last_verified_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_products_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT,
  INDEX idx_products_bank (bank_id),
  INDEX idx_products_category (product_category),
  INDEX idx_products_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  name VARCHAR(220) NOT NULL,
  short_description VARCHAR(900) NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT NULL,
  required_documents TEXT NULL,
  fees TEXT NULL,
  limits_text TEXT NULL,
  benefits TEXT NULL,
  application_process TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_translation (product_id, locale),
  CONSTRAINT fk_product_translations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_translations_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  status ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  article_type ENUM(
    'news','breaking_news','product_announcement','bank_update','central_bank_announcement',
    'guide','analysis','report','interview','opinion','press_release','sponsored_content','job_listing','security_alert'
  ) NOT NULL DEFAULT 'news',
  featured_image_url VARCHAR(500) NULL,
  source_url VARCHAR(500) NULL,
  source_attribution VARCHAR(255) NULL,
  source_verification_status ENUM('unverified','editorial_review','official') NOT NULL DEFAULT 'unverified',
  source_last_verified_at DATE NULL,
  author_id BIGINT UNSIGNED NULL,
  related_bank_id BIGINT UNSIGNED NULL,
  reading_time_minutes INT UNSIGNED NOT NULL DEFAULT 1,
  is_breaking TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_sponsored TINYINT(1) NOT NULL DEFAULT 0,
  is_opinion TINYINT(1) NOT NULL DEFAULT 0,
  is_press_release TINYINT(1) NOT NULL DEFAULT 0,
  comments_enabled TINYINT(1) NOT NULL DEFAULT 1,
  publish_at DATETIME NULL,
  expires_at DATETIME NULL,
  published_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_related_bank FOREIGN KEY (related_bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_articles_status (status),
  INDEX idx_articles_article_type (article_type),
  INDEX idx_articles_published_at (published_at),
  INDEX idx_articles_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(1000) NOT NULL,
  content_html LONGTEXT NOT NULL,
  seo_title VARCHAR(255) NULL,
  seo_description VARCHAR(320) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_article_translation (article_id, locale),
  CONSTRAINT fk_article_translations_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FULLTEXT KEY ft_article_translations_title_content (title, content_html),
  INDEX idx_article_translations_locale (locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_revisions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  revision_no INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(1000) NOT NULL,
  content_html LONGTEXT NOT NULL,
  changed_by BIGINT UNSIGNED NULL,
  change_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_article_revision (article_id, locale, revision_no),
  CONSTRAINT fk_article_revisions_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_revisions_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_categories (
  article_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, category_id),
  CONSTRAINT fk_article_categories_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  CONSTRAINT fk_article_tags_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  currency_name VARCHAR(120) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  official_buy DECIMAL(18,6) NULL,
  official_sell DECIMAL(18,6) NULL,
  parallel_buy DECIMAL(18,6) NULL,
  parallel_sell DECIMAL(18,6) NULL,
  rate_date DATE NOT NULL,
  source VARCHAR(255) NOT NULL,
  notes VARCHAR(1000) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_exchange_rates_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_exchange_rates_date_currency (rate_date, currency_code),
  INDEX idx_exchange_rates_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  organization VARCHAR(255) NOT NULL,
  location VARCHAR(180) NOT NULL,
  employment_type VARCHAR(120) NOT NULL,
  application_deadline DATE NOT NULL,
  official_application_url VARCHAR(500) NOT NULL,
  source VARCHAR(255) NULL,
  verification_status ENUM('unverified','verified') NOT NULL DEFAULT 'unverified',
  status ENUM('draft','published','expired','archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_jobs_deadline (application_deadline),
  INDEX idx_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_translation (job_id, locale),
  CONSTRAINT fk_job_translations_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  approval_status ENUM('pending','approved','rejected','spam') NOT NULL DEFAULT 'pending',
  report_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_comments_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_comments_article_status (article_id, approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS media (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  alt_text VARCHAR(500) NULL,
  caption VARCHAR(800) NULL,
  credit VARCHAR(255) NULL,
  source_url VARCHAR(500) NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_media_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  preferred_language ENUM('ar','en') NOT NULL DEFAULT 'ar',
  status ENUM('pending','active','unsubscribed') NOT NULL DEFAULT 'pending',
  consent_at DATETIME NULL,
  double_opt_in_token VARCHAR(120) NULL,
  subscribed_at DATETIME NULL,
  unsubscribed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  attachment_url VARCHAR(500) NULL,
  consent TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('new','in_review','resolved') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contact_messages_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS advertisements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  advertiser_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  destination_url VARCHAR(500) NOT NULL,
  placement ENUM('homepage_banner','article_top','article_middle','article_sidebar','category_page','mobile_banner','newsletter_sponsor') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft','active','paused','expired') NOT NULL DEFAULT 'draft',
  impression_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  click_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS homepage_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(120) NOT NULL UNIQUE,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  config_json JSON NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_homepage_sections_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(160) NOT NULL UNIQUE,
  setting_value JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  previous_status VARCHAR(80) NULL,
  new_status VARCHAR(80) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_views (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  viewer_hash VARCHAR(120) NULL,
  viewed_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_views_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_views_article_date (article_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saved_articles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  article_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved_article (user_id, article_id),
  CONSTRAINT fk_saved_articles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_articles_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
