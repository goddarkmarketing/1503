<?php
declare(strict_types=1);

final class CreditLedger
{
  private const MAX_SLIP_BYTES = 5242880; // 5 MB

  private const MIME_EXT = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
  ];

  public static function ensureTable(PDO $pdo): void
  {
    // MySQL DDL commits the current transaction even if the table already exists.
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS credit_ledger (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  public static function record(
    PDO $pdo,
    string $agentId,
    float $amount,
    float $balanceAfter,
    string $note,
    ?array $actor,
    array $slip = []
  ): array {
    $id = 'cl-' . bin2hex(random_bytes(8));
    $type = $amount >= 0 ? 'credit' : 'debit';
    if (!empty($slip['existingRel'])) {
      $slipMeta = self::copyStoredSlip(
        (string)$slip['existingRel'],
        $id,
        (string)($slip['fileName'] ?? $slip['slipFileName'] ?? ''),
        (string)($slip['mime'] ?? '')
      );
    } else {
      $slipMeta = self::saveSlip($id, $slip);
    }

    $stmt = $pdo->prepare(
      'INSERT INTO credit_ledger
        (id, agent_id, type, amount, balance_after, note, slip_file_name, slip_path, slip_mime, created_by, created_by_name)
       VALUES
        (:id, :agent_id, :type, :amount, :balance_after, :note, :slip_file_name, :slip_path, :slip_mime, :created_by, :created_by_name)'
    );
    try {
      $stmt->execute([
        ':id' => $id,
        ':agent_id' => $agentId,
        ':type' => $type,
        ':amount' => round($amount, 2),
        ':balance_after' => round($balanceAfter, 2),
        ':note' => $note !== '' ? $note : null,
        ':slip_file_name' => $slipMeta['fileName'] ?? null,
        ':slip_path' => $slipMeta['path'] ?? null,
        ':slip_mime' => $slipMeta['mime'] ?? null,
        ':created_by' => $actor['id'] ?? null,
        ':created_by_name' => $actor['name'] ?? null,
      ]);
    } catch (Throwable $e) {
      if (!empty($slipMeta['absPath']) && is_file($slipMeta['absPath'])) {
        @unlink($slipMeta['absPath']);
      }
      throw $e;
    }

    return self::fetchOne($pdo, $id) ?: ['id' => $id];
  }

  public static function list(PDO $pdo, array $user, array $filters = []): array
  {
    self::ensureTable($pdo);

    $sql = 'SELECT l.*, a.code AS agent_code, u.name AS agent_name
            FROM credit_ledger l
            INNER JOIN agents a ON a.id = l.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE 1=1';
    $params = [];

    $agentId = trim((string)($filters['agentId'] ?? ''));
    if (($user['role'] ?? '') === 'agent') {
      $agentId = (string)$user['id'];
    }
    if ($agentId !== '') {
      $sql .= ' AND l.agent_id = :agent_id';
      $params[':agent_id'] = $agentId;
    }

    $dateFrom = trim((string)($filters['dateFrom'] ?? ''));
    if ($dateFrom !== '') {
      $sql .= ' AND DATE(l.created_at) >= :date_from';
      $params[':date_from'] = $dateFrom;
    }
    $dateTo = trim((string)($filters['dateTo'] ?? ''));
    if ($dateTo !== '') {
      $sql .= ' AND DATE(l.created_at) <= :date_to';
      $params[':date_to'] = $dateTo;
    }

    $sql .= ' ORDER BY l.created_at DESC, l.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
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

    $abs = self::uploadsRoot() . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $row['slip_path']);
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

  public static function parseSlipPayload(array $body): array
  {
    $dataUrl = trim((string)($body['slipDataUrl'] ?? ''));
    $fileName = trim((string)($body['slipFileName'] ?? ''));
    if ($dataUrl === '') {
      return [];
    }
    return [
      'dataUrl' => $dataUrl,
      'fileName' => $fileName !== '' ? $fileName : 'slip.jpg',
    ];
  }

  public static function storeSlip(string $id, array $slip): array
  {
    return self::saveSlip($id, $slip);
  }

  public static function copyStoredSlip(string $fromRel, string $toId, string $fileName = '', string $mime = ''): array
  {
    $fromRel = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fromRel);
    if ($fromRel === '' || strpos($fromRel, '..') !== false) {
      return [];
    }
    $src = self::uploadsRoot() . DIRECTORY_SEPARATOR . $fromRel;
    if (!is_file($src)) {
      return [];
    }
    $ext = pathinfo($fromRel, PATHINFO_EXTENSION) ?: 'jpg';
    $rel = $toId . '.' . $ext;
    $dst = self::uploadsRoot() . DIRECTORY_SEPARATOR . $rel;
    if (!copy($src, $dst)) {
      throw new RuntimeException('Cannot copy slip file');
    }
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
      $fileName = 'slip.' . $ext;
    }
    return [
      'fileName' => $fileName,
      'path' => $rel,
      'mime' => $mime !== '' ? $mime : (string)(mime_content_type($dst) ?: null),
      'absPath' => $dst,
    ];
  }

  private static function fetchOne(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT l.*, a.code AS agent_code, u.name AS agent_name
       FROM credit_ledger l
       INNER JOIN agents a ON a.id = l.agent_id
       INNER JOIN users u ON u.id = a.user_id
       WHERE l.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  private static function raw(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare('SELECT * FROM credit_ledger WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function toPublic(array $row): array
  {
    $hasSlip = !empty($row['slip_path']);
    $created = (string)($row['created_at'] ?? '');
    if ($created !== '' && strpos($created, 'T') === false) {
      $created = str_replace(' ', 'T', $created);
    }
    return [
      'id' => $row['id'],
      'agentId' => $row['agent_id'],
      'agentCode' => $row['agent_code'] ?? '',
      'agentName' => $row['agent_name'] ?? '',
      'type' => $row['type'],
      'amount' => (float)$row['amount'],
      'balanceAfter' => (float)$row['balance_after'],
      'note' => $row['note'] ?? '',
      'createdBy' => $row['created_by'],
      'createdByName' => $row['created_by_name'] ?? '',
      'createdAt' => $created,
      'hasSlip' => $hasSlip,
      'slipFileName' => $row['slip_file_name'] ?? null,
      'slipUrl' => $hasSlip ? '/credit-ledger/' . rawurlencode($row['id']) . '/slip' : null,
    ];
  }

  private static function saveSlip(string $id, array $slip): array
  {
    $dataUrl = trim((string)($slip['dataUrl'] ?? $slip['slipDataUrl'] ?? ''));
    if ($dataUrl === '') {
      return [];
    }

    if (!preg_match('#^data:([a-zA-Z0-9.+/-]+);base64,(.+)$#s', $dataUrl, $m)) {
      Response::error('ไฟล์สลิปไม่ถูกต้อง', 422, 'VALIDATION');
    }
    $mime = strtolower($m[1]);
    if ($mime === 'image/jpg') {
      $mime = 'image/jpeg';
    }
    if (!isset(self::MIME_EXT[$mime])) {
      Response::error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF', 422, 'VALIDATION');
    }
    $binary = base64_decode($m[2], true);
    if ($binary === false || $binary === '') {
      Response::error('อ่านไฟล์สลิปไม่สำเร็จ', 422, 'VALIDATION');
    }
    if (strlen($binary) > self::MAX_SLIP_BYTES) {
      Response::error('ขนาดไฟล์ต้องไม่เกิน 5 MB', 422, 'VALIDATION');
    }

    $dir = self::uploadsRoot();
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
      throw new RuntimeException('Cannot create slip upload directory');
    }

    $ext = self::MIME_EXT[$mime];
    $rel = $id . '.' . $ext;
    $abs = $dir . DIRECTORY_SEPARATOR . $rel;
    if (file_put_contents($abs, $binary) === false) {
      throw new RuntimeException('Cannot save slip file');
    }

    $fileName = basename((string)($slip['fileName'] ?? $slip['slipFileName'] ?? ''));
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
      $fileName = 'slip.' . $ext;
    }

    return [
      'fileName' => $fileName,
      'path' => $rel,
      'mime' => $mime,
      'absPath' => $abs,
    ];
  }

  private static function uploadsRoot(): string
  {
    return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'credit-slips';
  }
}
