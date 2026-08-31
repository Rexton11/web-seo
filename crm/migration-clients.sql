-- Миграция: Добавление таблицы клиентов и привязка к сделкам
-- Выполнить в phpMyAdmin или MySQL консоли на сервере

-- 1. Создаём таблицу clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `legal_info` json DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Добавляем колонку client_id в deals (если не существует)
ALTER TABLE `deals` ADD COLUMN `client_id` varchar(255) DEFAULT NULL AFTER `user_id`;
ALTER TABLE `deals` ADD INDEX `idx_deals_client_id` (`client_id`);

-- 3. (Опционально) Автоматический импорт клиентов из существующих сделок
-- Создаёт клиента из каждого уникального имени в сделках и привязывает
INSERT INTO `clients` (`id`, `user_id`, `name`, `company`, `phone`, `email`, `source`, `created_at`)
SELECT
  UUID() as `id`,
  `user_id`,
  `client_name` as `name`,
  MAX(`company`) as `company`,
  MAX(`phone`) as `phone`,
  MAX(`email`) as `email`,
  MAX(`source`) as `source`,
  MIN(`created_at`) as `created_at`
FROM `deals`
GROUP BY `user_id`, `client_name`;

-- 4. Привязываем существующие сделки к созданным клиентам
UPDATE `deals` d
INNER JOIN `clients` c ON c.`user_id` = d.`user_id` AND c.`name` = d.`client_name`
SET d.`client_id` = c.`id`;

-- 5. Переносим реквизиты из сделок в клиентов (если были заполнены)
UPDATE `clients` c
INNER JOIN `deals` d ON d.`client_id` = c.`id` AND d.`legal_info` IS NOT NULL
SET c.`legal_info` = d.`legal_info`
WHERE c.`legal_info` IS NULL;
