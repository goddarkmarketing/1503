<?php
declare(strict_types=1);

final class Auth
{
  public static function config(): array
  {
    static $config;
    if ($config === null) {
      $path = dirname(__DIR__) . '/config.php';
      $config = is_file($path) ? require $path : [];
    }
    return $config;
  }

  public static function bearerToken(): ?string
  {
    $header = $_SERVER['HTTP_AUTHORIZATION']
      ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
      ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
      return $m[1];
    }
    return null;
  }

  public static function createSession(PDO $pdo, string $userId): string
  {
    $token = bin2hex(random_bytes(32));
    $hours = (int)(self::config()['app']['session_ttl_hours'] ?? 168);
    $expires = (new DateTimeImmutable("+{$hours} hours"))->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare(
      'INSERT INTO api_sessions (user_id, token, expires_at, ip, user_agent)
       VALUES (:user_id, :token, :expires_at, :ip, :ua)'
    );
    $stmt->execute([
      ':user_id' => $userId,
      ':token' => $token,
      ':expires_at' => $expires,
      ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
      ':ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255) ?: null,
    ]);

    return $token;
  }

  public static function userFromToken(PDO $pdo, ?string $token): ?array
  {
    if (!$token) {
      return null;
    }

    $stmt = $pdo->prepare(
      'SELECT u.*
       FROM api_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token = :token
         AND s.expires_at > NOW()
         AND u.status = \'active\'
       LIMIT 1'
    );
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch();
    if (!$user) {
      return null;
    }

    $pdo->prepare('UPDATE api_sessions SET last_seen_at = NOW() WHERE token = :token')
      ->execute([':token' => $token]);

    return $user;
  }

  public static function requireUser(PDO $pdo): array
  {
    $user = self::userFromToken($pdo, self::bearerToken());
    if (!$user) {
      Response::error('Unauthorized', 401, 'UNAUTHORIZED');
    }
    return $user;
  }

  public static function requireAdmin(PDO $pdo): array
  {
    $user = self::requireUser($pdo);
    if (($user['role'] ?? '') !== 'admin') {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    return $user;
  }

  public static function publicUser(PDO $pdo, array $user): array
  {
    $payload = [
      'id' => $user['id'],
      'username' => $user['username'],
      'role' => $user['role'],
      'name' => $user['name'],
      'email' => $user['email'],
      'phone' => $user['phone'],
      'initials' => $user['initials'],
      'balance' => null,
    ];

    if ($user['role'] === 'agent') {
      $stmt = $pdo->prepare('SELECT * FROM agents WHERE user_id = :id LIMIT 1');
      $stmt->execute([':id' => $user['id']]);
      $agent = $stmt->fetch();
      if ($agent) {
        $payload['agentCode'] = $agent['code'];
        $payload['balance'] = (float)$agent['balance'];
        $payload['featurePermissions'] = $agent['feature_permissions']
          ? json_decode($agent['feature_permissions'], true)
          : null;
      }
    }

    return $payload;
  }

  public static function audit(PDO $pdo, string $action, string $label, ?array $actor, ?string $detail = null): void
  {
    $stmt = $pdo->prepare(
      'INSERT INTO audit_logs (action, action_label, actor_id, actor_name, detail)
       VALUES (:action, :label, :actor_id, :actor_name, :detail)'
    );
    $stmt->execute([
      ':action' => $action,
      ':label' => $label,
      ':actor_id' => $actor['id'] ?? null,
      ':actor_name' => $actor['name'] ?? null,
      ':detail' => $detail,
    ]);
  }
}
