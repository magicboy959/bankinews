ALTER TABLE articles
  ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_breaking,
  ADD INDEX idx_articles_featured_published (is_featured, published_at);
