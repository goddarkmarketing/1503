-- Agent withdraw requests (internal money). Safe to run more than once.
-- PHP also creates this table on first use.

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
