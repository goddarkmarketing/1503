<?php
declare(strict_types=1);

final class Quotes
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS quotes (
        id VARCHAR(36) NOT NULL,
        agent_id VARCHAR(36) NOT NULL,
        agent_code VARCHAR(32) NOT NULL,
        insurer_code VARCHAR(32) NOT NULL,
        insurer_name VARCHAR(120) NOT NULL,
        product_id VARCHAR(64) NULL,
        product_name VARCHAR(190) NULL,
        plan_code VARCHAR(32) NULL,
        plan_label VARCHAR(64) NULL,
        status ENUM('open','converted','expired','cancelled') NOT NULL DEFAULT 'open',
        premium_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        customer_name VARCHAR(190) NULL,
        customer_phone VARCHAR(32) NULL,
        plate VARCHAR(64) NULL,
        vehicle_desc VARCHAR(255) NULL,
        coverage_start DATE NULL,
        coverage_end DATE NULL,
        valid_until DATE NULL,
        note VARCHAR(500) NULL,
        snapshot_json JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_quotes_agent (agent_id, created_at),
        KEY idx_quotes_status (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  /** @param array<string,mixed> $input */
  public static function create(PDO $pdo, array $agentRow, array $user, array $input): array
  {
    self::ensureTable($pdo);

    $premium = round((float)($input['premiumTotal'] ?? $input['premium_total'] ?? 0), 2);
    if ($premium <= 0) {
      Response::error('ไม่พบเบี้ยประกันสำหรับบันทึกใบเสนอราคา', 422, 'VALIDATION');
    }

    $customerName = trim((string)($input['customerName'] ?? $input['customer_name'] ?? ''));
    $customerPhone = trim((string)($input['customerPhone'] ?? $input['customer_phone'] ?? ''));
    $plate = trim((string)($input['licensePlate'] ?? $input['plate'] ?? ''));
    $note = trim((string)($input['note'] ?? ''));
    if (mb_strlen($note) > 500) {
      $note = mb_substr($note, 0, 500);
    }

    $validUntil = (new DateTimeImmutable('+15 days'))->format('Y-m-d');
    $snapshot = is_array($input['snapshot'] ?? null) ? $input['snapshot'] : [];
    $vehicleDesc = trim((string)($input['vehicleDesc'] ?? $snapshot['vehicle']['desc'] ?? ''));

    $ownTx = !$pdo->inTransaction();
    if ($ownTx) {
      $pdo->beginTransaction();
    }

    try {
      $id = self::insertWithId($pdo, $agentRow, [
        'premium' => $premium,
        'customerName' => $customerName,
        'customerPhone' => $customerPhone,
        'plate' => $plate,
        'vehicleDesc' => $vehicleDesc,
        'note' => $note,
        'validUntil' => $validUntil,
        'snapshot' => $snapshot,
        'input' => $input,
      ]);

      Auth::audit(
        $pdo,
        'quote_create',
        'สร้างใบเสนอราคา',
        ['id' => $user['id'], 'name' => $user['name'] ?? ''],
        "สร้าง {$id} แผน " . (string)($input['planLabel'] ?? $input['planCode'] ?? '') . ' เบี้ย ' . number_format($premium, 2)
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

    $quote = self::fetchOne($pdo, $id);
    return $quote ?: ['id' => $id];
  }

  public static function listForUser(PDO $pdo, array $user, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT q.*, u.name AS agent_name
            FROM quotes q
            INNER JOIN agents a ON a.id = q.agent_id
            INNER JOIN users u ON u.id = a.user_id
            WHERE 1=1';
    $params = [];

    if (($user['role'] ?? '') === 'agent') {
      $stmt = $pdo->prepare('SELECT id FROM agents WHERE user_id = :uid LIMIT 1');
      $stmt->execute([':uid' => $user['id']]);
      $agent = $stmt->fetch();
      if (!$agent) {
        return [];
      }
      $sql .= ' AND q.agent_id = :agent_id';
      $params[':agent_id'] = $agent['id'];
    } elseif (!empty($filters['agentId'])) {
      $sql .= ' AND q.agent_id = :agent_id';
      $params[':agent_id'] = $filters['agentId'];
    }

    $sql .= ' ORDER BY q.created_at DESC, q.id DESC LIMIT 100';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function fetchOne(PDO $pdo, string $id): ?array
  {
    self::ensureTable($pdo);
    $stmt = $pdo->prepare(
      'SELECT q.*, u.name AS agent_name
       FROM quotes q
       LEFT JOIN agents a ON a.id = q.agent_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE q.id = :id
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  /** @param array<string,mixed> $row */
  public static function toPublic(array $row): array
  {
    $snapshot = [];
    if (!empty($row['snapshot_json'])) {
      $decoded = json_decode((string)$row['snapshot_json'], true);
      if (is_array($decoded)) {
        $snapshot = $decoded;
      }
    }

    return [
      'id' => $row['id'],
      'agentId' => $row['agent_id'],
      'agentCode' => $row['agent_code'],
      'agentName' => $row['agent_name'] ?? null,
      'insurer' => $row['insurer_name'],
      'insurerCode' => $row['insurer_code'],
      'productId' => $row['product_id'],
      'productName' => $row['product_name'],
      'planCode' => $row['plan_code'],
      'planLabel' => $row['plan_label'],
      'status' => $row['status'],
      'premium' => (float)$row['premium_total'],
      'premiumTotal' => (float)$row['premium_total'],
      'customerName' => $row['customer_name'],
      'customerPhone' => $row['customer_phone'],
      'plate' => $row['plate'],
      'licensePlate' => $row['plate'],
      'vehicleDesc' => $row['vehicle_desc'],
      'coverageStart' => $row['coverage_start'],
      'coverageEnd' => $row['coverage_end'],
      'validUntil' => $row['valid_until'],
      'note' => $row['note'],
      'snapshot' => $snapshot,
      'createdAt' => $row['created_at'],
    ];
  }

  /** @param array<string,mixed> $data */
  private static function insertWithId(PDO $pdo, array $agentRow, array $data): string
  {
    $input = is_array($data['input'] ?? null) ? $data['input'] : [];
    $sql = 'INSERT INTO quotes
      (id, agent_id, agent_code, insurer_code, insurer_name, product_id, product_name,
       plan_code, plan_label, status, premium_total, customer_name, customer_phone, plate,
       vehicle_desc, coverage_start, coverage_end, valid_until, note, snapshot_json)
     VALUES
      (:id, :agent_id, :agent_code, :insurer_code, :insurer_name, :product_id, :product_name,
       :plan_code, :plan_label, :status, :premium_total, :customer_name, :customer_phone, :plate,
       :vehicle_desc, :coverage_start, :coverage_end, :valid_until, :note, :snapshot_json)';
    $stmt = $pdo->prepare($sql);

    for ($i = 0; $i < 8; $i++) {
      $id = 'QT-' . date('Y') . '-' . str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
      try {
        $stmt->execute([
          ':id' => $id,
          ':agent_id' => (string)$agentRow['id'],
          ':agent_code' => (string)$agentRow['code'],
          ':insurer_code' => (string)($input['insurerCode'] ?? 'bki'),
          ':insurer_name' => (string)($input['insurer'] ?? 'BKI กรุงเทพ'),
          ':product_id' => (string)($input['productId'] ?? 'voluntary-bki'),
          ':product_name' => (string)($input['productName'] ?? '2+ / 3+'),
          ':plan_code' => (string)($input['planCode'] ?? $input['coverType'] ?? ''),
          ':plan_label' => (string)($input['planLabel'] ?? ''),
          ':status' => 'open',
          ':premium_total' => $data['premium'],
          ':customer_name' => $data['customerName'] !== '' ? $data['customerName'] : null,
          ':customer_phone' => $data['customerPhone'] !== '' ? $data['customerPhone'] : null,
          ':plate' => $data['plate'] !== '' ? $data['plate'] : null,
          ':vehicle_desc' => $data['vehicleDesc'] !== '' ? $data['vehicleDesc'] : null,
          ':coverage_start' => self::sqlDate($input['coverageStart'] ?? $input['coverage_start'] ?? null),
          ':coverage_end' => self::sqlDate($input['coverageEnd'] ?? $input['coverage_end'] ?? null),
          ':valid_until' => $data['validUntil'],
          ':note' => $data['note'] !== '' ? $data['note'] : null,
          ':snapshot_json' => self::jsonOrNull($data['snapshot']),
        ]);
        return $id;
      } catch (PDOException $e) {
        if ((string)$e->getCode() !== '23000' || $i === 7) {
          throw $e;
        }
      }
    }

    throw new RuntimeException('ไม่สามารถสร้างเลขใบเสนอราคาได้');
  }

  private static function sqlDate($value): ?string
  {
    $value = trim((string)$value);
    if ($value === '') {
      return null;
    }
    if (preg_match('#^(\d{4})-(\d{2})-(\d{2})$#', $value)) {
      return $value;
    }
    if (preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', $value, $m)) {
      return $m[3] . '-' . $m[2] . '-' . $m[1];
    }
    return null;
  }

  /** @param mixed $value */
  private static function jsonOrNull($value): ?string
  {
    if ($value === null) {
      return null;
    }
    if (is_string($value)) {
      return $value;
    }
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }
}
