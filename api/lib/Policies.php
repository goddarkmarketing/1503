<?php
declare(strict_types=1);

final class Policies
{
  public static function ensureTable(PDO $pdo): void
  {
    if ($pdo->inTransaction()) {
      return;
    }
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS policies (
        id VARCHAR(36) NOT NULL,
        agent_id VARCHAR(36) NOT NULL,
        agent_code VARCHAR(32) NOT NULL,
        insurer_code VARCHAR(32) NOT NULL,
        insurer_name VARCHAR(120) NOT NULL,
        product_id VARCHAR(64) NULL,
        product_name VARCHAR(190) NULL,
        type VARCHAR(32) NOT NULL,
        type_label VARCHAR(64) NOT NULL,
        plan_code VARCHAR(32) NULL,
        status ENUM('active','pending','failed','cancelled') NOT NULL DEFAULT 'active',
        premium_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        plate VARCHAR(64) NULL,
        insured_name VARCHAR(190) NULL,
        coverage_start DATE NULL,
        coverage_end DATE NULL,
        bki_policy_no VARCHAR(64) NULL,
        bki_agent_ref VARCHAR(64) NULL,
        external_status VARCHAR(64) NULL,
        external_message VARCHAR(500) NULL,
        request_json JSON NULL,
        response_json JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_policies_agent (agent_id, created_at),
        KEY idx_policies_status (status, created_at),
        KEY idx_policies_plate (plate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
  }

  /** @return array{agent:array,user:array} */
  public static function requireAgent(PDO $pdo, array $user): array
  {
    if (($user['role'] ?? '') !== 'agent') {
      Response::error('เฉพาะนายหน้าเท่านั้น', 403, 'FORBIDDEN');
    }
    $stmt = $pdo->prepare('SELECT * FROM agents WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => $user['id']]);
    $agent = $stmt->fetch();
    if (!$agent) {
      Response::error('ไม่พบข้อมูลนายหน้า', 404, 'NOT_FOUND');
    }
    return ['agent' => $agent, 'user' => $user];
  }

  /** @param array<string,mixed> $input */
  public static function create(PDO $pdo, array $agentRow, array $user, array $input): array
  {
    self::ensureTable($pdo);
    CreditLedger::ensureTable($pdo);

    $premium = round((float)($input['premiumTotal'] ?? $input['premium_total'] ?? 0), 2);
    if ($premium <= 0) {
      Response::error('ไม่พบเบี้ยประกันสำหรับบันทึกกรมธรรม์', 422, 'VALIDATION');
    }

    $agentId = (string)$agentRow['id'];
    $prevBalance = (float)$agentRow['balance'];
    if ($prevBalance < $premium) {
      Response::error('วงเงินคงเหลือไม่เพียงพอ', 422, 'INSUFFICIENT_BALANCE');
    }

    $firstName = trim((string)($input['firstName'] ?? ''));
    $lastName = trim((string)($input['lastName'] ?? ''));
    $insuredName = trim((string)($input['insuredName'] ?? ''));
    if ($insuredName === '') {
      $insuredName = trim($firstName . ' ' . $lastName);
    }

    $num = random_int(1000, 9999);
    $id = 'POL-' . date('Y') . '-' . $num;
    $nextBalance = round($prevBalance - $premium, 2);

    $actor = ['id' => $user['id'], 'name' => $user['name'] ?? ''];
    $note = 'ออกกรมธรรม์ ' . ($input['productName'] ?? $input['typeLabel'] ?? 'motor');

    $ownTx = !$pdo->inTransaction();
    if ($ownTx) {
      $pdo->beginTransaction();
    }

    try {
      $stmt = $pdo->prepare(
        'INSERT INTO policies
          (id, agent_id, agent_code, insurer_code, insurer_name, product_id, product_name,
           type, type_label, plan_code, status, premium_total, plate, insured_name,
           coverage_start, coverage_end, bki_policy_no, bki_agent_ref,
           external_status, external_message, request_json, response_json)
         VALUES
          (:id, :agent_id, :agent_code, :insurer_code, :insurer_name, :product_id, :product_name,
           :type, :type_label, :plan_code, :status, :premium_total, :plate, :insured_name,
           :coverage_start, :coverage_end, :bki_policy_no, :bki_agent_ref,
           :external_status, :external_message, :request_json, :response_json)'
      );
      $stmt->execute([
        ':id' => $id,
        ':agent_id' => $agentId,
        ':agent_code' => (string)$agentRow['code'],
        ':insurer_code' => (string)($input['insurerCode'] ?? 'bki'),
        ':insurer_name' => (string)($input['insurer'] ?? 'BKI กรุงเทพ'),
        ':product_id' => (string)($input['productId'] ?? 'voluntary-bki'),
        ':product_name' => (string)($input['productName'] ?? '2+ / 3+'),
        ':type' => (string)($input['type'] ?? 'voluntary'),
        ':type_label' => (string)($input['typeLabel'] ?? '2+ / 3+'),
        ':plan_code' => (string)($input['planCode'] ?? $input['coverType'] ?? ''),
        ':status' => (string)($input['status'] ?? 'active'),
        ':premium_total' => $premium,
        ':plate' => (string)($input['licensePlate'] ?? '-'),
        ':insured_name' => $insuredName !== '' ? $insuredName : '-',
        ':coverage_start' => self::sqlDate($input['coverageStart'] ?? $input['coverage_start'] ?? null),
        ':coverage_end' => self::sqlDate($input['coverageEnd'] ?? $input['coverage_end'] ?? null),
        ':bki_policy_no' => (string)($input['bkiPolicyNo'] ?? $input['bki_policy_no'] ?? ''),
        ':bki_agent_ref' => (string)($input['bkiAgentRef'] ?? $input['agent_ref_no'] ?? ''),
        ':external_status' => (string)($input['externalStatus'] ?? ''),
        ':external_message' => (string)($input['externalMessage'] ?? ''),
        ':request_json' => self::jsonOrNull($input['requestJson'] ?? null),
        ':response_json' => self::jsonOrNull($input['responseJson'] ?? null),
      ]);

      $pdo->prepare('UPDATE agents SET balance = :balance WHERE id = :id')
        ->execute([':balance' => $nextBalance, ':id' => $agentId]);

      CreditLedger::record($pdo, $agentId, -$premium, $nextBalance, $note, $actor);

      Auth::audit(
        $pdo,
        'policy_issue',
        'ออกกรมธรรม์',
        $actor,
        "ออก {$id} ทะเบียน " . (string)($input['licensePlate'] ?? '-') . ' เบี้ย ' . number_format($premium, 2)
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

    $policy = self::fetchOne($pdo, $id);
    return $policy ?: ['id' => $id];
  }

  public static function listForUser(PDO $pdo, array $user, array $filters = []): array
  {
    self::ensureTable($pdo);
    $sql = 'SELECT p.*, u.name AS agent_name
            FROM policies p
            INNER JOIN agents a ON a.id = p.agent_id
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
      $sql .= ' AND p.agent_id = :agent_id';
      $params[':agent_id'] = $agent['id'];
    } elseif (!empty($filters['agentId'])) {
      $sql .= ' AND p.agent_id = :agent_id';
      $params[':agent_id'] = $filters['agentId'];
    }

    if (!empty($filters['date'])) {
      $sql .= ' AND DATE(p.created_at) = :date';
      $params[':date'] = $filters['date'];
    }
    if (!empty($filters['status'])) {
      $sql .= ' AND p.status = :status';
      $params[':status'] = $filters['status'];
    }

    $sql .= ' ORDER BY p.created_at DESC, p.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map([self::class, 'toPublic'], $stmt->fetchAll());
  }

  public static function fetchOne(PDO $pdo, string $id): ?array
  {
    self::ensureTable($pdo);
    $stmt = $pdo->prepare('SELECT * FROM policies WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  /** @param array<string,mixed> $row */
  public static function toPublic(array $row): array
  {
    return [
      'id' => $row['id'],
      'agentId' => $row['agent_id'],
      'agentCode' => $row['agent_code'],
      'insurer' => $row['insurer_name'],
      'insurerCode' => $row['insurer_code'],
      'productId' => $row['product_id'],
      'productName' => $row['product_name'],
      'type' => $row['type'],
      'typeLabel' => $row['type_label'],
      'planCode' => $row['plan_code'],
      'status' => $row['status'],
      'premium' => (float)$row['premium_total'],
      'premiumTotal' => (float)$row['premium_total'],
      'plate' => $row['plate'],
      'licensePlate' => $row['plate'],
      'insuredName' => $row['insured_name'],
      'issuedAt' => substr((string)$row['created_at'], 0, 10),
      'expiresAt' => $row['coverage_end'],
      'coverageStart' => $row['coverage_start'],
      'coverageEnd' => $row['coverage_end'],
      'bkiPolicyNo' => $row['bki_policy_no'],
      'bkiAgentRef' => $row['bki_agent_ref'],
      'externalStatus' => $row['external_status'],
      'externalMessage' => $row['external_message'],
      'createdAt' => $row['created_at'],
    ];
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
