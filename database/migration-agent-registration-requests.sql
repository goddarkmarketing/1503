-- Agent registration requests (นายหน้าแจ้งเพิ่มตัวแทน → แอดมินอนุมัติ)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS agent_registration_requests (
  id VARCHAR(36) NOT NULL,
  requester_agent_id VARCHAR(36) NOT NULL,
  name VARCHAR(190) NOT NULL,
  phone VARCHAR(64) NULL,
  id_card VARCHAR(32) NULL,
  birth_date VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_agent_id VARCHAR(36) NULL,
  admin_note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_by_name VARCHAR(120) NULL,
  PRIMARY KEY (id),
  KEY idx_arr_requester (requester_agent_id, created_at),
  KEY idx_arr_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
