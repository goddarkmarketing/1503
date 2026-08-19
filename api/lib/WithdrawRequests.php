<?php
declare(strict_types=1);

final class WithdrawRequests
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS withdraw_requests (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  public static function listForAgent(PDO $pdo, string $agentId, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT r.*, a.code AS agent_code, u.name AS agent_name
            FROM withdraw_requests r
            INNER JOIN agents a ON a.id = r.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE r.agent_id = :agent_id';
    $params = [':agent_id' => $agentId];
    $status = trim((string)($filters['status'] ?? ''));
    if ($status !== '') {
      $sql .= ' AND r.status = :status';
      $params[':status'] = $status;
    }
    $sql .= ' ORDER BY r.created_at DESC, r.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function listAll(PDO $pdo, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT r.*, a.code AS agent_code, u.name AS agent_name
            FROM withdraw_requests r
            INNER JOIN agents a ON a.id = r.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE 1=1';
    $params = [];
    $status = trim((string)($filters['status'] ?? ''));
    if ($status !== '') {
      $sql .= ' AND r.status = :status';
      $params[':status'] = $status;
    }
    $sql .= ' ORDER BY r.created_at DESC, r.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function pendingCount(PDO $pdo): int
  {
    self::ensureTable($pdo);
    return (int)$pdo->query("SELECT COUNT(*) FROM withdraw_requests WHERE status = 'pending'")->fetchColumn();
  }

  public static function create(PDO $pdo, string $agentId, array $body, array $actor): array
  {
    self::ensureTable($pdo);
    $agent = Agents::fetchOne($pdo, $agentId);
    if (!$agent) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    $amount = round((float)($body['amount'] ?? 0), 2);
    if ($amount < 100) {
      Response::error('กรุณาระบุจำนวนเงินขั้นต่ำ 100 บาท', 422, 'VALIDATION');
    }

    $bankCode = strtoupper(trim((string)($body['bankCode'] ?? $body['bank_code'] ?? '')));
    $bankName = trim((string)($body['bankName'] ?? $body['bank_name'] ?? ''));
    $accountNo = preg_replace('/\s+/', '', (string)($body['accountNo'] ?? $body['account_no'] ?? ''));
    $accountName = trim((string)($body['accountName'] ?? $body['account_name'] ?? ''));
    if ($bankCode === '') {
      Response::error('กรุณาเลือกธนาคาร', 422, 'VALIDATION');
    }
    if ($accountNo === '') {
      Response::error('กรุณากรอกเลขบัญชี', 422, 'VALIDATION');
    }
    if ($accountName === '') {
      Response::error('กรุณากรอกชื่อบัญชี', 422, 'VALIDATION');
    }
    if ($bankName === '') {
      $bankName = $bankCode;
    }

    $pending = $pdo->prepare(
      "SELECT id FROM withdraw_requests WHERE agent_id = :agent_id AND status = 'pending' LIMIT 1"
    );
    $pending->execute([':agent_id' => $agentId]);
    if ($pending->fetch()) {
      Response::error('มีคำขอถอนเงินที่รอโอนอยู่แล้ว กรุณารอแอดมินดำเนินการก่อน', 422, 'VALIDATION');
    }

    $id = 'WD-' . strtoupper(bin2hex(random_bytes(4)));
    $note = trim((string)($body['note'] ?? ''));
    $pdo->prepare(
      'INSERT INTO withdraw_requests
        (id, agent_id, amount, note, bank_code, bank_name, account_no, account_name, status)
       VALUES
        (:id, :agent_id, :amount, :note, :bank_code, :bank_name, :account_no, :account_name, \'pending\')'
    )->execute([
      ':id' => $id,
      ':agent_id' => $agentId,
      ':amount' => $amount,
      ':note' => $note !== '' ? $note : null,
      ':bank_code' => $bankCode,
      ':bank_name' => $bankName,
      ':account_no' => $accountNo,
      ':account_name' => $accountName,
    ]);

    Auth::audit(
      $pdo,
      'withdraw_request',
      'แจ้งถอนเงิน',
      $actor,
      $agent['code'] . ' ขอถอน ' . number_format($amount, 2) . ' บาท'
    );

    $created = self::fetchPublic($pdo, $id) ?: ['id' => $id];
    $created['emailSent'] = self::notifyEmail($created);
    return $created;
  }

  public static function review(PDO $pdo, string $requestId, string $action, array $actor, array $body = []): array
  {
    self::ensureTable($pdo);
    CreditLedger::ensureTable($pdo);
    $row = self::raw($pdo, $requestId);
    if (!$row) {
      Response::error('ไม่พบคำขอถอนเงิน', 404, 'NOT_FOUND');
    }
    if ($row['status'] !== 'pending') {
      Response::error('คำขอนี้ดำเนินการแล้ว', 422, 'VALIDATION');
    }
    if ($action !== 'pay' && $action !== 'reject') {
      Response::error('การดำเนินการไม่ถูกต้อง', 422, 'VALIDATION');
    }

    $saved = [];
    if ($action === 'pay') {
      $slipSrc = (isset($body['slip']) && is_array($body['slip'])) ? $body['slip'] : $body;
      $slip = [
        'dataUrl' => trim((string)($slipSrc['dataUrl'] ?? $slipSrc['slipDataUrl'] ?? '')),
        'fileName' => trim((string)($slipSrc['fileName'] ?? $slipSrc['slipFileName'] ?? '')),
      ];
      if ($slip['dataUrl'] === '') {
        Response::error('กรุณาแนบหลักฐานการโอนเงิน', 422, 'VALIDATION');
      }
      $saved = CreditLedger::storeSlip($requestId, $slip);
    }

    try {
      $pdo->prepare(
        'UPDATE withdraw_requests
         SET status = :status, reviewed_at = NOW(), reviewed_by = :reviewed_by, reviewed_by_name = :reviewed_by_name,
             slip_file_name = :slip_file_name, slip_path = :slip_path, slip_mime = :slip_mime
         WHERE id = :id'
      )->execute([
        ':status' => $action === 'pay' ? 'paid' : 'rejected',
        ':reviewed_by' => $actor['id'] ?? null,
        ':reviewed_by_name' => $actor['name'] ?? null,
        ':slip_file_name' => $saved['fileName'] ?? null,
        ':slip_path' => $saved['path'] ?? null,
        ':slip_mime' => $saved['mime'] ?? null,
        ':id' => $requestId,
      ]);
    } catch (Throwable $e) {
      if (!empty($saved['absPath']) && is_file($saved['absPath'])) {
        @unlink($saved['absPath']);
      }
      throw $e;
    }

    Auth::audit(
      $pdo,
      'withdraw_review',
      $action === 'pay' ? 'โอนเงินถอนแล้ว' : 'ปฏิเสธถอนเงิน',
      $actor,
      ($row['agent_code'] ?? $row['agent_id']) . ' ' . number_format((float)$row['amount'], 2) . ' บาท'
    );

    return self::fetchPublic($pdo, $requestId) ?: ['id' => $requestId];
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

  private static function notifyEmail(array $created): bool
  {
    $to = Mailer::withdrawNotifyTo();
    $code = (string)($created['agentCode'] ?? '');
    $id = (string)($created['id'] ?? '');
    $html = Mailer::withdrawRequestHtml($created);
    return Mailer::send($to, '[Kladee] คำขอถอนเงิน ' . $id . ' จาก ' . $code, $html);
  }

  private static function fetchPublic(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT r.*, a.code AS agent_code, u.name AS agent_name
       FROM withdraw_requests r
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
       FROM withdraw_requests r
       INNER JOIN agents a ON a.id = r.agent_id
       WHERE r.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function iso($value): string
  {
    $created = (string)$value;
    if ($created !== '' && strpos($created, 'T') === false) {
      $created = str_replace(' ', 'T', $created);
    }
    return $created;
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
      'bankCode' => $row['bank_code'] ?? '',
      'bankName' => $row['bank_name'] ?? '',
      'accountNo' => $row['account_no'] ?? '',
      'accountName' => $row['account_name'] ?? '',
      'status' => $row['status'],
      'createdAt' => $created,
      'reviewedAt' => $reviewed ?: null,
      'reviewedByName' => $row['reviewed_by_name'] ?? null,
      'hasSlip' => $hasSlip,
      'slipFileName' => $row['slip_file_name'] ?? null,
      'slipUrl' => $hasSlip ? '/withdraw-requests/' . rawurlencode($row['id']) . '/slip' : null,
    ];
  }
}
