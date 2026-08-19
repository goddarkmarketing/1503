<?php
declare(strict_types=1);

final class CreditRequests
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS credit_requests (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  public static function listForAgent(PDO $pdo, string $agentId, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT r.*, a.code AS agent_code, u.name AS agent_name
            FROM credit_requests r
            INNER JOIN agents a ON a.id = r.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE r.agent_id = :agent_id';
    $params = [':agent_id' => $agentId];
    $sql .= self::filterSql($filters, $params);
    $sql .= ' ORDER BY r.created_at DESC, r.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function listAll(PDO $pdo, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT r.*, a.code AS agent_code, u.name AS agent_name
            FROM credit_requests r
            INNER JOIN agents a ON a.id = r.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE 1=1';
    $params = [];
    $sql .= self::filterSql($filters, $params);
    $sql .= ' ORDER BY r.created_at DESC, r.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function create(PDO $pdo, string $agentId, array $body, array $actor): array
  {
    self::ensureTable($pdo);
    CreditBankAccounts::ensureTable($pdo);

    $agent = Agents::fetchOne($pdo, $agentId);
    if (!$agent) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    $amount = round((float)($body['amount'] ?? 0), 2);
    if ($amount < 1000) {
      Response::error('กรุณาระบุจำนวนเงินขั้นต่ำ 1,000 บาท', 422, 'VALIDATION');
    }
    if ($amount > 50000) {
      Response::error('จำนวนเงินสูงสุด 50,000 บาท', 422, 'VALIDATION');
    }
    $transferDate = trim((string)($body['transferDate'] ?? ''));
    $transferTime = trim((string)($body['transferTime'] ?? ''));
    if ($transferDate === '') {
      Response::error('กรุณาระบุวันที่โอนเงิน', 422, 'VALIDATION');
    }
    if ($transferTime === '') {
      Response::error('กรุณาระบุเวลาที่โอน', 422, 'VALIDATION');
    }

    $slip = CreditLedger::parseSlipPayload($body);
    if (empty($slip['dataUrl'])) {
      Response::error('กรุณาอัปโหลดหลักฐานการโอนเงิน', 422, 'VALIDATION');
    }

    $bankId = trim((string)($body['bankAccountId'] ?? ''));
    $bankRow = $bankId !== '' ? CreditBankAccounts::fetchOne($pdo, $bankId) : null;
    if ($bankId !== '' && !$bankRow) {
      Response::error('ไม่พบบัญชีธนาคารที่เลือก', 422, 'VALIDATION');
    }
    if ($bankRow && (int)$bankRow['enabled'] !== 1) {
      Response::error('บัญชีธนาคารที่เลือกถูกปิดใช้งานแล้ว กรุณาเลือกบัญชีอื่น', 422, 'VALIDATION');
    }
    if (!$bankRow) {
      $enabled = CreditBankAccounts::list($pdo, true);
      if (!$enabled) {
        Response::error('ไม่พบบัญชีธนาคารสำหรับรับโอน (หรือบัญชีถูกปิดใช้งาน)', 422, 'VALIDATION');
      }
      $public = $enabled[0];
      $bankRow = [
        'id' => $public['id'],
        'bank_name' => $public['bankName'],
        'account_no' => $public['accountNo'],
        'account_name' => $public['accountName'],
      ];
    }

    $id = 'CR-' . strtoupper(bin2hex(random_bytes(4)));
    $saved = CreditLedger::storeSlip($id, $slip);

    $stmt = $pdo->prepare(
      'INSERT INTO credit_requests
        (id, agent_id, amount, note, payment_method, bank_account_id, bank_name, account_no, account_name,
         transfer_date, transfer_time, slip_file_name, slip_path, slip_mime, status)
       VALUES
        (:id, :agent_id, :amount, :note, \'bank_transfer\', :bank_account_id, :bank_name, :account_no, :account_name,
         :transfer_date, :transfer_time, :slip_file_name, :slip_path, :slip_mime, \'pending\')'
    );
    try {
      $stmt->execute([
        ':id' => $id,
        ':agent_id' => $agentId,
        ':amount' => $amount,
        ':note' => trim((string)($body['note'] ?? '')) ?: null,
        ':bank_account_id' => $bankRow['id'],
        ':bank_name' => $bankRow['bank_name'],
        ':account_no' => $bankRow['account_no'],
        ':account_name' => $bankRow['account_name'],
        ':transfer_date' => $transferDate,
        ':transfer_time' => $transferTime,
        ':slip_file_name' => $saved['fileName'] ?? null,
        ':slip_path' => $saved['path'] ?? null,
        ':slip_mime' => $saved['mime'] ?? null,
      ]);
    } catch (Throwable $e) {
      if (!empty($saved['absPath']) && is_file($saved['absPath'])) {
        @unlink($saved['absPath']);
      }
      throw $e;
    }

    Auth::audit(
      $pdo,
      'credit_request',
      'ขอเติมวงเงิน',
      $actor,
      $agent['code'] . ' ขอเติม ' . number_format($amount, 2) . ' บาท ผ่าน ' . $bankRow['bank_name']
    );

    $created = self::fetchPublic($pdo, $id);
    return $created ?: ['id' => $id];
  }

  public static function review(PDO $pdo, string $requestId, string $action, array $actor): array
  {
    self::ensureTable($pdo);
    CreditLedger::ensureTable($pdo);
    $row = self::raw($pdo, $requestId);
    if (!$row) {
      Response::error('ไม่พบคำขอ', 404, 'NOT_FOUND');
    }
    if ($row['status'] !== 'pending') {
      Response::error('คำขอนี้ดำเนินการแล้ว', 422, 'VALIDATION');
    }
    if ($action !== 'approve' && $action !== 'reject') {
      Response::error('การดำเนินการไม่ถูกต้อง', 422, 'VALIDATION');
    }

    $pdo->beginTransaction();
    try {
      if ($action === 'approve') {
        Agents::adjustBalance(
          $pdo,
          $row['agent_id'],
          (float)$row['amount'],
          'อนุมัติคำขอ ' . $row['id'],
          $actor,
          [
            'existingRel' => (string)($row['slip_path'] ?? ''),
            'fileName' => (string)($row['slip_file_name'] ?? ''),
            'mime' => (string)($row['slip_mime'] ?? ''),
          ]
        );
      }

      $pdo->prepare(
        'UPDATE credit_requests
         SET status = :status, reviewed_at = NOW(), reviewed_by = :reviewed_by, reviewed_by_name = :reviewed_by_name
         WHERE id = :id'
      )->execute([
        ':status' => $action === 'approve' ? 'approved' : 'rejected',
        ':reviewed_by' => $actor['id'] ?? null,
        ':reviewed_by_name' => $actor['name'] ?? null,
        ':id' => $requestId,
      ]);

      Auth::audit(
        $pdo,
        'credit_review',
        $action === 'approve' ? 'อนุมัติเติมวงเงิน' : 'ปฏิเสธเติมวงเงิน',
        $actor,
        ($row['agent_code'] ?? $row['agent_id']) . ' ' .
        ($action === 'approve' ? '+' : '') . number_format((float)$row['amount'], 2) . ' บาท'
      );

      $pdo->commit();
    } catch (Throwable $e) {
      if ($pdo->inTransaction()) {
        $pdo->rollBack();
      }
      throw $e;
    }

    $updated = self::fetchPublic($pdo, $requestId);
    return $updated ?: ['id' => $requestId];
  }

  public static function streamSlip(PDO $pdo, string $id, array $user): void
  {
    self::ensureTable($pdo);
    $row = self::raw($pdo, $id);
    if (!$row || empty($row['slip_path'])) {
      Response::error('ไม่พบหลักฐานการโอนเงิน', 404, 'NOT_FOUND');
    }
    if (($user['role'] ?? '') === 'agent' && $row['agent_id'] !== $user['id']) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }

    $root = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'credit-slips';
    $abs = $root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $row['slip_path']);
    if (!is_file($abs)) {
      Response::error('ไม่พบไฟล์สลิป', 404, 'NOT_FOUND');
    }

    $mime = $row['slip_mime'] ?: 'application/octet-stream';
    $name = $row['slip_file_name'] ?: basename($row['slip_path']);
    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: inline; filename="' . str_replace(['"', "\r", "\n"], '', $name) . '"');
    header('Content-Length: ' . (string)filesize($abs));
    readfile($abs);
    exit;
  }

  private static function filterSql(array $filters, array &$params): string
  {
    $sql = '';
    $status = trim((string)($filters['status'] ?? ''));
    if ($status !== '') {
      $sql .= ' AND r.status = :status';
      $params[':status'] = $status;
    }
    $period = trim((string)($filters['period'] ?? ''));
    $periodType = trim((string)($filters['periodType'] ?? 'month'));
    if ($period !== '') {
      if ($periodType === 'day') {
        $sql .= ' AND DATE(r.created_at) = :period';
        $params[':period'] = $period;
      } elseif ($periodType === 'year') {
        $sql .= ' AND YEAR(r.created_at) = :period_year';
        $params[':period_year'] = (int)$period;
      } else {
        $sql .= ' AND DATE_FORMAT(r.created_at, \'%Y-%m\') = :period';
        $params[':period'] = $period;
      }
    }
    return $sql;
  }

  private static function fetchPublic(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT r.*, a.code AS agent_code, u.name AS agent_name
       FROM credit_requests r
       INNER JOIN agents a ON a.id = r.agent_id
       INNER JOIN users u ON u.id = a.user_id
       WHERE r.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  private static function raw(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT r.*, a.code AS agent_code
       FROM credit_requests r
       INNER JOIN agents a ON a.id = r.agent_id
       WHERE r.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function toPublic(array $row): array
  {
    $hasSlip = !empty($row['slip_path']);
    $created = self::iso($row['created_at'] ?? '');
    $reviewed = self::iso($row['reviewed_at'] ?? '');
    return [
      'id' => $row['id'],
      'agentId' => $row['agent_id'],
      'agentCode' => $row['agent_code'] ?? '',
      'agentName' => $row['agent_name'] ?? '',
      'amount' => (float)$row['amount'],
      'note' => $row['note'] ?? '',
      'paymentMethod' => $row['payment_method'] ?: 'bank_transfer',
      'bankAccountId' => $row['bank_account_id'],
      'bankName' => $row['bank_name'] ?? '',
      'accountNo' => $row['account_no'] ?? '',
      'accountName' => $row['account_name'] ?? '',
      'transferDate' => $row['transfer_date'] ?? '',
      'transferTime' => $row['transfer_time'] ?? '',
      'status' => $row['status'],
      'createdAt' => $created,
      'reviewedAt' => $reviewed ?: null,
      'reviewedByName' => $row['reviewed_by_name'] ?? null,
      'hasSlip' => $hasSlip,
      'slipFileName' => $row['slip_file_name'] ?? null,
      'slipUrl' => $hasSlip ? '/credit-requests/' . rawurlencode($row['id']) . '/slip' : null,
    ];
  }

  private static function iso($value): string
  {
    $created = (string)$value;
    if ($created !== '' && strpos($created, 'T') === false) {
      $created = str_replace(' ', 'T', $created);
    }
    return $created;
  }
}
