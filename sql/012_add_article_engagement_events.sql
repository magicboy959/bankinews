CREATE TABLE IF NOT EXISTS article_engagement_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  event_name VARCHAR(80) NOT NULL,
  progress_percent TINYINT UNSIGNED NULL,
  seconds_on_page INT UNSIGNED NULL,
  locale VARCHAR(5) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_engagement_events_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_engagement_article_created (article_id, created_at),
  INDEX idx_article_engagement_event_created (event_name, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;