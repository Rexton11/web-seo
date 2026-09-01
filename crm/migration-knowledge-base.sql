-- Миграция: База знаний
-- Выполнить в phpMyAdmin или MySQL консоли на сервере

-- 1. Таблица категорий базы знаний
CREATE TABLE IF NOT EXISTS `kb_categories` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT 'FileText',
  `is_public` tinyint(1) DEFAULT 0,
  `order` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kb_cat_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 2. Таблица статей базы знаний
CREATE TABLE IF NOT EXISTS `kb_articles` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `category_id` varchar(255) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `slug` varchar(500) NOT NULL,
  `content` longtext,
  `tags` json DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `is_pinned` tinyint(1) DEFAULT 0,
  `views` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kb_art_user` (`user_id`),
  KEY `idx_kb_art_category` (`category_id`),
  KEY `idx_kb_art_slug` (`slug`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 3. Добавляем article_id к attachments (для файлов в статьях)
ALTER TABLE `attachments`
  ADD COLUMN `article_id` varchar(255) DEFAULT NULL,
  ADD KEY `idx_attachments_article_id` (`article_id`);
