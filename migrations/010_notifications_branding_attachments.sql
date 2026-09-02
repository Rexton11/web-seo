-- CRM branding and Telegram integration in settings
ALTER TABLE settings ADD COLUMN crm_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE settings ADD COLUMN crm_favicon VARCHAR(500) DEFAULT NULL;
ALTER TABLE settings ADD COLUMN telegram_bot_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE settings ADD COLUMN telegram_chat_id VARCHAR(100) DEFAULT NULL;

-- Task file attachments
ALTER TABLE attachments ADD COLUMN task_id VARCHAR(255) DEFAULT NULL;

-- Project access notes
ALTER TABLE projects ADD COLUMN access_notes TEXT DEFAULT NULL;
