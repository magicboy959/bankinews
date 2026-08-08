CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  html_content MEDIUMTEXT NOT NULL,
  text_content MEDIUMTEXT NULL,
  audience_filter JSON NULL,
  status ENUM('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
  recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
  sent_count INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count INT UNSIGNED NOT NULL DEFAULT 0,
  sent_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_campaigns_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_marketing_campaigns_status (status),
  INDEX idx_marketing_campaigns_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
