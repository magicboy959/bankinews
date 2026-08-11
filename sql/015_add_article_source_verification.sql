ALTER TABLE articles
  ADD COLUMN source_verification_status ENUM('unverified','editorial_review','official') NOT NULL DEFAULT 'unverified' AFTER source_attribution,
  ADD COLUMN source_last_verified_at DATE NULL AFTER source_verification_status,
  ADD INDEX idx_articles_source_verification (source_verification_status, source_last_verified_at);
