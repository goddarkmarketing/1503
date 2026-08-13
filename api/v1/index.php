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

  if ($method === 'POST' && $path === '/auth/change-password') {
    $user = Auth::requireUser($pdo);
    $body = api_json_body();
    Response::json(AdminUsers::changeOwnPassword(
      $pdo,
      $user,
      (string)($body['currentPassword'] ?? ''),
      (string)($body['newPassword'] ?? '')
    ));
  }

  if ($method === 'GET' && $path === '/admin/users') {
    Auth::requireAdmin($pdo);
    Response::json(AdminUsers::fetchAll($pdo));
  }

  if ($method === 'POST' && $path === '/admin/users') {
    $admin = Auth::requireAdmin($pdo);
    Response::json(AdminUsers::create($pdo, api_json_body(), $admin), 201);
  }

  if (preg_match('#^/admin/users/([^/]+)$#', $path, $m)) {
    $userId = urldecode($m[1]);
    if ($method === 'PATCH') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(AdminUsers::update($pdo, $userId, api_json_body(), $admin));
    }
    if ($method === 'DELETE') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(AdminUsers::delete($pdo, $userId, $admin));
    }
  }

  if ($method === 'GET' && $path === '/agents') {
    Auth::requireAdmin($pdo);
    Response::json(Agents::fetchAll($pdo));
  }

  if ($method === 'POST' && $path === '/agents') {
    $admin = Auth::requireAdmin($pdo);
    Response::json(Agents::create($pdo, api_json_body(), $admin), 201);
  }

  if (preg_match('#^/agents/([^/]+)/balance$#', $path, $m)) {
    if ($method === 'POST') {
      $admin = Auth::requireAdmin($pdo);
      $body = api_json_body();
      $amount = (float)($body['amount'] ?? 0);
      $note = trim((string)($body['note'] ?? ''));
      if ($amount == 0.0) {
        Response::error('จำนวนเงินต้องไม่เป็นศูนย์', 422, 'VALIDATION');
      }
      Response::json(Agents::adjustBalance($pdo, urldecode($m[1]), $amount, $note, $admin));
    }
  }

  if (preg_match('#^/agents/([^/]+)/status$#', $path, $m)) {
    if ($method === 'PATCH') {
      $admin = Auth::requireAdmin($pdo);
      $body = api_json_body();
      Response::json(Agents::setStatus($pdo, urldecode($m[1]), (string)($body['status'] ?? ''), $admin));
    }
  }

  if (preg_match('#^/agents/([^/]+)$#', $path, $m)) {
    $agentId = urldecode($m[1]);
    if ($method === 'GET') {
      Auth::requireAdmin($pdo);
      $agent = Agents::fetchOne($pdo, $agentId);
      if (!$agent) {
        Response::error('ไม่พบนายหน้า', 404, 'NOT_FOUND');
      }
      Response::json($agent);
    }
    if ($method === 'PATCH') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(Agents::update($pdo, $agentId, api_json_body(), $admin));
    }
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
