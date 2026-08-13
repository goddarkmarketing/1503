<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = rtrim(api_path(), '/') ?: '/';

try {
  if ($method === 'GET' && $path === '/health') {
    $dbOk = false;
    $dbError = null;
    try {
      Database::pdo()->query('SELECT 1');
      $dbOk = true;
    } catch (Throwable $e) {
      $dbError = $e->getMessage();
    }
    Response::json([
      'ok' => true,
      'service' => 'kladeebroker-api',
      'version' => 'v1',
      'database' => $dbOk ? 'connected' : 'error',
      'databaseError' => $dbOk ? null : $dbError,
      'time' => gmdate('c'),
    ]);
  }

  $pdo = Database::pdo();

  if ($method === 'POST' && $path === '/auth/login') {
    $body = api_json_body();
    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    if ($username === '' || $password === '') {
      Response::error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 422, 'VALIDATION');
    }

    $stmt = $pdo->prepare(
      'SELECT * FROM users WHERE username = :username AND status = \'active\' LIMIT 1'
    );
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
      Response::error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401, 'AUTH_FAILED');
    }

    $token = Auth::createSession($pdo, $user['id']);
    $public = Auth::publicUser($pdo, $user);
    Auth::audit(
      $pdo,
      'login',
      'เข้าสู่ระบบ',
      $user,
      ($user['role'] === 'admin' ? 'Admin' : 'Agent') . ' login: ' . $user['username']
    );

    Response::json([
      'user' => $public,
      'token' => $token,
    ]);
  }

  if ($method === 'GET' && $path === '/auth/me') {
    $user = Auth::requireUser($pdo);
    Response::json(Auth::publicUser($pdo, $user));
  }

  if ($method === 'POST' && $path === '/auth/logout') {
    $token = Auth::bearerToken();
    if ($token) {
      $pdo->prepare('DELETE FROM api_sessions WHERE token = :token')->execute([':token' => $token]);
    }
    Response::json(['success' => true]);
  }

  Response::error('Not found', 404, 'NOT_FOUND');
} catch (Throwable $e) {
  $config = Auth::config();
  $detail = (($config['app']['env'] ?? 'production') === 'local') ? $e->getMessage() : null;
  $payload = [
    'message' => 'Server error',
    'code' => 'SERVER_ERROR',
  ];
  if ($detail) {
    $payload['detail'] = $detail;
  }
  Response::json($payload, 500);
}
