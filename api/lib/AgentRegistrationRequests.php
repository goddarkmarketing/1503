<?php
declare(strict_types=1);

final class AgentRegistrationRequests
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS agent_registration_requests (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  public static function listTeamMembers(PDO $pdo, string $parentAgentId): array
  {
    $stmt = $pdo->prepare(
      'SELECT a.*, u.name, u.email, u.phone, u.username, u.status AS user_status
       FROM agents a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.parent_id = :parent_id
       ORDER BY a.created_at ASC, a.code ASC'
    );
    $stmt->execute([':parent_id' => $parentAgentId]);
    return array_map(static function (array $row): array {
      $public = Agents::toPublic($row);
      $public['kind'] = 'agent';
      $public['userId'] = $row['username'] ?? $row['code'] ?? '';
      return $public;
    }, $stmt->fetchAll());
  }

  public static function listForAgent(PDO $pdo, string $agentId, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT r.*, ra.code AS requester_code, ru.name AS requester_name
            FROM agent_registration_requests r
            INNER JOIN agents ra ON ra.id = r.requester_agent_id
            INNER JOIN users ru ON ru.id = ra.user_id
            WHERE r.requester_agent_id = :agent_id';
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
    $sql = 'SELECT r.*, ra.code AS requester_code, ru.name AS requester_name
            FROM agent_registration_requests r
            INNER JOIN agents ra ON ra.id = r.requester_agent_id
            INNER JOIN users ru ON ru.id = ra.user_id
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
    return (int)$pdo->query("SELECT COUNT(*) FROM agent_registration_requests WHERE status = 'pending'")->fetchColumn();
  }

  public static function create(PDO $pdo, string $requesterAgentId, array $body, array $actor): array
  {
    self::ensureTable($pdo);
    $requester = Agents::fetchOne($pdo, $requesterAgentId);
    if (!$requester) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
      Response::error('กรุณากรอกชื่อ-นามสกุล', 422, 'VALIDATION');
    }

    $pending = $pdo->prepare(
      "SELECT id FROM agent_registration_requests
       WHERE requester_agent_id = :agent_id AND status = 'pending'
       LIMIT 1"
    );
    $pending->execute([':agent_id' => $requesterAgentId]);
    if ($pending->fetch()) {
      Response::error('มีคำขอเพิ่มตัวแทนที่รอแอดมินอยู่แล้ว กรุณารอดำเนินการก่อน', 422, 'VALIDATION');
    }

    $id = 'AR-' . strtoupper(bin2hex(random_bytes(4)));
    $phone = self::clean((string)($body['phone'] ?? ''), 64);
    $idCard = self::clean((string)($body['idCard'] ?? $body['id_card'] ?? ''), 32);
    $birthDate = self::clean((string)($body['birthDate'] ?? $body['birth_date'] ?? ''), 32);
    $email = self::clean((string)($body['email'] ?? ''), 190);
    $address = trim((string)($body['address'] ?? ''));

    $pdo->prepare(
      'INSERT INTO agent_registration_requests
        (id, requester_agent_id, name, phone, id_card, birth_date, email, address, status)
       VALUES
        (:id, :requester_agent_id, :name, :phone, :id_card, :birth_date, :email, :address, \'pending\')'
    )->execute([
      ':id' => $id,
      ':requester_agent_id' => $requesterAgentId,
      ':name' => $name,
      ':phone' => $phone !== '' ? $phone : null,
      ':id_card' => $idCard !== '' ? $idCard : null,
      ':birth_date' => $birthDate !== '' ? $birthDate : null,
      ':email' => $email !== '' ? $email : null,
      ':address' => $address !== '' ? $address : null,
    ]);

    Auth::audit(
      $pdo,
      'agent_registration_request',
      'ขอเพิ่มตัวแทน',
      $actor,
      ($requester['code'] ?? '') . ' ขอเพิ่ม ' . $name
    );

    $created = self::fetchPublic($pdo, $id) ?: ['id' => $id];
    $created['emailSent'] = self::notifyEmail($created);
    return $created;
  }

  public static function review(PDO $pdo, string $requestId, string $action, array $actor, array $body = []): array
  {
    self::ensureTable($pdo);
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

    $adminNote = trim((string)($body['adminNote'] ?? $body['note'] ?? ''));
    $createdAgentId = null;
    $code = '';

    if ($action === 'approve') {
      $code = trim((string)($body['code'] ?? ''));
      $password = (string)($body['password'] ?? '');
      if ($code === '') {
        Response::error('กรุณากำหนดรหัสนายหน้า', 422, 'VALIDATION');
      }
      if ($password === '') {
        Response::error('กรุณากำหนดรหัสผ่านเริ่มต้น', 422, 'VALIDATION');
      }

      $parentId = $body['parentId'] ?? $row['requester_agent_id'];
      if ($parentId === '') {
        $parentId = $row['requester_agent_id'];
      }

      $agentPayload = [
        'code' => $code,
        'name' => trim((string)($body['name'] ?? $row['name'] ?? '')),
        'password' => $password,
        'email' => trim((string)($body['email'] ?? $row['email'] ?? '')),
        'phone' => trim((string)($body['phone'] ?? $row['phone'] ?? '')),
        'initialBalance' => (float)($body['initialBalance'] ?? 0),
        'creditLimit' => (float)($body['creditLimit'] ?? 50000),
        'parentId' => $parentId,
      ];
      if (array_key_exists('featurePermissions', $body)) {
        $agentPayload['featurePermissions'] = $body['featurePermissions'];
      }
      if (array_key_exists('commissionRates', $body)) {
        $agentPayload['commissionRates'] = $body['commissionRates'];
      }

      $agent = Agents::create($pdo, $agentPayload, $actor);
      $createdAgentId = $agent['id'] ?? null;
    }

    $pdo->prepare(
      'UPDATE agent_registration_requests
       SET status = :status,
           created_agent_id = :created_agent_id,
           admin_note = :admin_note,
           reviewed_at = NOW(),
           reviewed_by = :reviewed_by,
           reviewed_by_name = :reviewed_by_name
       WHERE id = :id'
    )->execute([
      ':status' => $action === 'approve' ? 'approved' : 'rejected',
      ':created_agent_id' => $createdAgentId,
      ':admin_note' => $adminNote !== '' ? $adminNote : null,
      ':reviewed_by' => $actor['id'] ?? null,
      ':reviewed_by_name' => $actor['name'] ?? null,
      ':id' => $requestId,
    ]);

    Auth::audit(
      $pdo,
      'agent_registration_review',
      $action === 'approve' ? 'อนุมัติเพิ่มตัวแทน' : 'ปฏิเสธเพิ่มตัวแทน',
      $actor,
      ($row['requester_code'] ?? '') . ' / ' . ($row['name'] ?? '') . ' → ' . ($action === 'approve' ? $code : 'ปฏิเสธ')
    );

    $result = self::fetchPublic($pdo, $requestId) ?: ['id' => $requestId];
    if ($action === 'approve' && $createdAgentId) {
      $result['createdAgent'] = Agents::fetchOne($pdo, $createdAgentId);
    }
    return $result;
  }

  private static function notifyEmail(array $created): bool
  {
    $to = Mailer::agentRequestNotifyTo();
    $id = (string)($created['id'] ?? '');
    $requester = (string)($created['requesterCode'] ?? '');
    $html = Mailer::agentRegistrationRequestHtml($created);
    return Mailer::send($to, '[Kladee] คำขอเพิ่มตัวแทน ' . $id . ' จาก ' . $requester, $html);
  }

  private static function fetchPublic(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT r.*, ra.code AS requester_code, ru.name AS requester_name,
              ca.code AS created_agent_code
       FROM agent_registration_requests r
       INNER JOIN agents ra ON ra.id = r.requester_agent_id
       INNER JOIN users ru ON ru.id = ra.user_id
       LEFT JOIN agents ca ON ca.id = r.created_agent_id
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
      'SELECT r.*, ra.code AS requester_code
       FROM agent_registration_requests r
       INNER JOIN agents ra ON ra.id = r.requester_agent_id
       WHERE r.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function clean(string $value, int $maxLen): string
  {
    $value = trim($value);
    if ($value === '' || $value === '-') {
      return '';
    }
    if (mb_strlen($value) > $maxLen) {
      $value = mb_substr($value, 0, $maxLen);
    }
    return $value;
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
    $created = self::iso($row['created_at'] ?? '');
    $reviewed = self::iso($row['reviewed_at'] ?? '');
    return [
      'id' => $row['id'],
      'kind' => 'request',
      'requesterAgentId' => $row['requester_agent_id'],
      'requesterCode' => $row['requester_code'] ?? '',
      'requesterName' => $row['requester_name'] ?? '',
      'name' => $row['name'],
      'phone' => $row['phone'] ?? '',
      'idCard' => $row['id_card'] ?? '',
      'birthDate' => $row['birth_date'] ?? '',
      'email' => $row['email'] ?? '',
      'address' => $row['address'] ?? '',
      'status' => $row['status'],
      'createdAgentId' => $row['created_agent_id'] ?? null,
      'createdAgentCode' => $row['created_agent_code'] ?? null,
      'adminNote' => $row['admin_note'] ?? null,
      'createdAt' => $created,
      'reviewedAt' => $reviewed ?: null,
      'reviewedByName' => $row['reviewed_by_name'] ?? null,
    ];
  }
}
