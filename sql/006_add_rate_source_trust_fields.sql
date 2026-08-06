SET @has_rate_sources_trust_tier := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rate_sources'
    AND COLUMN_NAME = 'trust_tier'
);

SET @add_rate_sources_trust_tier := IF(
  @has_rate_sources_trust_tier = 0,
  "ALTER TABLE rate_sources ADD COLUMN trust_tier ENUM('high','medium','low','unverified') NOT NULL DEFAULT 'unverified' AFTER is_active",
  'SELECT 1'
);

PREPARE add_rate_sources_trust_tier_stmt FROM @add_rate_sources_trust_tier;
EXECUTE add_rate_sources_trust_tier_stmt;
DEALLOCATE PREPARE add_rate_sources_trust_tier_stmt;

SET @has_rate_sources_trust_score := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rate_sources'
    AND COLUMN_NAME = 'trust_score'
);

SET @add_rate_sources_trust_score := IF(
  @has_rate_sources_trust_score = 0,
  'ALTER TABLE rate_sources ADD COLUMN trust_score TINYINT UNSIGNED NOT NULL DEFAULT 50 AFTER trust_tier',
  'SELECT 1'
);

PREPARE add_rate_sources_trust_score_stmt FROM @add_rate_sources_trust_score;
EXECUTE add_rate_sources_trust_score_stmt;
DEALLOCATE PREPARE add_rate_sources_trust_score_stmt;

SET @has_rate_sources_last_verified_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rate_sources'
    AND COLUMN_NAME = 'last_verified_at'
);

SET @add_rate_sources_last_verified_at := IF(
  @has_rate_sources_last_verified_at = 0,
  'ALTER TABLE rate_sources ADD COLUMN last_verified_at DATETIME NULL AFTER trust_score',
  'SELECT 1'
);

PREPARE add_rate_sources_last_verified_at_stmt FROM @add_rate_sources_last_verified_at;
EXECUTE add_rate_sources_last_verified_at_stmt;
DEALLOCATE PREPARE add_rate_sources_last_verified_at_stmt;

SET @has_rate_sources_trust_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rate_sources'
    AND INDEX_NAME = 'idx_rate_sources_trust_active'
);

SET @create_rate_sources_trust_idx := IF(
  @has_rate_sources_trust_idx = 0,
  'CREATE INDEX idx_rate_sources_trust_active ON rate_sources (trust_tier, is_active)',
  'SELECT 1'
);

PREPARE create_rate_sources_trust_idx_stmt FROM @create_rate_sources_trust_idx;
EXECUTE create_rate_sources_trust_idx_stmt;
DEALLOCATE PREPARE create_rate_sources_trust_idx_stmt;

UPDATE rate_sources
SET
  trust_tier = CASE
    WHEN source_type = 'central_bank' THEN 'high'
    WHEN source_type = 'bank' THEN 'medium'
    WHEN source_type = 'exchange_company' THEN 'low'
    ELSE 'unverified'
  END,
  trust_score = CASE
    WHEN source_type = 'central_bank' THEN 90
    WHEN source_type = 'bank' THEN 75
    WHEN source_type = 'exchange_company' THEN 60
    ELSE 45
  END,
  last_verified_at = COALESCE(last_verified_at, NOW())
WHERE is_active = 1;
