SET @video_url_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'articles'
    AND COLUMN_NAME = 'video_url'
);

SET @video_url_sql := IF(
  @video_url_exists = 0,
  'ALTER TABLE articles ADD COLUMN video_url VARCHAR(500) NULL AFTER featured_image_url',
  'SELECT 1'
);

PREPARE stmt_video_url FROM @video_url_sql;
EXECUTE stmt_video_url;
DEALLOCATE PREPARE stmt_video_url;
