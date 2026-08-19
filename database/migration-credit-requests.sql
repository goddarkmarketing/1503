-- Credit bank accounts + agent top-up requests (internal money, not insurer APIs)
-- Safe to run more than once. PHP also creates these tables on first use.

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
