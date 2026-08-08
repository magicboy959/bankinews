SET @has_scheduled_at := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND COLUMN_NAME = 'scheduled_at'
);

SET @sql := IF(
  @has_scheduled_at = 0,
  'ALTER TABLE marketing_campaigns ADD COLUMN scheduled_at DATETIME NULL AFTER audience_filter',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_scheduled_at_index := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_campaigns'
    AND INDEX_NAME = 'idx_marketing_campaigns_status_scheduled_at'
);

SET @sql := IF(
  @has_scheduled_at_index = 0,
  'ALTER TABLE marketing_campaigns ADD INDEX idx_marketing_campaigns_status_scheduled_at (status, scheduled_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
