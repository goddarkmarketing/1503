<?php
declare(strict_types=1);

final class PasswordReset
{
  private const TOKEN_TTL_HOURS = 24;

  public static function ensureTable(PDO $pdo): void
  {
    $pdo->exec(
      'CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id VARCHAR(36) NOT NULL,
        token CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_prt_token (token),
        KEY idx_prt_user (user_id),
        KEY idx_prt_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
  }

  public static function request(PDO $pdo, string $username): array
  {
    self::ensureTable($pdo);
    $username = trim($username);
    if ($username === '') {
      Response::error('กรุณากรอกชื่อผู้ใช้', 422, 'VALIDATION');
    }

    $stmt = $pdo->prepare(
      'SELECT id, username, name, email, role, status
       FROM users
       WHERE username = :username
       LIMIT 1'
    );
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    // Always return success message to avoid username enumeration
    $generic = [
      'success' => true,
      'message' => 'หากบัญชีนี้มีอีเมลในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว กรุณาตรวจสอบกล่องจดหมาย',
    ];

    if (!$user || ($user['status'] ?? '') !== 'active') {
      return $generic;
    }

    $email = trim((string)($user['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      Response::error(
        'บัญชีนี้ยังไม่มีอีเมลในระบบ กรุณาติดต่อแอดมินเพื่อรีเซ็ตรหัสผ่าน',
        422,
        'NO_EMAIL'
      );
    }

    $token = bin2hex(random_bytes(32));
    $expires = (new DateTimeImmutable('+' . self::TOKEN_TTL_HOURS . ' hours'))->format('Y-m-d H:i:s');

    $pdo->prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES (:user_id, :token, :expires_at)'
    )->execute([
      ':user_id' => $user['id'],
      ':token' => $token,
      ':expires_at' => $expires,
    ]);

    $base = Mailer::adminBaseUrl();
    $resetUrl = $base . '/reset-password.html?token=' . rawurlencode($token);
    $html = Mailer::passwordResetHtml([
      'name' => $user['name'] ?? $user['username'],
      'username' => $user['username'],
      'resetUrl' => $resetUrl,
      'expiresHours' => self::TOKEN_TTL_HOURS,
    ]);
    Mailer::send($email, 'รีเซ็ตรหัสผ่าน — กล้าดีโบรคเกอร์', $html);

    Auth::audit(
      $pdo,
      'password_reset_request',
      'ขอรีเซ็ตรหัสผ่าน',
      null,
      'Password reset requested for ' . $user['username']
    );

    return $generic;
  }

  public static function reset(PDO $pdo, string $token, string $newPassword): array
  {
    self::ensureTable($pdo);
    $token = trim($token);
    if ($token === '' || strlen($token) !== 64) {
      Response::error('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว', 422, 'INVALID_TOKEN');
    }
    if (strlen($newPassword) < 4) {
      Response::error('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 422, 'VALIDATION');
    }

    $stmt = $pdo->prepare(
      'SELECT t.*, u.username, u.name, u.status
       FROM password_reset_tokens t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.token = :token
         AND t.used_at IS NULL
         AND t.expires_at > NOW()
       LIMIT 1'
    );
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    if (!$row || ($row['status'] ?? '') !== 'active') {
      Response::error('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว', 422, 'INVALID_TOKEN');
    }

    $pdo->beginTransaction();
    try {
      $pdo->prepare(
        'UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :id'
      )->execute([
        ':hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ':id' => $row['user_id'],
      ]);

      $pdo->prepare(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id'
      )->execute([':id' => $row['id']]);

      $pdo->prepare(
        'DELETE FROM api_sessions WHERE user_id = :user_id'
      )->execute([':user_id' => $row['user_id']]);

      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }

    Auth::audit(
      $pdo,
      'password_reset',
      'รีเซ็ตรหัสผ่านสำเร็จ',
      null,
      'Password reset completed for ' . ($row['username'] ?? '')
    );

    return [
      'success' => true,
      'message' => 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    ];
  }
}
