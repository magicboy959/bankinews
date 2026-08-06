SET @has_show_on_website := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'banks'
    AND COLUMN_NAME = 'show_on_website'
);

SET @add_show_on_website_column := IF(
  @has_show_on_website = 0,
  'ALTER TABLE banks ADD COLUMN show_on_website TINYINT(1) NOT NULL DEFAULT 1 AFTER swift_code',
  'SELECT 1'
);

PREPARE add_show_on_website_column_stmt FROM @add_show_on_website_column;
EXECUTE add_show_on_website_column_stmt;
DEALLOCATE PREPARE add_show_on_website_column_stmt;

SET @has_show_on_website_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'banks'
    AND INDEX_NAME = 'idx_banks_show_on_website'
);

SET @add_show_on_website_index := IF(
  @has_show_on_website_index = 0,
  'CREATE INDEX idx_banks_show_on_website ON banks (show_on_website)',
  'SELECT 1'
);

PREPARE add_show_on_website_index_stmt FROM @add_show_on_website_index;
EXECUTE add_show_on_website_index_stmt;
DEALLOCATE PREPARE add_show_on_website_index_stmt;
