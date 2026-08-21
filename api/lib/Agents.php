<?php
declare(strict_types=1);

final class Agents
{
  public const TEAM_MEMBER_LIMIT = 2;

  public static function assertParentHasSlot(PDO $pdo, string $parentId, ?string $exceptAgentId = null): void
  {
    $sql = 'SELECT COUNT(*) FROM agents WHERE parent_id = :parent_id';
    $params = [':parent_id' => $parentId];
    if ($exceptAgentId) {
      $sql .= ' AND id <> :except_id';
      $params[':except_id'] = $exceptAgentId;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ((int)$stmt->fetchColumn() >= self::TEAM_MEMBER_LIMIT) {
      Response::error('หัวทีมนี้มีลูกทีมครบ ' . self::TEAM_MEMBER_LIMIT . ' คนแล้ว', 422, 'TEAM_FULL');
    }
  }

  public static function fetchAll(PDO $pdo): array
  {
    $sql = 'SELECT a.*, u.name, u.email, u.phone, u.username, u.status AS user_status
            FROM agents a
            INNER JOIN users u ON u.id = a.user_id
            ORDER BY a.created_at ASC, a.code ASC';
    return array_map([self::class, 'toPublic'], $pdo->query($sql)->fetchAll());
  }

  public static function fetchOne(PDO $pdo, string $agentId): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT a.*, u.name, u.email, u.phone, u.username, u.status AS user_status
       FROM agents a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $agentId]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  public static function ensureDemoAccounts(PDO $pdo): void
  {
    $stmt = $pdo->query(
      "SELECT code FROM agents WHERE code IN ('Ck1-039','Ag2-112','Ag3-205')"
    );
    $have = [];
    foreach ($stmt->fetchAll() as $row) {
      $have[$row['code']] = true;
    }
    if (isset($have['Ck1-039'], $have['Ag2-112'], $have['Ag3-205'])) {
      return;
    }

    $adminStmt = $pdo->query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (!$adminStmt->fetch()) {
      $pdo->prepare(
        'INSERT INTO users (id, username, password_hash, role, name, email, phone, initials, status)
         VALUES (\'admin-001\', \'admin\', :hash, \'admin\', \'ผู้ดูแลระบบ\', \'admin@kladeebroker.co.th\', \'02-000-0000\', \'AD\', \'active\')'
      )->execute([':hash' => password_hash('demo', PASSWORD_DEFAULT)]);
    }

    $hash = password_hash('demo', PASSWORD_DEFAULT);
    $ckRates = [
      'categories' => ['compulsory' => 15, 'voluntary' => 12, 'pa' => 10, 'travel' => 10],
      'products' => [
        'compulsory-indara' => 15, 'compulsory-axa' => 12, 'compulsory-bki' => 12,
        'compulsory-chubb' => 15, 'compulsory-ergo' => 14,
        'voluntary-indara' => 12, 'voluntary-axa' => 12, 'voluntary-bki' => 12, 'voluntary-chubb' => 15,
        'pa-axa' => 10, 'pa-bki' => 10, 'travel-axa' => 10, 'travel-bki' => 10,
      ],
      'taxWithhold' => [
        'compulsory-indara' => 3, 'compulsory-axa' => 3, 'compulsory-bki' => 3,
        'compulsory-chubb' => 3, 'compulsory-ergo' => 3,
        'voluntary-indara' => 3, 'voluntary-axa' => 3, 'voluntary-bki' => 3, 'voluntary-chubb' => 3,
        'pa-axa' => 3, 'pa-bki' => 3, 'travel-axa' => 3, 'travel-bki' => 3,
      ],
      'taxWithholdEnabled' => [
        'compulsory-indara' => true, 'compulsory-axa' => true, 'compulsory-bki' => true,
        'compulsory-chubb' => true, 'compulsory-ergo' => false,
        'voluntary-indara' => true, 'voluntary-axa' => true, 'voluntary-bki' => true, 'voluntary-chubb' => true,
        'pa-axa' => true, 'pa-bki' => true, 'travel-axa' => true, 'travel-bki' => true,
      ],
    ];

    $demos = [
      [
        'id' => 'agent-001',
        'code' => 'Ck1-039',
        'name' => 'สมชาย ใจดี',
        'email' => 'ck1039@example.com',
        'phone' => '081-234-5678',
        'initials' => 'CK',
        'balance' => 34531.73,
        'creditLimit' => 50000,
        'parentCode' => null,
        'featurePermissions' => null,
        'commissionRates' => $ckRates,
      ],
      [
        'id' => 'agent-002',
        'code' => 'Ag2-112',
        'name' => 'วิไล รักษ์ดี (ทดลองจำกัดสิทธิ์)',
        'email' => 'ag2112@example.com',
        'phone' => '082-345-6789',
        'initials' => 'WR',
        'balance' => 12890.50,
        'creditLimit' => 30000,
        'parentCode' => 'Ck1-039',
        'featurePermissions' => [
          'receipt-issue' => false,
          'receipt-inquiry' => false,
          'reports-monthly' => false,
          'compulsory-bki' => false,
          'travel-axa' => false,
        ],
        'commissionRates' => ['indara' => 10, 'axa' => 10, 'bki' => 10, 'chubb' => 12, 'ergo' => 12],
      ],
      [
        'id' => 'agent-003',
        'code' => 'Ag3-205',
        'name' => 'ประเสริฐ มั่นคง (ทดลอง)',
        'email' => 'ag3205@example.com',
        'phone' => '089-111-2233',
        'initials' => 'PT',
        'balance' => 5200.00,
        'creditLimit' => 20000,
        'parentCode' => 'Ck1-039',
        'featurePermissions' => [
          'receipt-issue' => true,
          'receipt-inquiry' => true,
          'receipt-summary' => false,
          'receipt-detail' => false,
          'reports-daily-policies' => false,
          'reports-daily-summary' => true,
          'reports-monthly' => false,
          'reports-team' => false,
          'commission' => false,
          'credit' => true,
        ],
        'commissionRates' => ['indara' => 12, 'axa' => 11, 'bki' => 11, 'chubb' => 13, 'ergo' => 13],
      ],
    ];

    foreach ($demos as $demo) {
      if (isset($have[$demo['code']])) {
        continue;
      }
      $taken = $pdo->prepare('SELECT id FROM users WHERE username = :username OR id = :id LIMIT 1');
      $taken->execute([':username' => $demo['code'], ':id' => $demo['id']]);
      if ($taken->fetch()) {
        continue;
      }

      $parentId = null;
      if ($demo['parentCode']) {
        $parent = $pdo->prepare('SELECT id FROM agents WHERE code = :code LIMIT 1');
        $parent->execute([':code' => $demo['parentCode']]);
        $parentRow = $parent->fetch();
        $parentId = $parentRow['id'] ?? null;
      }

      $pdo->prepare(
        'INSERT INTO users (id, username, password_hash, role, name, email, phone, initials, status)
         VALUES (:id, :username, :password_hash, \'agent\', :name, :email, :phone, :initials, \'active\')'
      )->execute([
        ':id' => $demo['id'],
        ':username' => $demo['code'],
        ':password_hash' => $hash,
        ':name' => $demo['name'],
        ':email' => $demo['email'],
        ':phone' => $demo['phone'],
        ':initials' => $demo['initials'],
      ]);

      $pdo->prepare(
        'INSERT INTO agents (id, user_id, code, balance, credit_limit, parent_id, feature_permissions, commission_rates, status)
         VALUES (:id, :user_id, :code, :balance, :credit_limit, :parent_id, :feature_permissions, :commission_rates, \'active\')'
      )->execute([
        ':id' => $demo['id'],
        ':user_id' => $demo['id'],
        ':code' => $demo['code'],
        ':balance' => $demo['balance'],
        ':credit_limit' => $demo['creditLimit'],
        ':parent_id' => $parentId,
        ':feature_permissions' => $demo['featurePermissions'] === null
          ? null
          : json_encode($demo['featurePermissions'], JSON_UNESCAPED_UNICODE),
        ':commission_rates' => json_encode($demo['commissionRates'], JSON_UNESCAPED_UNICODE),
      ]);
    }
  }

  public static function toPublic(array $row): array
  {
    return [
      'id' => $row['id'],
      'code' => $row['code'],
      'name' => $row['name'],
      'email' => $row['email'] ?? '',
      'phone' => $row['phone'] ?? '',
      'balance' => (float)$row['balance'],
      'creditLimit' => (float)$row['credit_limit'],
      'status' => $row['status'],
      'createdAt' => substr((string)$row['created_at'], 0, 10),
      'parentId' => $row['parent_id'],
      'featurePermissions' => self::decodeJson($row['feature_permissions'] ?? null),
      'commissionRates' => self::decodeJson($row['commission_rates'] ?? null),
    ];
  }

  public static function create(PDO $pdo, array $body, ?array $actor): array
  {
    $code = trim((string)($body['code'] ?? ''));
    $name = trim((string)($body['name'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $email = trim((string)($body['email'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));
    $initialBalance = (float)($body['initialBalance'] ?? 0);
    $creditLimit = (float)($body['creditLimit'] ?? 50000);
    $parentId = $body['parentId'] ?? null;
    if ($parentId === '') {
      $parentId = null;
    }

    if ($code === '' || $name === '') {
      Response::error('กรุณากรอกรหัสและชื่อนายหน้า', 422, 'VALIDATION');
    }
    if ($password === '') {
      Response::error('กรุณากำหนดรหัสผ่านเริ่มต้น', 422, 'VALIDATION');
    }

    $exists = $pdo->prepare('SELECT id FROM agents WHERE code = :code LIMIT 1');
    $exists->execute([':code' => $code]);
    if ($exists->fetch()) {
      Response::error('รหัสนายหน้านี้มีอยู่แล้ว', 409, 'DUPLICATE');
    }

    $userExists = $pdo->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
    $userExists->execute([':username' => $code]);
    if ($userExists->fetch()) {
      Response::error('ชื่อผู้ใช้นี้มีอยู่แล้ว', 409, 'DUPLICATE');
    }

    if ($parentId !== null) {
      $parent = $pdo->prepare('SELECT id FROM agents WHERE id = :id LIMIT 1');
      $parent->execute([':id' => $parentId]);
      if (!$parent->fetch()) {
        Response::error('ไม่พบหัวหน้าทีมที่เลือก', 422, 'VALIDATION');
      }
      self::assertParentHasSlot($pdo, (string)$parentId);
    }

    $id = 'agent-' . bin2hex(random_bytes(6));
    $initials = self::initialsFromName($name);
    $featurePermissions = array_key_exists('featurePermissions', $body)
      ? json_encode($body['featurePermissions'], JSON_UNESCAPED_UNICODE)
      : null;
    $commissionRates = array_key_exists('commissionRates', $body)
      ? json_encode($body['commissionRates'], JSON_UNESCAPED_UNICODE)
      : null;

    CreditLedger::ensureTable($pdo);

    $pdo->beginTransaction();
    try {
      $pdo->prepare(
        'INSERT INTO users (id, username, password_hash, role, name, email, phone, initials, status)
         VALUES (:id, :username, :password_hash, \'agent\', :name, :email, :phone, :initials, \'active\')'
      )->execute([
        ':id' => $id,
        ':username' => $code,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':name' => $name,
        ':email' => $email !== '' ? $email : null,
        ':phone' => $phone !== '' ? $phone : null,
        ':initials' => $initials,
      ]);

      $pdo->prepare(
        'INSERT INTO agents (id, user_id, code, balance, credit_limit, parent_id, feature_permissions, commission_rates, status)
         VALUES (:id, :user_id, :code, :balance, :credit_limit, :parent_id, :feature_permissions, :commission_rates, \'active\')'
      )->execute([
        ':id' => $id,
        ':user_id' => $id,
        ':code' => $code,
        ':balance' => $initialBalance,
        ':credit_limit' => $creditLimit,
        ':parent_id' => $parentId,
        ':feature_permissions' => $featurePermissions,
        ':commission_rates' => $commissionRates,
      ]);

      if ($initialBalance > 0) {
        CreditLedger::record(
          $pdo,
          $id,
          $initialBalance,
          $initialBalance,
          'วงเงินเริ่มต้น',
          $actor
        );
      }

      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    Auth::audit($pdo, 'agent_create', 'เพิ่มนายหน้า', $actor, "สร้างบัญชี {$code} — {$name}");

    $agent = self::fetchOne($pdo, $id);
    if (!$agent) {
      throw new RuntimeException('Created agent not found');
    }
    return $agent;
  }

  public static function update(PDO $pdo, string $agentId, array $body, ?array $actor): array
  {
    $agentRow = self::rawAgent($pdo, $agentId);
    if (!$agentRow) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    $userFields = [];
    $userParams = [':id' => $agentRow['user_id']];
    $agentFields = [];
    $agentParams = [':id' => $agentId];

    if (array_key_exists('name', $body)) {
      $userFields[] = 'name = :name';
      $userParams[':name'] = trim((string)$body['name']);
    }
    if (array_key_exists('email', $body)) {
      $email = trim((string)$body['email']);
      $userFields[] = 'email = :email';
      $userParams[':email'] = $email !== '' ? $email : null;
    }
    if (array_key_exists('phone', $body)) {
      $phone = trim((string)$body['phone']);
      $userFields[] = 'phone = :phone';
      $userParams[':phone'] = $phone !== '' ? $phone : null;
    }
    if (!empty($body['password'])) {
      $userFields[] = 'password_hash = :password_hash';
      $userParams[':password_hash'] = password_hash((string)$body['password'], PASSWORD_DEFAULT);
    }

    if (array_key_exists('creditLimit', $body)) {
      $agentFields[] = 'credit_limit = :credit_limit';
      $agentParams[':credit_limit'] = (float)$body['creditLimit'];
    }
    if (array_key_exists('balance', $body)) {
      $agentFields[] = 'balance = :balance';
      $agentParams[':balance'] = (float)$body['balance'];
    }
    if (array_key_exists('featurePermissions', $body)) {
      $agentFields[] = 'feature_permissions = :feature_permissions';
      $agentParams[':feature_permissions'] = $body['featurePermissions'] === null
        ? null
        : json_encode($body['featurePermissions'], JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('commissionRates', $body)) {
      $agentFields[] = 'commission_rates = :commission_rates';
      $agentParams[':commission_rates'] = $body['commissionRates'] === null
        ? null
        : json_encode($body['commissionRates'], JSON_UNESCAPED_UNICODE);
    }
    if (array_key_exists('parentId', $body)) {
      $parentId = $body['parentId'] ?: null;
      if ($parentId === $agentId) {
        Response::error('ไม่สามารถตั้งหัวหน้าเป็นตัวเองได้', 422, 'VALIDATION');
      }
      if ($parentId !== null) {
        $parent = $pdo->prepare('SELECT id FROM agents WHERE id = :id LIMIT 1');
        $parent->execute([':id' => $parentId]);
        if (!$parent->fetch()) {
          Response::error('ไม่พบหัวหน้าทีมที่เลือก', 422, 'VALIDATION');
        }
        self::assertParentHasSlot($pdo, (string)$parentId, $agentId);
      }
      $agentFields[] = 'parent_id = :parent_id';
      $agentParams[':parent_id'] = $parentId;
    }

    $pdo->beginTransaction();
    try {
      if ($userFields) {
        $pdo->prepare('UPDATE users SET ' . implode(', ', $userFields) . ' WHERE id = :id')
          ->execute($userParams);
      }
      if ($agentFields) {
        $pdo->prepare('UPDATE agents SET ' . implode(', ', $agentFields) . ' WHERE id = :id')
          ->execute($agentParams);
      }
      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    if (!empty($body['password'])) {
      Auth::audit($pdo, 'password_reset', 'ตั้งรหัสผ่านนายหน้า', $actor, 'แอดมินตั้งรหัสผ่าน ' . $agentRow['code']);
    }
    if (array_key_exists('featurePermissions', $body)) {
      Auth::audit($pdo, 'agent_permissions', 'กำหนดสิทธิ์นายหน้า', $actor, 'อัปเดตสิทธิ์ฟังก์ชัน ' . $agentRow['code']);
    }
    if (array_key_exists('commissionRates', $body)) {
      Auth::audit($pdo, 'agent_commission_rates', 'กำหนดอัตราคอมมิชชัน', $actor, 'อัปเดต % คอมมิชชันของ ' . $agentRow['code']);
    }
    if (array_key_exists('parentId', $body)) {
      $parentCode = 'ไม่มี (หัวทีม)';
      if (!empty($body['parentId'])) {
        $p = self::fetchOne($pdo, (string)$body['parentId']);
        $parentCode = $p['code'] ?? $parentCode;
      }
      Auth::audit($pdo, 'agent_team', 'ตั้งค่าทีม', $actor, $agentRow['code'] . ' → หัวหน้า ' . $parentCode);
    }

    $agent = self::fetchOne($pdo, $agentId);
    if (!$agent) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }
    return $agent;
  }

  public static function setStatus(PDO $pdo, string $agentId, string $status, ?array $actor): array
  {
    if (!in_array($status, ['active', 'inactive'], true)) {
      Response::error('สถานะไม่ถูกต้อง', 422, 'VALIDATION');
    }
    $agentRow = self::rawAgent($pdo, $agentId);
    if (!$agentRow) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    $pdo->beginTransaction();
    try {
      $pdo->prepare('UPDATE agents SET status = :status WHERE id = :id')
        ->execute([':status' => $status, ':id' => $agentId]);
      $pdo->prepare('UPDATE users SET status = :status WHERE id = :id')
        ->execute([':status' => $status, ':id' => $agentRow['user_id']]);
      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    Auth::audit(
      $pdo,
      'agent_status',
      'เปลี่ยนสถานะนายหน้า',
      $actor,
      ($status === 'active' ? 'เปิดใช้' : 'ระงับ') . 'บัญชี ' . $agentRow['code']
    );

    $agent = self::fetchOne($pdo, $agentId);
    if (!$agent) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }
    return $agent;
  }

  public static function adjustBalance(PDO $pdo, string $agentId, float $amount, string $note, ?array $actor, array $slip = []): array
  {
    $agentRow = self::rawAgent($pdo, $agentId);
    if (!$agentRow) {
      Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
    }

    if ($amount < 0 && empty($slip['dataUrl']) && empty($slip['slipDataUrl'])) {
      Response::error('กรุณาแนบหลักฐานการโอนเงิน', 422, 'VALIDATION');
    }
    if ($amount < 0 && $note === '') {
      $note = 'โอนเงินให้นายหน้า';
    }

    CreditLedger::ensureTable($pdo);

    $prev = (float)$agentRow['balance'];
    $next = max(0, round($prev + $amount, 2));

    $ownTx = !$pdo->inTransaction();
    if ($ownTx) {
      $pdo->beginTransaction();
    }
    try {
      $pdo->prepare('UPDATE agents SET balance = :balance WHERE id = :id')
        ->execute([':balance' => $next, ':id' => $agentId]);

      $entry = CreditLedger::record($pdo, $agentId, $amount, $next, $note, $actor, $slip);

      Auth::audit(
        $pdo,
        'balance_adjust',
        $amount >= 0 ? 'ปรับวงเงิน' : 'โอนเงินให้นายหน้า',
        $actor,
        ($amount >= 0 ? 'เติม' : 'หัก') . ' ' . $agentRow['code'] . ' ' .
        ($amount >= 0 ? '+' : '') . number_format($amount, 2) .
        ' บาท (ยอดก่อน ' . number_format($prev, 2) . ')' .
        ($note !== '' ? " — {$note}" : '')
      );

      if ($ownTx) {
        $pdo->commit();
      }
    } catch (Throwable $e) {
      if ($ownTx && $pdo->inTransaction()) {
        $pdo->rollBack();
      }
      throw $e;
    }

    return [
      'agentId' => $agentId,
      'balance' => $next,
      'adjustment' => $amount,
      'note' => $note,
      'currency' => 'THB',
      'ledger' => $entry,
    ];
  }

  private static function rawAgent(PDO $pdo, string $agentId): ?array
  {
    $stmt = $pdo->prepare('SELECT * FROM agents WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $agentId]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function decodeJson($value): ?array
  {
    if ($value === null || $value === '') {
      return null;
    }
    if (is_array($value)) {
      return $value;
    }
    $decoded = json_decode((string)$value, true);
    return is_array($decoded) ? $decoded : null;
  }

  private static function initialsFromName(string $name): string
  {
    $parts = preg_split('/\s+/u', trim($name)) ?: [];
    $chars = '';
    foreach ($parts as $part) {
      if ($part === '') {
        continue;
      }
      $chars .= mb_substr($part, 0, 1, 'UTF-8');
      if (mb_strlen($chars, 'UTF-8') >= 2) {
        break;
      }
    }
    if ($chars === '') {
      return 'AG';
    }
    return mb_strtoupper($chars, 'UTF-8');
  }
}
