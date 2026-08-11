CREATE TABLE IF NOT EXISTS article_distributions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('ar','en') NOT NULL DEFAULT 'ar',
  text_mode ENUM('ai','custom') NOT NULL DEFAULT 'ai',
  custom_text TEXT NULL,
  status ENUM('pending','partial','published','failed') NOT NULL DEFAULT 'pending',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_article_distributions_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_distributions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_article_distributions_article_created (article_id, created_at),
  INDEX idx_article_distributions_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS article_distribution_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  distribution_id BIGINT UNSIGNED NOT NULL,
  channel ENUM('website','facebook','instagram','x','telegram','whatsapp_channel','linkedin') NOT NULL,
  social_text TEXT NOT NULL,
  status ENUM('pending','published','failed','manual_required','skipped') NOT NULL DEFAULT 'pending',
  external_id VARCHAR(500) NULL,
  external_url VARCHAR(1000) NULL,
  error_message VARCHAR(1000) NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_distribution_items_distribution FOREIGN KEY (distribution_id) REFERENCES article_distributions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_article_distribution_channel (distribution_id, channel),
  INDEX idx_article_distribution_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
