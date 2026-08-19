<?php
declare(strict_types=1);

final class CreditBankAccounts
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS credit_bank_accounts (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    self::ensureDefaults($pdo);
  }

  public static function list(PDO $pdo, bool $enabledOnly = false): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT * FROM credit_bank_accounts';
    if ($enabledOnly) {
      $sql .= ' WHERE enabled = 1';
    }
    $sql .= ' ORDER BY sort_order ASC, bank_name ASC';
    return array_map([self::class, 'toPublic'], $pdo->query($sql)->fetchAll());
  }

  public static function replaceAll(PDO $pdo, $banks, ?array $actor): array
  {
    self::ensureTable($pdo);
    if (!is_array($banks)) {
      Response::error('ข้อมูลบัญชีธนาคารไม่ถูกต้อง', 422, 'VALIDATION');
    }

    $next = [];
    foreach ($banks as $index => $row) {
      if (!is_array($row)) {
        continue;
      }
      $id = trim((string)($row['id'] ?? ''));
      $bankName = trim((string)($row['bankName'] ?? $row['bank_name'] ?? ''));
      $accountNo = trim((string)($row['accountNo'] ?? $row['account_no'] ?? ''));
      $accountName = trim((string)($row['accountName'] ?? $row['account_name'] ?? ''));
      if ($bankName === '' || $accountNo === '' || $accountName === '') {
        Response::error('กรุณากรอกธนาคาร เลขบัญชี และชื่อบัญชี', 422, 'VALIDATION');
      }
      if ($id === '') {
        $id = 'bank-' . bin2hex(random_bytes(4));
      }
      $enabled = !in_array($row['enabled'] ?? true, [false, 0, '0', 'false'], true);
      $next[] = [
        'id' => $id,
        'bank_name' => $bankName,
        'bank_short' => trim((string)($row['bankShort'] ?? $row['bank_short'] ?? '')) ?: null,
        'bank_code' => strtoupper(trim((string)($row['bankCode'] ?? $row['bank_code'] ?? ''))) ?: null,
        'account_no' => $accountNo,
        'account_name' => $accountName,
        'branch' => trim((string)($row['branch'] ?? '')) ?: null,
        'color' => trim((string)($row['color'] ?? '')) ?: null,
        'logo' => trim((string)($row['logo'] ?? '')) ?: null,
        'enabled' => $enabled ? 1 : 0,
        'active_from' => self::normalizeTime($row['activeFrom'] ?? $row['active_from'] ?? '00:00'),
        'active_to' => self::normalizeTime($row['activeTo'] ?? $row['active_to'] ?? '23:59'),
        'sort_order' => (int)$index,
      ];
    }

    $pdo->beginTransaction();
    try {
      $pdo->exec('DELETE FROM credit_bank_accounts');
      $stmt = $pdo->prepare(
        'INSERT INTO credit_bank_accounts
          (id, bank_name, bank_short, bank_code, account_no, account_name, branch, color, logo, enabled, active_from, active_to, sort_order)
         VALUES
          (:id, :bank_name, :bank_short, :bank_code, :account_no, :account_name, :branch, :color, :logo, :enabled, :active_from, :active_to, :sort_order)'
      );
      foreach ($next as $row) {
        $stmt->execute([
          ':id' => $row['id'],
          ':bank_name' => $row['bank_name'],
          ':bank_short' => $row['bank_short'],
          ':bank_code' => $row['bank_code'],
          ':account_no' => $row['account_no'],
          ':account_name' => $row['account_name'],
          ':branch' => $row['branch'],
          ':color' => $row['color'],
          ':logo' => $row['logo'],
          ':enabled' => $row['enabled'],
          ':active_from' => $row['active_from'],
          ':active_to' => $row['active_to'],
          ':sort_order' => $row['sort_order'],
        ]);
      }
      Auth::audit(
        $pdo,
        'credit_bank_accounts_update',
        'อัปเดตบัญชีธนาคาร',
        $actor,
        count($next) . ' รายการ'
      );
      $pdo->commit();
    } catch (Throwable $e) {
      if ($pdo->inTransaction()) {
        $pdo->rollBack();
      }
      throw $e;
    }

    $list = self::list($pdo, false);
    return ['banks' => $list];
  }

  public static function fetchOne(PDO $pdo, string $id): ?array
  {
    self::ensureTable($pdo);
    $stmt = $pdo->prepare('SELECT * FROM credit_bank_accounts WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function ensureDefaults(PDO $pdo): void
  {
    $count = (int)$pdo->query('SELECT COUNT(*) FROM credit_bank_accounts')->fetchColumn();
    if ($count > 0) {
      return;
    }
    $defaults = [
      [
        'id' => 'bank-kbank',
        'bank_name' => 'ธนาคารกสิกรไทย',
        'bank_short' => 'กสิกรไทย',
        'bank_code' => 'KBANK',
        'account_no' => '123-4-56789-0',
        'account_name' => 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
        'branch' => 'นครสวรรค์',
        'color' => '#1DA858',
        'logo' => 'images/banks/thai-banks-logo/KBANK.png',
      ],
      [
        'id' => 'bank-scb',
        'bank_name' => 'ธนาคารไทยพาณิชย์',
        'bank_short' => 'ไทยพาณิชย์',
        'bank_code' => 'SCB',
        'account_no' => '987-6-54321-0',
        'account_name' => 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
        'branch' => 'นครสวรรค์',
        'color' => '#543186',
        'logo' => 'images/banks/thai-banks-logo/SCB.png',
      ],
      [
        'id' => 'bank-bbl',
        'bank_name' => 'ธนาคารกรุงเทพ',
        'bank_short' => 'กรุงเทพ',
        'bank_code' => 'BBL',
        'account_no' => '456-7-89012-3',
        'account_name' => 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
        'branch' => 'นครสวรรค์',
        'color' => '#29449D',
        'logo' => 'images/banks/thai-banks-logo/BBL.png',
      ],
    ];
    $stmt = $pdo->prepare(
      'INSERT INTO credit_bank_accounts
        (id, bank_name, bank_short, bank_code, account_no, account_name, branch, color, logo, enabled, active_from, active_to, sort_order)
       VALUES
        (:id, :bank_name, :bank_short, :bank_code, :account_no, :account_name, :branch, :color, :logo, 1, \'00:00\', \'23:59\', :sort_order)'
    );
    foreach ($defaults as $i => $row) {
      $stmt->execute([
        ':id' => $row['id'],
        ':bank_name' => $row['bank_name'],
        ':bank_short' => $row['bank_short'],
        ':bank_code' => $row['bank_code'],
        ':account_no' => $row['account_no'],
        ':account_name' => $row['account_name'],
        ':branch' => $row['branch'],
        ':color' => $row['color'],
        ':logo' => $row['logo'],
        ':sort_order' => $i,
      ]);
    }
  }

  private static function normalizeTime($value): string
  {
    $raw = trim((string)$value);
    if (preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $raw)) {
      return $raw;
    }
    return '00:00';
  }

  private static function toPublic(array $row): array
  {
    return [
      'id' => $row['id'],
      'bankName' => $row['bank_name'],
      'bankShort' => $row['bank_short'] ?? '',
      'bankCode' => $row['bank_code'] ?? '',
      'accountNo' => $row['account_no'],
      'accountName' => $row['account_name'],
      'branch' => $row['branch'] ?? '',
      'color' => $row['color'] ?? '',
      'logo' => $row['logo'] ?? '',
      'enabled' => ((int)$row['enabled']) === 1,
      'activeFrom' => $row['active_from'] ?: '00:00',
      'activeTo' => $row['active_to'] ?: '23:59',
    ];
  }
}
