-- Agent identity verification (ยืนยันตัวตนครั้งแรก)
SET NAMES utf8mb4;

ALTER TABLE agents
  ADD COLUMN identity_status ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none' AFTER status;

CREATE TABLE IF NOT EXISTS agent_identity_verifications (
  id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  registration_request_id VARCHAR(36) NULL,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(64) NULL,
  bank_account_path VARCHAR(255) NULL,
  bank_account_file_name VARCHAR(255) NULL,
  bank_account_mime VARCHAR(80) NULL,
  id_card_path VARCHAR(255) NULL,
  id_card_file_name VARCHAR(255) NULL,
  id_card_mime VARCHAR(80) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  mismatch_notes TEXT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_by_name VARCHAR(120) NULL,
  PRIMARY KEY (id),
  KEY idx_aiv_agent (agent_id, submitted_at),
  KEY idx_aiv_status (status, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
