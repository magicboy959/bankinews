CREATE TABLE IF NOT EXISTS marketing_campaign_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id BIGINT UNSIGNED NOT NULL,
  subscriber_id BIGINT UNSIGNED NOT NULL,
  subscriber_email VARCHAR(255) NOT NULL,
  event_type ENUM('open','click') NOT NULL,
  target_url TEXT NULL,
  user_agent VARCHAR(512) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_campaign_events_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  INDEX idx_marketing_campaign_events_campaign_created (campaign_id, created_at),
  INDEX idx_marketing_campaign_events_type_created (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;