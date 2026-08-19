-- Payout bank fields on identity verification
SET NAMES utf8mb4;

ALTER TABLE agent_identity_verifications
  ADD COLUMN payout_bank_code VARCHAR(32) NULL AFTER phone,
  ADD COLUMN payout_bank_name VARCHAR(190) NULL AFTER payout_bank_code,
  ADD COLUMN payout_account_no VARCHAR(64) NULL AFTER payout_bank_name,
  ADD COLUMN payout_account_name VARCHAR(190) NULL AFTER payout_account_no;
