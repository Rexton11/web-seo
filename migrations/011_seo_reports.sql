-- SEO Connections (Yandex Webmaster, Yandex Metrica tokens)
CREATE TABLE IF NOT EXISTS seo_connections (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) DEFAULT NULL,
  service VARCHAR(50) NOT NULL,
  site_url VARCHAR(500) DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  token_expires_at TIMESTAMP DEFAULT NULL,
  host_id VARCHAR(255) DEFAULT NULL,
  counter_id VARCHAR(50) DEFAULT NULL,
  meta JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_conn_user (user_id),
  INDEX idx_seo_conn_project (project_id)
);

-- SEO Reports
CREATE TABLE IF NOT EXISTS seo_reports (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) DEFAULT NULL,
  title VARCHAR(500) NOT NULL,
  period VARCHAR(50) DEFAULT NULL,
  date_from VARCHAR(20) DEFAULT NULL,
  date_to VARCHAR(20) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_report_user (user_id),
  INDEX idx_seo_report_project (project_id)
);

-- Yandex OAuth settings
ALTER TABLE settings ADD COLUMN yandex_client_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE settings ADD COLUMN yandex_client_secret VARCHAR(500) DEFAULT NULL;
