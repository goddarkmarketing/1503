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

  if ($method === 'POST' && $path === '/auth/forgot-password') {
    $body = api_json_body();
    Response::json(PasswordReset::request($pdo, (string)($body['username'] ?? '')));
  }

  if ($method === 'POST' && $path === '/auth/reset-password') {
    $body = api_json_body();
    Response::json(PasswordReset::reset(
      $pdo,
      (string)($body['token'] ?? ''),
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

  if ($method === 'GET' && $path === '/credit/bank-accounts') {
    Auth::requireUser($pdo);
    $enabledOnly = isset($_GET['enabledOnly']) && $_GET['enabledOnly'] !== '0' && $_GET['enabledOnly'] !== 'false';
    Response::json(CreditBankAccounts::list($pdo, $enabledOnly));
  }

  if (($method === 'PUT' || $method === 'POST') && $path === '/credit/bank-accounts') {
    $admin = Auth::requireAdmin($pdo);
    $body = api_json_body();
    $banks = (isset($body['banks']) && is_array($body['banks'])) ? $body['banks'] : $body;
    Response::json(CreditBankAccounts::replaceAll($pdo, $banks, $admin));
  }

  if (preg_match('#^/credit-requests/([^/]+)/slip$#', $path, $m)) {
    if ($method === 'GET') {
      $user = Auth::requireUser($pdo);
      CreditRequests::streamSlip($pdo, urldecode($m[1]), $user);
    }
  }

  if (preg_match('#^/agents/([^/]+)/credit-requests$#', $path, $m)) {
    $user = Auth::requireUser($pdo);
    $agentId = urldecode($m[1]);
    if (($user['role'] ?? '') === 'agent' && $user['id'] !== $agentId) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($method === 'GET') {
      Response::json(CreditRequests::listForAgent($pdo, $agentId, [
        'period' => (string)($_GET['period'] ?? ''),
        'periodType' => (string)($_GET['periodType'] ?? 'month'),
        'status' => (string)($_GET['status'] ?? ''),
      ]));
    }
    if ($method === 'POST') {
      if (($user['role'] ?? '') !== 'agent' && ($user['role'] ?? '') !== 'admin') {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      Response::json(CreditRequests::create($pdo, $agentId, api_json_body(), $user), 201);
    }
  }

  if ($method === 'GET' && $path === '/admin/credit-requests') {
    Auth::requireAdmin($pdo);
    Response::json(CreditRequests::listAll($pdo, [
      'status' => (string)($_GET['status'] ?? ''),
    ]));
  }

  if (preg_match('#^/admin/credit-requests/([^/]+)/(approve|reject)$#', $path, $m)) {
    if ($method === 'POST') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(CreditRequests::review($pdo, urldecode($m[1]), $m[2], $admin));
    }
  }

  if (preg_match('#^/withdraw-requests/([^/]+)/slip$#', $path, $m)) {
    if ($method === 'GET') {
      $user = Auth::requireUser($pdo);
      WithdrawRequests::streamSlip($pdo, urldecode($m[1]), $user);
    }
  }

  if (preg_match('#^/agents/([^/]+)/withdraw-requests$#', $path, $m)) {
    $user = Auth::requireUser($pdo);
    $agentId = urldecode($m[1]);
    if (($user['role'] ?? '') === 'agent' && $user['id'] !== $agentId) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($method === 'GET') {
      Response::json(WithdrawRequests::listForAgent($pdo, $agentId, [
        'status' => (string)($_GET['status'] ?? ''),
      ]));
    }
    if ($method === 'POST') {
      if (($user['role'] ?? '') !== 'agent' && ($user['role'] ?? '') !== 'admin') {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      Response::json(WithdrawRequests::create($pdo, $agentId, api_json_body(), $user), 201);
    }
  }

  if ($method === 'GET' && $path === '/admin/withdraw-requests') {
    Auth::requireAdmin($pdo);
    Response::json(WithdrawRequests::listAll($pdo, [
      'status' => (string)($_GET['status'] ?? ''),
    ]));
  }

  if (preg_match('#^/admin/withdraw-requests/([^/]+)/(pay|reject)$#', $path, $m)) {
    if ($method === 'POST') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(WithdrawRequests::review($pdo, urldecode($m[1]), $m[2], $admin, api_json_body()));
    }
  }

  if (preg_match('#^/agents/([^/]+)/team-members$#', $path, $m)) {
    $user = Auth::requireUser($pdo);
    $agentId = urldecode($m[1]);
    if (($user['role'] ?? '') === 'agent' && ($user['id'] ?? '') !== $agentId) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($method === 'GET') {
      Response::json(AgentRegistrationRequests::listTeamMembers($pdo, $agentId));
    }
  }

  if (preg_match('#^/agents/([^/]+)/agent-registration-requests$#', $path, $m)) {
    $user = Auth::requireUser($pdo);
    $agentId = urldecode($m[1]);
    if (($user['role'] ?? '') === 'agent' && ($user['id'] ?? '') !== $agentId) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($method === 'GET') {
      Response::json(AgentRegistrationRequests::listForAgent($pdo, $agentId, [
        'status' => (string)($_GET['status'] ?? ''),
      ]));
    }
    if ($method === 'POST') {
      if (($user['role'] ?? '') !== 'agent' && ($user['role'] ?? '') !== 'admin') {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      Response::json(
        AgentRegistrationRequests::create($pdo, $agentId, api_json_body(), $user),
        201
      );
    }
  }

  if ($method === 'GET' && $path === '/admin/agent-registration-requests') {
    Auth::requireAdmin($pdo);
    Response::json(AgentRegistrationRequests::listAll($pdo, [
      'status' => (string)($_GET['status'] ?? ''),
    ]));
  }

  if (preg_match('#^/admin/agent-registration-requests/([^/]+)/(approve|reject)$#', $path, $m)) {
    if ($method === 'POST') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(AgentRegistrationRequests::review($pdo, urldecode($m[1]), $m[2], $admin, api_json_body()));
    }
  }

  if ($method === 'GET' && $path === '/credit-ledger') {
    $user = Auth::requireUser($pdo);
    if (($user['role'] ?? '') !== 'admin' && ($user['role'] ?? '') !== 'agent') {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    Response::json(CreditLedger::list($pdo, $user, [
      'agentId' => (string)($_GET['agentId'] ?? ''),
      'dateFrom' => (string)($_GET['dateFrom'] ?? ''),
      'dateTo' => (string)($_GET['dateTo'] ?? ''),
    ]));
  }

  if (preg_match('#^/credit-ledger/([^/]+)/slip$#', $path, $m)) {
    if ($method === 'GET') {
      $user = Auth::requireUser($pdo);
      CreditLedger::streamSlip($pdo, urldecode($m[1]), $user);
    }
  }

  if (preg_match('#^/agents/([^/]+)/credit-ledger$#', $path, $m)) {
    if ($method === 'GET') {
      $user = Auth::requireUser($pdo);
      $agentId = urldecode($m[1]);
      if (($user['role'] ?? '') === 'agent' && $user['id'] !== $agentId) {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      if (($user['role'] ?? '') !== 'admin' && ($user['role'] ?? '') !== 'agent') {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      Response::json(CreditLedger::list($pdo, $user, [
        'agentId' => $agentId,
        'dateFrom' => (string)($_GET['dateFrom'] ?? ''),
        'dateTo' => (string)($_GET['dateTo'] ?? ''),
      ]));
    }
  }

  if ($method === 'GET' && $path === '/agents') {
    Auth::requireAdmin($pdo);
    Agents::ensureDemoAccounts($pdo);
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
      $slip = CreditLedger::parseSlipPayload($body);
      Response::json(Agents::adjustBalance($pdo, urldecode($m[1]), $amount, $note, $admin, $slip));
    }
  }

  if (preg_match('#^/agents/([^/]+)/status$#', $path, $m)) {
    if ($method === 'PATCH') {
      $admin = Auth::requireAdmin($pdo);
      $body = api_json_body();
      Response::json(Agents::setStatus($pdo, urldecode($m[1]), (string)($body['status'] ?? ''), $admin));
    }
  }

  if (preg_match('#^/agents/([^/]+)/identity-verification$#', $path, $m)) {
    $user = Auth::requireUser($pdo);
    $agentId = urldecode($m[1]);
    if (($user['role'] ?? '') === 'agent' && ($user['id'] ?? '') !== $agentId) {
      Response::error('Forbidden', 403, 'FORBIDDEN');
    }
    if ($method === 'GET') {
      Response::json(AgentIdentity::getForAgent($pdo, $agentId));
    }
    if ($method === 'POST') {
      if (($user['role'] ?? '') !== 'agent' && ($user['role'] ?? '') !== 'admin') {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
      Response::json(AgentIdentity::submit($pdo, $agentId, api_json_body(), $user), 201);
    }
  }

  if (preg_match('#^/identity-verifications/([^/]+)/(bank|id-card)$#', $path, $m)) {
    if ($method === 'GET') {
      $user = Auth::requireUser($pdo);
      AgentIdentity::streamDoc($pdo, urldecode($m[1]), $m[2] === 'bank' ? 'bank' : 'id-card', $user);
    }
  }

  if ($method === 'GET' && $path === '/admin/agent-identity-verifications') {
    Auth::requireAdmin($pdo);
    Response::json(AgentIdentity::listAll($pdo, [
      'status' => (string)($_GET['status'] ?? ''),
    ]));
  }

  if (preg_match('#^/admin/agent-identity-verifications/([^/]+)/(approve|reject)$#', $path, $m)) {
    if ($method === 'POST') {
      $admin = Auth::requireAdmin($pdo);
      Response::json(AgentIdentity::review($pdo, urldecode($m[1]), $m[2], $admin, api_json_body()));
    }
  }

  if ($method === 'GET' && $path === '/admin/motor-ws/status') {
    Auth::requireAdmin($pdo);
    Response::json(MotorWebService::statusReport());
  }

  if ($method === 'POST' && $path === '/admin/motor-ws/ping') {
    Auth::requireAdmin($pdo);
    try {
      Response::json(MotorWebService::ping());
    } catch (Throwable $e) {
      Response::json([
        'reachable' => false,
        'status' => 0,
        'body' => null,
        'message' => $e->getMessage(),
      ], 502);
    }
  }

  if ($method === 'POST' && $path === '/admin/motor-ws/test-premium') {
    Auth::requireAdmin($pdo);
    require_once dirname(__DIR__) . '/tools/motor-ws-fixtures.php';
    $body = api_json_body();
    $useLegacy = !empty($body['legacy']);
    $payload = $useLegacy
      ? MotorWsFixtures::volPremiumSampleLegacy()
      : MotorWsFixtures::volPremiumSample();
    if (!empty($body['overrides']) && is_array($body['overrides'])) {
      $payload = array_merge($payload, $body['overrides']);
    }
    try {
      $result = MotorWebService::calculateVolPremium($payload);
      Response::json([
        'ok' => $result['ok'],
        'status' => $result['status'],
        'request' => $payload,
        'body' => $result['body'],
      ], $result['ok'] ? 200 : ($result['status'] >= 400 ? $result['status'] : 502));
    } catch (Throwable $e) {
      Response::json([
        'ok' => false,
        'status' => 0,
        'request' => $payload,
        'body' => null,
        'message' => $e->getMessage(),
      ], 502);
    }
  }

  if ($method === 'GET' && $path === '/motor/bki/vol/car-codes') {
    Auth::requireUser($pdo);
    if (!MotorWebService::isReady()) {
      Response::error('BKI Motor API ยังไม่ได้ตั้งค่า', 503, 'MOTOR_WS_NOT_READY');
    }
    $search = MotorBkiVol::searchCarCodes(
      (string)($_GET['make'] ?? ''),
      (string)($_GET['q'] ?? ''),
      (int)($_GET['limit'] ?? 80)
    );
    Response::json($search);
  }

  if ($method === 'GET' && $path === '/motor/bki/vol/lookups') {
    Auth::requireUser($pdo);
    Response::json(MotorBkiLookup::catalogs());
  }

  if ($method === 'GET' && $path === '/motor/bki/vol/lookups/amphurs') {
    Auth::requireUser($pdo);
    $provinceCode = (string)($_GET['province_code'] ?? $_GET['province'] ?? '');
    if ($provinceCode === '') {
      Response::error('กรุณาระบุ province_code', 422, 'VALIDATION');
    }
    if (!preg_match('/^\d{1,2}$/', $provinceCode)) {
      $provinceCode = MotorBkiLookup::resolveProvinceCode($provinceCode);
    }
    Response::json(['items' => MotorBkiLookup::amphurs($provinceCode)]);
  }

  if ($method === 'GET' && $path === '/motor/bki/vol/lookups/tambols') {
    Auth::requireUser($pdo);
    $provinceCode = (string)($_GET['province_code'] ?? $_GET['province'] ?? '');
    $amphurCode = (string)($_GET['amphur_code'] ?? $_GET['amphur'] ?? '');
    if ($provinceCode === '' || $amphurCode === '') {
      Response::error('กรุณาระบุ province_code และ amphur_code', 422, 'VALIDATION');
    }
    if (!preg_match('/^\d{1,2}$/', $provinceCode)) {
      $provinceCode = MotorBkiLookup::resolveProvinceCode($provinceCode);
    }
    if (!preg_match('/^\d{1,2}$/', $amphurCode)) {
      $amphurCode = MotorBkiLookup::resolveAmphurCode($provinceCode, $amphurCode);
    }
    Response::json(['items' => MotorBkiLookup::tambols($provinceCode, $amphurCode)]);
  }

  if ($method === 'POST' && $path === '/motor/bki/vol/premium/calculate') {
    Auth::requireUser($pdo);
    if (!MotorWebService::isReady()) {
      Response::error('BKI Motor API ยังไม่ได้ตั้งค่า', 503, 'MOTOR_WS_NOT_READY');
    }
    $body = api_json_body();
    $payload = MotorBkiVol::buildPremiumPayload($body);
    try {
      $result = MotorWebService::calculateVolPremium($payload);
      $parsed = MotorBkiVol::parsePremiumResponse($result['body']);
      $bkiStatus = (int)($result['status'] ?? 0);
      $message = null;
      if (!$result['ok']) {
        if ($bkiStatus === 403) {
          $message = 'BKI ปฏิเสธการเชื่อมต่อ (403) — localhost ไม่ได้อยู่ใน IP whitelist ของ BKI กรุณาทดสอบบนเซิร์ฟเวอร์ production';
        } elseif ($bkiStatus === 401) {
          $message = 'BKI ปฏิเสธสิทธิ์ (401) — ตรวจสอบ Basic Auth ใน config';
        } elseif ($bkiStatus >= 400) {
          $message = 'BKI ตอบกลับ HTTP ' . $bkiStatus;
        } else {
          $message = 'ไม่สามารถเชื่อมต่อ BKI ได้';
        }
      }
      Response::json([
        'ok' => $result['ok'],
        'status' => $bkiStatus,
        'message' => $message,
        'request' => $payload,
        'parsed' => $parsed,
        'body' => $result['body'],
      ], 200);
    } catch (Throwable $e) {
      Response::json([
        'ok' => false,
        'status' => 0,
        'request' => $payload,
        'message' => $e->getMessage(),
      ], 502);
    }
  }

  if ($method === 'POST' && $path === '/motor/bki/vol/transfer/policy') {
    Auth::requireUser($pdo);
    if (!MotorWebService::isReady()) {
      Response::error('BKI Motor API ยังไม่ได้ตั้งค่า', 503, 'MOTOR_WS_NOT_READY');
    }
    $body = api_json_body();
    $payload = MotorBkiVol::buildTransferPayload($body);
    try {
      $result = MotorWebService::transferVolPolicy($payload);
      $parsed = MotorBkiVol::parseTransferResponse($result['body']);
      Response::json([
        'ok' => $result['ok'],
        'status' => $result['status'],
        'request' => $payload,
        'parsed' => $parsed,
        'body' => $result['body'],
      ], 200);
    } catch (Throwable $e) {
      Response::json([
        'ok' => false,
        'status' => 0,
        'request' => $payload,
        'message' => $e->getMessage(),
      ], 502);
    }
  }

  if ($method === 'POST' && $path === '/motor/bki/vol/issue') {
    $user = Auth::requireUser($pdo);
    if (!MotorWebService::isReady()) {
      Response::error('BKI Motor API ยังไม่ได้ตั้งค่า', 503, 'MOTOR_WS_NOT_READY');
    }
    $ctx = Policies::requireAgent($pdo, $user);
    $body = api_json_body();
    $payload = MotorBkiVol::buildTransferPayload($body);
    $premium = (float)($body['premiumTotal'] ?? $body['premium_total'] ?? 0);
    if ($premium <= 0) {
      $pkg = is_array($body['package'] ?? null) ? $body['package'] : [];
      $premium = (float)(MotorBkiVol::pkgField($pkg, ['gross_total_vol', 'total_premium', 'premium_total'], 0));
    }
    if ($premium <= 0) {
      Response::error('ไม่พบเบี้ยประกันสำหรับออกกรมธรรม์', 422, 'VALIDATION');
    }
    if ((float)$ctx['agent']['balance'] < $premium) {
      Response::error('วงเงินคงเหลือไม่เพียงพอ', 422, 'INSUFFICIENT_BALANCE');
    }

    try {
      $result = MotorWebService::transferVolPolicy($payload);
      $parsed = MotorBkiVol::parseTransferResponse($result['body']);
      $bkiOk = (bool)$result['ok'];
      if (!empty($parsed['status_code']) && stripos((string)$parsed['status_code'], 'API000_F') === 0) {
        $bkiOk = false;
      }
      if (!empty($parsed['policy_no'])) {
        $bkiOk = true;
      }

      if (!$bkiOk) {
        $message = $parsed['status_message'] ?: 'BKI ไม่สามารถออกกรมธรรม์ได้';
        Response::json([
          'ok' => false,
          'status' => (int)($result['status'] ?? 0),
          'message' => $message,
          'parsed' => $parsed,
          'body' => $result['body'],
          'request' => $payload,
        ], 200);
      }

      $customer = is_array($body['customer'] ?? null) ? $body['customer'] : $body;
      $policyInput = [
        'premiumTotal' => $premium,
        'insurer' => 'BKI กรุงเทพ',
        'insurerCode' => 'bki',
        'productId' => 'voluntary-bki',
        'productName' => '2+ / 3+',
        'type' => 'voluntary',
        'typeLabel' => '2+ / 3+',
        'planCode' => (string)($body['coverType'] ?? ''),
        'licensePlate' => (string)($customer['licensePlate'] ?? ''),
        'firstName' => (string)($customer['firstName'] ?? ''),
        'lastName' => (string)($customer['lastName'] ?? ''),
        'insuredName' => trim(((string)($customer['firstName'] ?? '')) . ' ' . ((string)($customer['lastName'] ?? ''))),
        'coverageStart' => (string)($body['coverage_start'] ?? ''),
        'coverageEnd' => (string)($body['coverage_end'] ?? ''),
        'bkiPolicyNo' => (string)($parsed['policy_no'] ?? ''),
        'bkiAgentRef' => (string)($payload['agent_ref_no'] ?? ''),
        'externalStatus' => (string)($parsed['status_code'] ?? ''),
        'externalMessage' => (string)($parsed['status_message'] ?? ''),
        'requestJson' => $payload,
        'responseJson' => [
          'body' => $result['body'],
          'parsed' => $parsed,
          'linkPolicy' => $parsed['link_policy'] ?? null,
          'compPolicyNo' => $parsed['comp_policy_no'] ?? null,
          'linkCompPolicy' => $parsed['link_comp_policy'] ?? null,
        ],
        'status' => 'active',
      ];

      $policy = Policies::create($pdo, $ctx['agent'], $user, $policyInput);
      $balanceStmt = $pdo->prepare('SELECT balance FROM agents WHERE id = :id LIMIT 1');
      $balanceStmt->execute([':id' => $ctx['agent']['id']]);
      $balanceRow = $balanceStmt->fetch();
      Response::json([
        'ok' => true,
        'status' => (int)($result['status'] ?? 200),
        'message' => 'ออกกรมธรรม์สำเร็จ',
        'policy' => $policy,
        'parsed' => $parsed,
        'links' => [
          'policy' => $parsed['link_policy'] ?? null,
          'compPolicy' => $parsed['link_comp_policy'] ?? null,
        ],
        'balance' => isset($balanceRow['balance']) ? (float)$balanceRow['balance'] : null,
        'body' => $result['body'],
      ], 200);
    } catch (Throwable $e) {
      Response::json([
        'ok' => false,
        'status' => 0,
        'message' => $e->getMessage(),
        'request' => $payload,
      ], 502);
    }
  }

  if ($method === 'POST' && $path === '/motor/bki/vol/quotes') {
    $user = Auth::requireUser($pdo);
    $ctx = Policies::requireAgent($pdo, $user);
    $quote = Quotes::create($pdo, $ctx['agent'], $user, api_json_body());
    Response::json(['ok' => true, 'quote' => $quote], 201);
  }

  if ($method === 'GET' && $path === '/motor/bki/vol/quotes') {
    $user = Auth::requireUser($pdo);
    Quotes::ensureTable($pdo);
    Response::json(Quotes::listForUser($pdo, $user, [
      'agentId' => (string)($_GET['agentId'] ?? ''),
    ]));
  }

  if (preg_match('#^/motor/bki/vol/quotes/([^/]+)$#', $path, $m) && $method === 'GET') {
    $user = Auth::requireUser($pdo);
    Quotes::ensureTable($pdo);
    $quote = Quotes::fetchOne($pdo, urldecode($m[1]));
    if (!$quote) {
      Response::error('ไม่พบใบเสนอราคา', 404, 'NOT_FOUND');
    }
    if (($user['role'] ?? '') === 'agent') {
      $ctx = Policies::requireAgent($pdo, $user);
      if (($quote['agentId'] ?? '') !== ($ctx['agent']['id'] ?? '')) {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
    }
    Response::json($quote);
  }

  if ($method === 'GET' && $path === '/policies') {
    $user = Auth::requireUser($pdo);
    Policies::ensureTable($pdo);
    $filters = [
      'agentId' => (string)($_GET['agentId'] ?? ''),
      'date' => (string)($_GET['date'] ?? ''),
      'status' => (string)($_GET['status'] ?? ''),
    ];
    Response::json(Policies::listForUser($pdo, $user, $filters));
  }

  if ($method === 'POST' && $path === '/policies') {
    $user = Auth::requireUser($pdo);
    $ctx = Policies::requireAgent($pdo, $user);
    $body = api_json_body();
    $policy = Policies::create($pdo, $ctx['agent'], $user, $body);
    Response::json($policy, 201);
  }

  if (preg_match('#^/policies/([^/]+)$#', $path, $m) && $method === 'GET') {
    $user = Auth::requireUser($pdo);
    Policies::ensureTable($pdo);
    $policy = Policies::fetchOne($pdo, urldecode($m[1]));
    if (!$policy) {
      Response::error('ไม่พบกรมธรรม์', 404, 'NOT_FOUND');
    }
    if (($user['role'] ?? '') === 'agent') {
      $ctx = Policies::requireAgent($pdo, $user);
      if (($policy['agentId'] ?? '') !== ($ctx['agent']['id'] ?? '')) {
        Response::error('Forbidden', 403, 'FORBIDDEN');
      }
    }
    Response::json($policy);
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
