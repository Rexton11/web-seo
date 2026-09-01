-- Миграция: Добавление каталога услуг и файловых вложений
-- Выполнить в phpMyAdmin или MySQL консоли на сервере

-- 1. Добавляем колонку services в settings (если не существует)
ALTER TABLE `settings` ADD COLUMN `services` json DEFAULT NULL;

-- 2. Создаём таблицу attachments
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `deal_id` varchar(255) DEFAULT NULL,
  `client_id` varchar(255) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attachments_user_id` (`user_id`),
  KEY `idx_attachments_deal_id` (`deal_id`),
  KEY `idx_attachments_client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
