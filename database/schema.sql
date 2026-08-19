-- Kladee Broker — initial MySQL schema (Plesk / XAMPP)
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('agent', 'admin') NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  initials VARCHAR(8) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  code VARCHAR(32) NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
  parent_id VARCHAR(36) NULL,
  feature_permissions JSON NULL,
  commission_rates JSON NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agents_code (code),
  UNIQUE KEY uq_agents_user (user_id),
  KEY idx_agents_parent (parent_id),
  CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_agents_parent FOREIGN KEY (parent_id) REFERENCES agents (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action VARCHAR(64) NOT NULL,
  action_label VARCHAR(120) NOT NULL,
  actor_id VARCHAR(36) NULL,
  actor_name VARCHAR(120) NULL,
  detail TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_ledger (
  id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  note VARCHAR(500) NULL,
  slip_file_name VARCHAR(255) NULL,
  slip_path VARCHAR(255) NULL,
  slip_mime VARCHAR(80) NULL,
  created_by VARCHAR(36) NULL,
  created_by_name VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ledger_agent (agent_id),
  KEY idx_ledger_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_bank_accounts (
  id VARCHAR(64) NOT NULL,
  bank_name VARCHAR(120) NOT NULL,
  bank_short VARCHAR(64) NULL,
  bank_code VARCHAR(16) NULL,
  account_no VARCHAR(64) NOT NULL,
  account_name VARCHAR(190) NOT NULL,
  branch VARCHAR(120) NULL,
  color VARCHAR(16) NULL,
  logo VARCHAR(255) NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  active_from VARCHAR(5) NOT NULL DEFAULT '00:00',
  active_to VARCHAR(5) NOT NULL DEFAULT '23:59',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_banks_enabled (enabled, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_requests (
  id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note VARCHAR(500) NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'bank_transfer',
  bank_account_id VARCHAR(64) NULL,
  bank_name VARCHAR(120) NULL,
  account_no VARCHAR(64) NULL,
  account_name VARCHAR(190) NULL,
  transfer_date DATE NULL,
  transfer_time VARCHAR(8) NULL,
  slip_file_name VARCHAR(255) NULL,
  slip_path VARCHAR(255) NULL,
  slip_mime VARCHAR(80) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_by_name VARCHAR(120) NULL,
  PRIMARY KEY (id),
  KEY idx_credit_req_agent (agent_id, created_at),
  KEY idx_credit_req_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS withdraw_requests (
  id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note VARCHAR(500) NULL,
  bank_code VARCHAR(16) NULL,
  bank_name VARCHAR(120) NULL,
  account_no VARCHAR(64) NULL,
  account_name VARCHAR(190) NULL,
  slip_file_name VARCHAR(255) NULL,
  slip_path VARCHAR(255) NULL,
  slip_mime VARCHAR(80) NULL,
  status ENUM('pending','paid','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_by_name VARCHAR(120) NULL,
  PRIMARY KEY (id),
  KEY idx_wd_req_agent (agent_id, created_at),
  KEY idx_wd_req_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
