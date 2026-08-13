<?php
declare(strict_types=1);

final class AdminUsers
{
  public static function fetchAll(PDO $pdo): array
  {
    $sql = 'SELECT id, username, name, email, phone, initials, status, created_at, updated_at
            FROM users
            WHERE role = \'admin\'
            ORDER BY created_at ASC, username ASC';
    return array_map([self::class, 'toPublic'], $pdo->query($sql)->fetchAll());
  }

  public static function fetchOne(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare(
      'SELECT id, username, name, email, phone, initials, status, created_at, updated_at
       FROM users
       WHERE id = :id AND role = \'admin\'
       LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? self::toPublic($row) : null;
  }

  public static function toPublic(array $row): array
  {
    return [
      'id' => $row['id'],
      'username' => $row['username'],
      'name' => $row['name'],
      'email' => $row['email'] ?? '',
      'phone' => $row['phone'] ?? '',
      'initials' => $row['initials'] ?? 'AD',
      'role' => 'admin',
      'roleLabel' => 'ผู้ดูแลระบบ',
      'status' => $row['status'],
      'createdAt' => substr((string)($row['created_at'] ?? ''), 0, 10),
    ];
  }

  public static function create(PDO $pdo, array $body, ?array $actor): array
  {
    $username = trim((string)($body['username'] ?? ''));
    $name = trim((string)($body['name'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $email = trim((string)($body['email'] ?? ''));
    $phone = trim((string)($body['phone'] ?? ''));

    if ($username === '' || $name === '') {
      Response::error('กรุณากรอกชื่อผู้ใช้และชื่อผู้ดูแล', 422, 'VALIDATION');
    }
    if ($password === '') {
      Response::error('กรุณากำหนดรหัสผ่าน', 422, 'VALIDATION');
    }
    if (mb_strlen($password) < 4) {
      Response::error('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 422, 'VALIDATION');
    }

    $exists = $pdo->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
    $exists->execute([':username' => $username]);
    if ($exists->fetch()) {
      Response::error('ชื่อผู้ใช้นี้มีอยู่แล้ว', 409, 'DUPLICATE');
    }

    $id = 'admin-' . bin2hex(random_bytes(6));
    $initials = self::initialsFromName($name);

    $pdo->prepare(
      'INSERT INTO users (id, username, password_hash, role, name, email, phone, initials, status)
       VALUES (:id, :username, :password_hash, \'admin\', :name, :email, :phone, :initials, \'active\')'
    )->execute([
      ':id' => $id,
      ':username' => $username,
      ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
      ':name' => $name,
      ':email' => $email !== '' ? $email : null,
      ':phone' => $phone !== '' ? $phone : null,
      ':initials' => $initials,
    ]);

    Auth::audit($pdo, 'admin_create', 'เพิ่มผู้ดูแลระบบ', $actor, "สร้างบัญชี {$username} — {$name}");

    $user = self::fetchOne($pdo, $id);
    if (!$user) {
      throw new RuntimeException('Created admin not found');
    }
    return $user;
  }

  public static function update(PDO $pdo, string $id, array $body, ?array $actor): array
  {
    $current = self::raw($pdo, $id);
    if (!$current) {
      Response::error('ไม่พบผู้ดูแลระบบ', 404, 'NOT_FOUND');
    }

    $fields = [];
    $params = [':id' => $id];

    if (array_key_exists('name', $body)) {
      $name = trim((string)$body['name']);
      if ($name === '') {
        Response::error('ชื่อต้องไม่ว่าง', 422, 'VALIDATION');
      }
      $fields[] = 'name = :name';
      $params[':name'] = $name;
      $fields[] = 'initials = :initials';
      $params[':initials'] = self::initialsFromName($name);
    }
    if (array_key_exists('email', $body)) {
      $email = trim((string)$body['email']);
      $fields[] = 'email = :email';
      $params[':email'] = $email !== '' ? $email : null;
    }
    if (array_key_exists('phone', $body)) {
      $phone = trim((string)$body['phone']);
      $fields[] = 'phone = :phone';
      $params[':phone'] = $phone !== '' ? $phone : null;
    }
    if (array_key_exists('status', $body)) {
      $status = (string)$body['status'];
      if (!in_array($status, ['active', 'inactive'], true)) {
        Response::error('สถานะไม่ถูกต้อง', 422, 'VALIDATION');
      }
      if ($status === 'inactive' && self::activeAdminCount($pdo) <= 1 && $current['status'] === 'active') {
        Response::error('ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน', 422, 'VALIDATION');
      }
      if ($actor && ($actor['id'] ?? '') === $id && $status === 'inactive') {
        Response::error('ไม่สามารถระงับบัญชีของตัวเองได้', 422, 'VALIDATION');
      }
      $fields[] = 'status = :status';
      $params[':status'] = $status;
    }
    if (!empty($body['password'])) {
      $password = (string)$body['password'];
      if (mb_strlen($password) < 4) {
        Response::error('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 422, 'VALIDATION');
      }
      $fields[] = 'password_hash = :password_hash';
      $params[':password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }

    if (!$fields) {
      Response::error('ไม่มีข้อมูลที่จะอัปเดต', 422, 'VALIDATION');
    }

    $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id AND role = \'admin\'')
      ->execute($params);

    if (!empty($body['password'])) {
      // Force re-login on other devices when password is reset by another admin
      if (!$actor || ($actor['id'] ?? '') !== $id) {
        $pdo->prepare('DELETE FROM api_sessions WHERE user_id = :id')->execute([':id' => $id]);
      }
      Auth::audit($pdo, 'admin_password', 'ตั้งรหัสผ่านผู้ดูแล', $actor, 'ตั้งรหัสผ่าน ' . $current['username']);
    } else {
      Auth::audit($pdo, 'admin_update', 'แก้ไขผู้ดูแลระบบ', $actor, 'อัปเดตบัญชี ' . $current['username']);
    }

    $user = self::fetchOne($pdo, $id);
    if (!$user) {
      Response::error('ไม่พบผู้ดูแลระบบ', 404, 'NOT_FOUND');
    }
    return $user;
  }

  public static function delete(PDO $pdo, string $id, ?array $actor): array
  {
    $current = self::raw($pdo, $id);
    if (!$current) {
      Response::error('ไม่พบผู้ดูแลระบบ', 404, 'NOT_FOUND');
    }
    if ($actor && ($actor['id'] ?? '') === $id) {
      Response::error('ไม่สามารถลบบัญชีของตัวเองได้', 422, 'VALIDATION');
    }
    if (self::adminCount($pdo) <= 1) {
      Response::error('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน', 422, 'VALIDATION');
    }

    $pdo->prepare('DELETE FROM users WHERE id = :id AND role = \'admin\'')->execute([':id' => $id]);
    Auth::audit($pdo, 'admin_delete', 'ลบผู้ดูแลระบบ', $actor, 'ลบบัญชี ' . $current['username']);

    return ['success' => true, 'id' => $id];
  }

  public static function changeOwnPassword(PDO $pdo, array $user, string $currentPassword, string $newPassword): array
  {
    if ($currentPassword === '' || $newPassword === '') {
      Response::error('กรุณากรอกรหัสผ่านปัจจุบันและรหัสใหม่', 422, 'VALIDATION');
    }
    if (mb_strlen($newPassword) < 4) {
      Response::error('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร', 422, 'VALIDATION');
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $user['id']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
      Response::error('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401, 'AUTH_FAILED');
    }

    $pdo->prepare('UPDATE users SET password_hash = :password_hash WHERE id = :id')
      ->execute([
        ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ':id' => $user['id'],
      ]);

    // Keep current token; drop other sessions
    $token = Auth::bearerToken();
    if ($token) {
      $pdo->prepare('DELETE FROM api_sessions WHERE user_id = :id AND token <> :token')
        ->execute([':id' => $user['id'], ':token' => $token]);
    } else {
      $pdo->prepare('DELETE FROM api_sessions WHERE user_id = :id')->execute([':id' => $user['id']]);
    }

    Auth::audit($pdo, 'password_change', 'เปลี่ยนรหัสผ่าน', $user, 'ผู้ใช้เปลี่ยนรหัสผ่านเอง');

    return ['success' => true];
  }

  private static function raw(PDO $pdo, string $id): ?array
  {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id AND role = \'admin\' LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  private static function adminCount(PDO $pdo): int
  {
    return (int)$pdo->query('SELECT COUNT(*) FROM users WHERE role = \'admin\'')->fetchColumn();
  }

  private static function activeAdminCount(PDO $pdo): int
  {
    return (int)$pdo->query(
      'SELECT COUNT(*) FROM users WHERE role = \'admin\' AND status = \'active\''
    )->fetchColumn();
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
    return $chars !== '' ? mb_strtoupper($chars, 'UTF-8') : 'AD';
  }
}
