-- Seed demo accounts (password for all = demo)
-- Hash generated with password_hash('demo', PASSWORD_DEFAULT)

SET NAMES utf8mb4;

INSERT INTO users (id, username, password_hash, role, name, email, phone, initials, status) VALUES
('admin-001', 'admin', '$2y$10$m4mQoMo4uZKLnnZTxbIuL.eV95NMyw8y.Uw0ujlB44zPzADOhteXW', 'admin', 'ผู้ดูแลระบบ', 'admin@kladeebroker.co.th', '02-000-0000', 'AD', 'active'),
('agent-001', 'Ck1-039', '$2y$10$m4mQoMo4uZKLnnZTxbIuL.eV95NMyw8y.Uw0ujlB44zPzADOhteXW', 'agent', 'สมชาย ใจดี', 'ck1039@example.com', '081-234-5678', 'CK', 'active'),
('agent-002', 'Ag2-112', '$2y$10$m4mQoMo4uZKLnnZTxbIuL.eV95NMyw8y.Uw0ujlB44zPzADOhteXW', 'agent', 'วิไล รักษ์ดี (ทดลองจำกัดสิทธิ์)', 'ag2112@example.com', '082-345-6789', 'WR', 'active'),
('agent-003', 'Ag3-205', '$2y$10$m4mQoMo4uZKLnnZTxbIuL.eV95NMyw8y.Uw0ujlB44zPzADOhteXW', 'agent', 'ประเสริฐ มั่นคง (ทดลอง)', 'ag3205@example.com', '089-111-2233', 'PT', 'active')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  name = VALUES(name),
  status = VALUES(status);

INSERT INTO agents (id, user_id, code, balance, credit_limit, parent_id, status) VALUES
('agent-001', 'agent-001', 'Ck1-039', 34531.73, 50000.00, NULL, 'active'),
('agent-002', 'agent-002', 'Ag2-112', 12890.50, 30000.00, 'agent-001', 'active'),
('agent-003', 'agent-003', 'Ag3-205', 5200.00, 20000.00, 'agent-001', 'active')
ON DUPLICATE KEY UPDATE
  balance = VALUES(balance),
  credit_limit = VALUES(credit_limit),
  parent_id = VALUES(parent_id),
  status = VALUES(status);
