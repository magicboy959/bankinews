SET @has_open_count := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND COLUMN_NAME = 'open_count'
);

SET @sql := IF(
  @has_open_count = 0,
  'ALTER TABLE marketing_campaigns ADD COLUMN open_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER failed_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_click_count := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND COLUMN_NAME = 'click_count'
);

SET @sql := IF(
  @has_click_count = 0,
  'ALTER TABLE marketing_campaigns ADD COLUMN click_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER open_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_last_opened_at := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND COLUMN_NAME = 'last_opened_at'
);

SET @sql := IF(
  @has_last_opened_at = 0,
  'ALTER TABLE marketing_campaigns ADD COLUMN last_opened_at DATETIME NULL AFTER click_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_last_clicked_at := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND COLUMN_NAME = 'last_clicked_at'
);

SET @sql := IF(
  @has_last_clicked_at = 0,
  'ALTER TABLE marketing_campaigns ADD COLUMN last_clicked_at DATETIME NULL AFTER last_opened_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
