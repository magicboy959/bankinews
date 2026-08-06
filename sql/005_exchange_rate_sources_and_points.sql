CREATE TABLE IF NOT EXISTS rate_sources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  source_type ENUM('bank','exchange_company','central_bank','other') NOT NULL DEFAULT 'other',
  slug VARCHAR(160) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rate_sources_name (name),
  INDEX idx_rate_sources_type_active (source_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exchange_rate_points (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT UNSIGNED NOT NULL,
  currency_code CHAR(3) NOT NULL,
  buy_rate DECIMAL(18,6) NULL,
  sell_rate DECIMAL(18,6) NULL,
  rate_date DATE NOT NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exchange_rate_points (source_id, currency_code, rate_date),
  INDEX idx_exchange_rate_points_currency_date (currency_code, rate_date),
  INDEX idx_exchange_rate_points_date (rate_date),
  CONSTRAINT fk_exchange_rate_points_source FOREIGN KEY (source_id) REFERENCES rate_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO rate_sources (name, source_type, slug, is_active, created_at, updated_at)
SELECT DISTINCT
  er.source,
  CASE
    WHEN er.source LIKE '%شركة%' THEN 'exchange_company'
    WHEN er.source LIKE '%bank%' OR er.source LIKE '%Bank%' OR er.source LIKE '%بنك%' OR er.source LIKE '%مصرف%' THEN 'bank'
    ELSE 'other'
  END,
  CONCAT('src-', LOWER(SUBSTRING(MD5(er.source), 1, 12))),
  1,
  NOW(),
  NOW()
FROM exchange_rates er
WHERE er.deleted_at IS NULL
  AND er.source IS NOT NULL
  AND TRIM(er.source) <> ''
ON DUPLICATE KEY UPDATE
  source_type = VALUES(source_type),
  is_active = VALUES(is_active),
  updated_at = NOW();

INSERT INTO exchange_rate_points
  (source_id, currency_code, buy_rate, sell_rate, rate_date, meta_json, created_at, updated_at)
SELECT
  rs.id,
  er.currency_code,
  er.official_buy,
  er.official_sell,
  er.rate_date,
  JSON_OBJECT('seededFrom', 'exchange_rates', 'exchangeRateId', er.id),
  NOW(),
  NOW()
FROM exchange_rates er
JOIN rate_sources rs ON rs.name = er.source
WHERE er.deleted_at IS NULL
  AND (er.official_buy IS NOT NULL OR er.official_sell IS NOT NULL)
ON DUPLICATE KEY UPDATE
  buy_rate = VALUES(buy_rate),
  sell_rate = VALUES(sell_rate),
  updated_at = NOW();

SET @has_exchange_rates_currency_date_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exchange_rates'
    AND INDEX_NAME = 'idx_exchange_rates_currency_date'
);

SET @create_exchange_rates_currency_date_idx := IF(
  @has_exchange_rates_currency_date_idx = 0,
  'CREATE INDEX idx_exchange_rates_currency_date ON exchange_rates (currency_code, rate_date)',
  'SELECT 1'
);

PREPARE create_exchange_rates_currency_date_idx_stmt FROM @create_exchange_rates_currency_date_idx;
EXECUTE create_exchange_rates_currency_date_idx_stmt;
DEALLOCATE PREPARE create_exchange_rates_currency_date_idx_stmt;

SET @has_exchange_rates_source_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exchange_rates'
    AND INDEX_NAME = 'idx_exchange_rates_source'
);

SET @create_exchange_rates_source_idx := IF(
  @has_exchange_rates_source_idx = 0,
  'CREATE INDEX idx_exchange_rates_source ON exchange_rates (source)',
  'SELECT 1'
);

PREPARE create_exchange_rates_source_idx_stmt FROM @create_exchange_rates_source_idx;
EXECUTE create_exchange_rates_source_idx_stmt;
DEALLOCATE PREPARE create_exchange_rates_source_idx_stmt;
