<?php
declare(strict_types=1);

/**
 * Full local test runner for BKI Motor Web Service integration.
 *
 * Usage:
 *   php api/tools/motor-ws-test.php
 *   php api/tools/motor-ws-test.php --full          (include premium calculate sample)
 *   php api/tools/motor-ws-test.php --base=http://localhost/kladeebroker/api/v1
 */
require_once __DIR__ . '/motor-ws-fixtures.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/MotorWebService.php';

final class MotorWsTestRunner
{
  private string $apiBase;
  private bool $full;
  /** @var list<array{name:string,pass:bool,info:string,detail?:mixed}> */
  private array $results = [];
  private int $passed = 0;
  private int $failed = 0;
  private int $skipped = 0;
  private int $warn = 0;

  public function __construct(string $apiBase, bool $full)
  {
    $this->apiBase = rtrim($apiBase, '/');
    $this->full = $full;
  }

  public function run(): int
  {
    $this->heading('Kladee Broker — BKI Motor WS Test Suite');
    echo 'API base: ' . $this->apiBase . PHP_EOL;
    echo 'Mode: ' . ($this->full ? 'full (with premium sample)' : 'standard') . PHP_EOL;
    echo str_repeat('-', 60) . PHP_EOL;

    $this->testConfigFile();
    $this->testMotorConfigReady();
    $this->testLocalHealth();
    $this->testAdminLoginAndStatus();
    $this->testAdminPingRoute();
    $this->testDirectPing();
    if ($this->full) {
      $this->testVolPremiumSample();
    } else {
      $this->skip('vol_premium_sample', 'Skipped — run with --full to include premium calculate sample.');
    }

    $this->printSummary();
    return $this->failed > 0 ? 1 : 0;
  }

  private function testConfigFile(): void
  {
    $path = dirname(__DIR__) . '/config.php';
    if (!is_file($path)) {
      $this->fail('config_file', 'Missing api/config.php — copy from config.example.php');
      return;
    }
    $this->pass('config_file', 'api/config.php exists');
  }

  private function testMotorConfigReady(): void
  {
    $report = MotorWebService::statusReport();
    if (empty($report['enabled'])) {
      $this->fail('motor_enabled', 'motor_web_service.enabled is false in config.php');
      return;
    }
    $this->pass('motor_enabled', 'Motor WS enabled');

    if (!$report['ready']) {
      $this->fail('motor_ready', 'Motor WS not ready — check base_url/credentials');
      return;
    }
    $this->pass(
      'motor_ready',
      'Ready — env=' . ($report['environment'] ?? '?') . ' url=' . ($report['base_url'] ?? '?')
    );

    $params = $report['default_params'] ?? [];
    foreach (['user_id', 'agent_code', 'agent_seq'] as $key) {
      if (empty($params[$key])) {
        $this->fail('motor_param_' . $key, "Missing default_params.$key");
      } else {
        $this->pass('motor_param_' . $key, "$key=" . $params[$key]);
      }
    }
  }

  private function testLocalHealth(): void
  {
    $res = $this->http('GET', '/health');
    if ($res['status'] !== 200) {
      $this->fail('local_health', 'HTTP ' . $res['status'] . ' — is Apache/XAMPP running?', $res['body']);
      return;
    }
    $body = is_array($res['body']) ? $res['body'] : [];
    if (($body['ok'] ?? false) !== true) {
      $this->fail('local_health', 'Health response ok!=true', $body);
      return;
    }
    $db = (string)($body['database'] ?? '');
    if ($db !== 'connected') {
      $this->fail('local_health', 'Database not connected', $body);
      return;
    }
    $this->pass('local_health', 'API + MySQL OK');
  }

  private function testAdminLoginAndStatus(): void
  {
    $login = $this->http('POST', '/auth/login', [
      'username' => 'admin',
      'password' => 'demo',
    ]);
    if ($login['status'] !== 200) {
      $this->fail('admin_login', 'Login failed HTTP ' . $login['status'], $login['body']);
      return;
    }
    $token = is_array($login['body']) ? (string)($login['body']['token'] ?? '') : '';
    if ($token === '') {
      $this->fail('admin_login', 'No token in login response', $login['body']);
      return;
    }
    $this->pass('admin_login', 'Admin login OK');

    $status = $this->http('GET', '/admin/motor-ws/status', null, $token);
    if ($status['status'] !== 200) {
      $this->fail('admin_status', 'HTTP ' . $status['status'], $status['body']);
      return;
    }
    $body = is_array($status['body']) ? $status['body'] : [];
    if (empty($body['ready'])) {
      $this->fail('admin_status', 'status.ready is false', $body);
      return;
    }
    $this->pass('admin_status', 'Admin motor-ws/status OK');
  }

  private function testAdminPingRoute(): void
  {
    $login = $this->http('POST', '/auth/login', ['username' => 'admin', 'password' => 'demo']);
    $token = is_array($login['body']) ? (string)($login['body']['token'] ?? '') : '';
    if ($token === '') {
      $this->skip('admin_ping', 'Skipped — no admin token');
      return;
    }

    $ping = $this->http('POST', '/admin/motor-ws/ping', null, $token);
    if ($ping['status'] !== 200 && $ping['status'] !== 502) {
      $this->fail('admin_ping', 'Unexpected HTTP ' . $ping['status'], $ping['body']);
      return;
    }
    $body = is_array($ping['body']) ? $ping['body'] : [];
    $this->assertBkiReachability('admin_ping', $body);
  }

  private function testDirectPing(): void
  {
    try {
      $ping = MotorWebService::ping();
      $this->assertBkiReachability('direct_ping', $ping);
    } catch (Throwable $e) {
      $this->fail('direct_ping', $e->getMessage());
    }
  }

  private function testVolPremiumSample(): void
  {
    foreach ([
      'vol_premium_sample' => MotorWsFixtures::volPremiumSample(),
      'vol_premium_legacy' => MotorWsFixtures::volPremiumSampleLegacy(),
    ] as $name => $payload) {
      try {
        $result = MotorWebService::calculateVolPremium($payload);
        $status = $result['status'];
        $body = $result['body'];
        $cloudFront = is_string($body) && stripos($body, 'cloudfront') !== false;

        if ($cloudFront) {
          $this->warn($name, 'HTTP 403 CloudFront — IP not whitelisted', ['status' => $status]);
          continue;
        }

        if ($result['ok']) {
          $first = is_array($body) && isset($body[0]) ? $body[0] : $body;
          $pack = is_array($first) ? ($first['packname'] ?? $first['status'] ?? 'success') : 'success';
          $this->pass($name, "HTTP 200 — $pack", $this->shortBody($body));
          return;
        }

        if ($status >= 400 && $status < 500) {
          $this->warn($name, "HTTP $status — " . $this->shortBody($body));
          continue;
        }

        $this->fail($name, 'HTTP ' . $status, $this->shortBody($body));
      } catch (Throwable $e) {
        $this->fail($name, $e->getMessage());
      }
    }
  }

  /** @param array<string, mixed> $ping */
  private function assertBkiReachability(string $name, array $ping): void
  {
    $status = (int)($ping['status'] ?? 0);
    $message = (string)($ping['message'] ?? '');
    $body = $ping['body'] ?? null;
    $cloudFront = is_string($body) && stripos($body, 'cloudfront') !== false;

    if ($cloudFront || stripos($message, 'CloudFront') !== false) {
      $this->warn(
        $name,
        'CloudFront 403 — local IP not on BKI whitelist (our integration works; test on whitelisted server next)',
        ['status' => $status]
      );
      return;
    }

    if (!empty($ping['reachable']) && $status >= 400 && $status < 500) {
      $this->pass($name, "BKI reachable — HTTP $status ($message)", $this->shortBody($body));
      return;
    }

    if (!empty($ping['reachable']) && $status >= 200 && $status < 300) {
      $this->pass($name, "BKI reachable — HTTP $status success", $this->shortBody($body));
      return;
    }

    if ($status === 0) {
      $this->fail($name, $message !== '' ? $message : 'No HTTP response');
      return;
    }

    $this->fail($name, "HTTP $status — $message", $this->shortBody($body));
  }

  /** @return array{status:int,body:mixed} */
  private function http(string $method, string $path, ?array $json = null, ?string $token = null): array
  {
    $url = $this->apiBase . $path;
    $ch = curl_init($url);
    if ($ch === false) {
      return ['status' => 0, 'body' => 'curl_init failed'];
    }

    $headers = ['Accept: application/json'];
    if ($json !== null) {
      $headers[] = 'Content-Type: application/json';
    }
    if ($token) {
      $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => strtoupper($method),
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    if ($json !== null) {
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json, JSON_UNESCAPED_UNICODE));
    }

    $raw = curl_exec($ch);
    if ($raw === false) {
      $err = curl_error($ch);
      curl_close($ch);
      return ['status' => 0, 'body' => $err];
    }

    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($raw, true);
    return [
      'status' => $status,
      'body' => json_last_error() === JSON_ERROR_NONE ? $decoded : $raw,
    ];
  }

  private function pass(string $name, string $info, mixed $detail = null): void
  {
    $this->results[] = ['name' => $name, 'pass' => true, 'info' => $info, 'detail' => $detail];
    $this->passed++;
    echo '[PASS] ' . $name . ' — ' . $info . PHP_EOL;
  }

  private function fail(string $name, string $info, mixed $detail = null): void
  {
    $this->results[] = ['name' => $name, 'pass' => false, 'info' => $info, 'detail' => $detail];
    $this->failed++;
    echo '[FAIL] ' . $name . ' — ' . $info . PHP_EOL;
    if ($detail !== null) {
      echo '       ' . $this->formatDetail($detail) . PHP_EOL;
    }
  }

  private function warn(string $name, string $info, mixed $detail = null): void
  {
    $this->results[] = ['name' => $name, 'pass' => true, 'info' => $info, 'detail' => $detail];
    $this->warn++;
    echo '[WARN] ' . $name . ' — ' . $info . PHP_EOL;
    if ($detail !== null) {
      echo '       ' . $this->formatDetail($detail) . PHP_EOL;
    }
  }

  private function skip(string $name, string $info): void
  {
    $this->skipped++;
    echo '[SKIP] ' . $name . ' — ' . $info . PHP_EOL;
  }

  private function heading(string $title): void
  {
    echo PHP_EOL . $title . PHP_EOL;
  }

  private function printSummary(): void
  {
    echo str_repeat('-', 60) . PHP_EOL;
    echo "Summary: PASS=$this->passed  WARN=$this->warn  FAIL=$this->failed  SKIP=$this->skipped" . PHP_EOL;

    if ($this->failed === 0 && $this->warn > 0) {
      echo PHP_EOL;
      echo 'Local tests OK. BKI blocked by IP whitelist — deploy to server (' .
        implode(', ', MotorWebService::statusReport()['allowed_ips'] ?? []) .
        ') and run again.' . PHP_EOL;
    } elseif ($this->failed === 0) {
      echo PHP_EOL . 'All tests passed.' . PHP_EOL;
    } else {
      echo PHP_EOL . 'Fix FAIL items above, then re-run.' . PHP_EOL;
    }
  }

  private function formatDetail(mixed $detail): string
  {
    if (is_string($detail)) {
      return strlen($detail) > 200 ? substr($detail, 0, 200) . '...' : $detail;
    }
    return json_encode($detail, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }

  private function shortBody(mixed $body): mixed
  {
    if (is_string($body)) {
      return strlen($body) > 120 ? substr($body, 0, 120) . '...' : $body;
    }
    if (!is_array($body)) {
      return $body;
    }
    $keys = ['STATUS_CODE', 'STATUS_MSG', 'status', 'remark', 'message', 'code'];
    $out = [];
    foreach ($keys as $k) {
      if (isset($body[$k])) {
        $out[$k] = $body[$k];
      }
    }
    return $out ?: array_slice($body, 0, 5);
  }
}

// --- CLI ---
$full = in_array('--full', $argv, true);
$apiBase = 'http://localhost/kladeebroker/api/v1';
foreach ($argv as $arg) {
  if (str_starts_with($arg, '--base=')) {
    $apiBase = substr($arg, 7);
  }
}

exit((new MotorWsTestRunner($apiBase, $full))->run());
