-- Credit ledger + transfer-slip proof (existing databases)
-- Safe to run more than once.

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
