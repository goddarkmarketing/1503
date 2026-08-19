<?php
declare(strict_types=1);

final class AgentIdentity
{
  private const MIME_EXT = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
  ];
  private const MAX_BYTES = 5 * 1024 * 1024;

  public static function ensureSchema(PDO $pdo): void
  {
    $col = $pdo->query("SHOW COLUMNS FROM agents LIKE 'identity_status'")->fetch();
    if (!$col) {
      $pdo->exec(
        "ALTER TABLE agents
         ADD COLUMN identity_status ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none' AFTER status"
      );
    }

    $pdo->exec(
      'CREATE TABLE IF NOT EXISTS agent_identity_verifications (
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
        status ENUM(\'pending\',\'approved\',\'rejected\') NOT NULL DEFAULT \'pending\',
        admin_note VARCHAR(500) NULL,
        mismatch_notes TEXT NULL,
        submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME NULL,
        reviewed_by VARCHAR(36) NULL,
        reviewed_by_name VARCHAR(120) NULL,
        PRIMARY KEY (id),
        KEY idx_aiv_agent (agent_id, submitted_at),
        KEY idx_aiv_status (status, submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
  }

  public static function getAgentStatus(PDO $pdo, string $agentId): string
  {
    self::ensureSchema($pdo);
    $stmt = $pdo->prepare(
      'SELECT identity_status FROM agents WHERE id = :id LIMIT 1'
    );
    $stmt->execute([':id' => $agentId]);
    $row = $stmt->fetch();
    return $row ? (string)$row['identity_status'] : 'none';
  }

  public static function getForAgent(PDO $pdo, string $agentId): array
  {
    self::ensureSchema($pdo);
    $status = self::getAgentStatus($pdo, $agentId);
    $ref = self::registrationReference($pdo, $agentId);

    $stmt = $pdo->prepare(
      'SELECT v.*, a.code AS agent_code, u.name AS agent_name
       FROM agent_identity_verifications v
       INNER JOIN agents a ON a.id = v.agent_id
       INNER JOIN users u ON u.id = a.user_id
       WHERE v.agent_id = :agent_id
       ORDER BY v.submitted_at DESC
       LIMIT 1'
    );
    $stmt->execute([':agent_id' => $agentId]);
    $latest = $stmt->fetch();

    return [
      'identityStatus' => $status,
      'reference' => $ref,
      'latest' => $latest ? self::toPublic($latest) : null,
    ];
  }

  public static function submit(PDO $pdo, string $agentId, array $body, array $actor): array
  {
    self::ensureSchema($pdo);

    $agent = self::requireAgent($pdo, $agentId);
    $current = self::getAgentStatus($pdo, $agentId);
    if ($current === 'approved') {
      Response::error('บัญชีนี้ยืนยันตัวตนแล้ว', 409, 'ALREADY_APPROVED');
    }
    if ($current === 'pending') {
      Response::error('มีคำขอยืนยันตัวตนรอแอดมินตรวจสอบอยู่แล้ว', 409, 'PENDING');
    }

    $name = trim((string)($body['name'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));
    if ($name === '') {
      Response::error('กรุณากรอกชื่อ-นามสกุล', 422, 'VALIDATION');
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      Response::error('กรุณากรอกอีเมลที่ถูกต้อง', 422, 'VALIDATION');
    }
    if ($phone === '') {
      Response::error('กรุณากรอกเบอร์โทรศัพท์', 422, 'VALIDATION');
    }

    $bankSlip = self::parseDoc($body, 'bankAccount');
    $idCardSlip = self::parseDoc($body, 'idCard');
    if (!$bankSlip || !$idCardSlip) {
      Response::error('กรุณาแนบรูปหน้าบัญชีธนาคารและสำเนาบัตรประชาชน', 422, 'VALIDATION');
    }

    $ref = self::registrationReference($pdo, $agentId);
    $mismatchNotes = null;
    if ($ref) {
      $mismatches = self::compareWithReference($name, $email, $phone, $ref);
      if ($mismatches !== []) {
        Response::error(
          'ข้อมูลไม่ตรงกับที่ลงทะเบียนไว้: ' . implode(', ', $mismatches),
          422,
          'MISMATCH'
        );
      }
    }

    $id = 'aiv-' . bin2hex(random_bytes(8));
    $bankMeta = self::saveDoc($id . '-bank', $bankSlip);
    $idMeta = self::saveDoc($id . '-id', $idCardSlip);

    $pdo->beginTransaction();
    try {
      $pdo->prepare(
        'INSERT INTO agent_identity_verifications (
          id, agent_id, registration_request_id, name, email, phone,
          bank_account_path, bank_account_file_name, bank_account_mime,
          id_card_path, id_card_file_name, id_card_mime,
          status, mismatch_notes
        ) VALUES (
          :id, :agent_id, :registration_request_id, :name, :email, :phone,
          :bank_path, :bank_name, :bank_mime,
          :id_path, :id_name, :id_mime,
          \'pending\', :mismatch_notes
        )'
      )->execute([
        ':id' => $id,
        ':agent_id' => $agentId,
        ':registration_request_id' => $ref['id'] ?? null,
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':bank_path' => $bankMeta['path'],
        ':bank_name' => $bankMeta['fileName'],
        ':bank_mime' => $bankMeta['mime'],
        ':id_path' => $idMeta['path'],
        ':id_name' => $idMeta['fileName'],
        ':id_mime' => $idMeta['mime'],
        ':mismatch_notes' => $mismatchNotes,
      ]);

      $pdo->prepare(
        'UPDATE agents SET identity_status = \'pending\' WHERE id = :id'
      )->execute([':id' => $agentId]);

      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    $record = self::fetchOne($pdo, $id);
    self::notifyAdmin($record);

    Auth::audit(
      $pdo,
      'identity_submit',
      'ส่งคำขอยืนยันตัวตน',
      $actor,
      'Agent ' . ($agent['code'] ?? $agentId) . ' submitted identity verification'
    );

    return self::toPublic($record);
  }

  public static function listAll(PDO $pdo, array $filters = []): array
  {
    self::ensureSchema($pdo);
    $status = trim((string)($filters['status'] ?? ''));
    $sql = 'SELECT v.*, a.code AS agent_code, u.name AS agent_name, u.username AS agent_username
            FROM agent_identity_verifications v
            INNER JOIN agents a ON a.id = v.agent_id
            INNER JOIN users u ON u.id = a.user_id';
    $params = [];
    if ($status !== '') {
      $sql .= ' WHERE v.status = :status';
      $params[':status'] = $status;
    }
    $sql .= ' ORDER BY v.submitted_at DESC LIMIT 500';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function review(PDO $pdo, string $id, string $action, array $admin, array $body = []): array
  {
    self::ensureSchema($pdo);
    $record = self::fetchOne($pdo, $id);
    if (!$record) {
      Response::error('ไม่พบคำขอยืนยันตัวตน', 404, 'NOT_FOUND');
    }
    if (($record['status'] ?? '') !== 'pending') {
      Response::error('คำขอนี้ดำเนินการแล้ว', 409, 'ALREADY_REVIEWED');
    }

    $note = trim((string)($body['note'] ?? ''));
    if ($action === 'reject' && $note === '') {
      Response::error('กรุณาระบุเหตุผลเมื่อปฏิเสธ', 422, 'VALIDATION');
    }

    $agentId = (string)$record['agent_id'];
    $newAgentStatus = $action === 'approve' ? 'approved' : 'rejected';
    $newRecordStatus = $action === 'approve' ? 'approved' : 'rejected';

    $pdo->beginTransaction();
    try {
      $pdo->prepare(
        'UPDATE agent_identity_verifications
         SET status = :status,
             admin_note = :note,
             reviewed_at = NOW(),
             reviewed_by = :reviewed_by,
             reviewed_by_name = :reviewed_by_name
         WHERE id = :id'
      )->execute([
        ':status' => $newRecordStatus,
        ':note' => $note !== '' ? $note : null,
        ':reviewed_by' => $admin['id'],
        ':reviewed_by_name' => $admin['name'] ?? null,
        ':id' => $id,
      ]);

      $pdo->prepare(
        'UPDATE agents SET identity_status = :status WHERE id = :id'
      )->execute([
        ':status' => $newAgentStatus,
        ':id' => $agentId,
      ]);

      if ($action === 'approve') {
        $pdo->prepare(
          'UPDATE users
           SET name = :name, email = :email, phone = :phone, updated_at = NOW()
           WHERE id = :id'
        )->execute([
          ':name' => $record['name'],
          ':email' => $record['email'],
          ':phone' => $record['phone'],
          ':id' => $agentId,
        ]);
      }

      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    Auth::audit(
      $pdo,
      $action === 'approve' ? 'identity_approve' : 'identity_reject',
      $action === 'approve' ? 'อนุมัติยืนยันตัวตน' : 'ปฏิเสธยืนยันตัวตน',
      $admin,
      ($record['agent_code'] ?? $agentId) . ' — ' . $id
    );

    return self::toPublic(self::fetchOne($pdo, $id));
  }

  public static function streamDoc(PDO $pdo, string $id, string $kind, array $user): void
  {
    self::ensureSchema($pdo);
    $record = self::fetchOne($pdo, $id);
    if (!$record) {
      Response::error('ไม่พบเอกสาร', 404, 'NOT_FOUND');
    }

    $role = $user['role'] ?? '';
    if ($role === 'agent' && ($user['id'] ?? '') !== ($record['agent_id'] ?? '')) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($role !== 'admin' && $role !== 'agent') {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }

    $pathKey = $kind === 'bank' ? 'bank_account_path' : 'id_card_path';
    $mimeKey = $kind === 'bank' ? 'bank_account_mime' : 'id_card_mime';
    $nameKey = $kind === 'bank' ? 'bank_account_file_name' : 'id_card_file_name';

    $rel = trim((string)($record[$pathKey] ?? ''));
    if ($rel === '') {
      Response::error('ไม่พบไฟล์', 404, 'NOT_FOUND');
    }

    $abs = self::uploadsRoot() . DIRECTORY_SEPARATOR . $rel;
    if (!is_file($abs)) {
      Response::error('ไม่พบไฟล์', 404, 'NOT_FOUND');
    }

    $mime = (string)($record[$mimeKey] ?? 'application/octet-stream');
    $fileName = (string)($record[$nameKey] ?? basename($rel));

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . rawurlencode($fileName) . '"');
    header('Content-Length: ' . (string)filesize($abs));
    readfile($abs);
    exit;
  }

  public static function pendingCount(PDO $pdo): int
  {
    self::ensureSchema($pdo);
    return (int)$pdo->query(
      "SELECT COUNT(*) FROM agent_identity_verifications WHERE status = 'pending'"
    )->fetchColumn();
  }

  private static function fetchOne(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT v.*, a.code AS agent_code, u.name AS agent_name, u.username AS agent_username
       FROM agent_identity_verifications v
       INNER JOIN agents a ON a.id = v.agent_id
       INNER JOIN users u ON u.id = a.user_id
       WHERE v.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function requireAgent(PDO $pdo, string $agentId): array
  {
    $stmt = $pdo->prepare(
      'SELECT a.*, u.name, u.email, u.phone
       FROM agents a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $agentId]);
    $agent = $stmt->fetch();
    if (!$agent) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }
    return $agent;
  }

  private static function registrationReference(PDO $pdo, string $agentId): ?array
  {
    AgentRegistrationRequests::ensureTable($pdo);
    $stmt = $pdo->prepare(
      "SELECT id, name, email, phone, id_card
       FROM agent_registration_requests
       WHERE created_agent_id = :agent_id AND status = 'approved'
       ORDER BY reviewed_at DESC
       LIMIT 1"
    );
    $stmt->execute([':agent_id' => $agentId]);
    $row = $stmt->fetch();
    if (!$row) {
      return null;
    }
    return [
      'id' => $row['id'],
      'name' => $row['name'] ?? '',
      'email' => $row['email'] ?? '',
      'phone' => $row['phone'] ?? '',
      'idCard' => $row['id_card'] ?? '',
    ];
  }

  private static function compareWithReference(
    string $name,
    string $email,
    string $phone,
    array $ref
  ): array {
    $mismatches = [];
    if (self::normName($name) !== self::normName((string)($ref['name'] ?? ''))) {
      $mismatches[] = 'ชื่อ-นามสกุล';
    }
    $refEmail = trim((string)($ref['email'] ?? ''));
    if ($refEmail !== '' && self::normEmail($email) !== self::normEmail($refEmail)) {
      $mismatches[] = 'อีเมล';
    }
    if (self::normPhone($phone) !== self::normPhone((string)($ref['phone'] ?? ''))) {
      $mismatches[] = 'เบอร์โทร';
    }
    return $mismatches;
  }

  private static function normName(string $value): string
  {
    $value = preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
    return mb_strtolower($value, 'UTF-8');
  }

  private static function normEmail(string $value): string
  {
    return mb_strtolower(trim($value), 'UTF-8');
  }

  private static function normPhone(string $value): string
  {
    return preg_replace('/\D+/', '', $value) ?? '';
  }

  private static function parseDoc(array $body, string $key): ?array
  {
    $doc = $body[$key] ?? null;
    if (!is_array($doc)) {
      return null;
    }
    $dataUrl = trim((string)($doc['dataUrl'] ?? ''));
    if ($dataUrl === '') {
      return null;
    }
    return [
      'dataUrl' => $dataUrl,
      'fileName' => (string)($doc['fileName'] ?? ''),
    ];
  }

  private static function saveDoc(string $id, array $slip): array
  {
    $dataUrl = trim((string)($slip['dataUrl'] ?? ''));
    if (!preg_match('#^data:([a-zA-Z0-9.+/-]+);base64,(.+)$#s', $dataUrl, $m)) {
      Response::error('ไฟล์แนบไม่ถูกต้อง', 422, 'VALIDATION');
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
      Response::error('อ่านไฟล์แนบไม่สำเร็จ', 422, 'VALIDATION');
    }
    if (strlen($binary) > self::MAX_BYTES) {
      Response::error('ขนาดไฟล์ต้องไม่เกิน 5 MB', 422, 'VALIDATION');
    }

    $dir = self::uploadsRoot();
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
      throw new RuntimeException('Cannot create identity upload directory');
    }

    $ext = self::MIME_EXT[$mime];
    $rel = $id . '.' . $ext;
    $abs = $dir . DIRECTORY_SEPARATOR . $rel;
    if (file_put_contents($abs, $binary) === false) {
      throw new RuntimeException('Cannot save identity file');
    }

    $fileName = basename((string)($slip['fileName'] ?? ''));
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
      $fileName = 'document.' . $ext;
    }

    return [
      'fileName' => $fileName,
      'path' => $rel,
      'mime' => $mime,
    ];
  }

  private static function uploadsRoot(): string
  {
    return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'identity-docs';
  }

  private static function notifyAdmin(array $record): void
  {
    $to = Mailer::identityNotifyTo();
    $html = Mailer::agentIdentityRequestHtml([
      'id' => $record['id'] ?? '',
      'agentCode' => $record['agent_code'] ?? '',
      'agentName' => $record['agent_name'] ?? '',
      'name' => $record['name'] ?? '',
      'email' => $record['email'] ?? '',
      'phone' => $record['phone'] ?? '',
      'submittedAt' => $record['submitted_at'] ?? '',
    ]);
    Mailer::send($to, 'คำขอยืนยันตัวตนนายหน้า — กล้าดีโบรคเกอร์', $html);
  }

  private static function toPublic(array $row): array
  {
    $submitted = (string)($row['submitted_at'] ?? '');
    if ($submitted !== '' && strpos($submitted, 'T') === false) {
      $submitted = str_replace(' ', 'T', $submitted);
    }
    $reviewed = (string)($row['reviewed_at'] ?? '');
    if ($reviewed !== '' && strpos($reviewed, 'T') === false) {
      $reviewed = str_replace(' ', 'T', $reviewed);
    }

    $hasBank = !empty($row['bank_account_path']);
    $hasId = !empty($row['id_card_path']);

    return [
      'id' => $row['id'],
      'agentId' => $row['agent_id'],
      'agentCode' => $row['agent_code'] ?? '',
      'agentName' => $row['agent_name'] ?? '',
      'agentUsername' => $row['agent_username'] ?? '',
      'registrationRequestId' => $row['registration_request_id'] ?? null,
      'name' => $row['name'],
      'email' => $row['email'] ?? '',
      'phone' => $row['phone'] ?? '',
      'status' => $row['status'],
      'adminNote' => $row['admin_note'] ?? null,
      'mismatchNotes' => $row['mismatch_notes'] ?? null,
      'submittedAt' => $submitted,
      'reviewedAt' => $reviewed !== '' ? $reviewed : null,
      'reviewedByName' => $row['reviewed_by_name'] ?? null,
      'hasBankAccountDoc' => $hasBank,
      'hasIdCardDoc' => $hasId,
      'bankAccountUrl' => $hasBank
        ? '/identity-verifications/' . rawurlencode($row['id']) . '/bank'
        : null,
      'idCardUrl' => $hasId
        ? '/identity-verifications/' . rawurlencode($row['id']) . '/id-card'
        : null,
    ];
  }
}
