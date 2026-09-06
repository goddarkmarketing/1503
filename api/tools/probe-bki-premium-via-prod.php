<?php
declare(strict_types=1);

/**
 * Probe BKI premiums via production Kladee API (server is IP-whitelisted).
 *
 * Usage:
 *   php api/tools/probe-bki-premium-via-prod.php
 *   php api/tools/probe-bki-premium-via-prod.php --limit=50 --per-brand=3
 */
$apiRoot = dirname(__DIR__);
$opts = getopt('', ['limit::', 'brand::', 'per-brand::', 'base::', 'user::', 'pass::']);
$limit = max(1, (int)($opts['limit'] ?? 45));
$brandFilter = strtoupper(trim((string)($opts['brand'] ?? '')));
$perBrand = max(1, (int)($opts['per-brand'] ?? 3));
$base = rtrim((string)($opts['base'] ?? 'https://www.kladeebroker.co.th/api/v1'), '/');
$user = (string)($opts['user'] ?? 'admin');
$pass = (string)($opts['pass'] ?? 'demo');

$dataPath = $apiRoot . '/data/bki-vol-car-codes.json';
$payload = json_decode((string)file_get_contents($dataPath), true);
$items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

$byCode = [];
foreach ($items as $row) {
  if (!is_array($row)) continue;
  $code = strtoupper(trim((string)($row['make_code'] ?? '')));
  $make = strtoupper(trim((string)($row['make'] ?? '')));
  if ($code === '' || $make === '') continue;
  if ($brandFilter !== '' && $make !== $brandFilter) continue;
  $year = (int)($row['car_year'] ?? 0);
  $prev = $byCode[$code] ?? null;
  if ($prev === null || $year > (int)$prev['car_year']) {
    $byCode[$code] = $row;
  }
}

$byBrand = [];
foreach ($byCode as $row) {
  $byBrand[strtoupper((string)$row['make'])][] = $row;
}
ksort($byBrand);

$sample = [];
foreach ($byBrand as $rows) {
  usort($rows, static fn($a, $b) => strcmp((string)$a['make_code'], (string)$b['make_code']));
  foreach (array_slice($rows, 0, $perBrand) as $row) {
    $sample[] = $row;
    if (count($sample) >= $limit) break 2;
  }
}

function httpJson(string $method, string $url, ?array $body = null, array $headers = []): array {
  $ch = curl_init($url);
  $hdrs = array_merge(['Accept: application/json', 'Content-Type: application/json'], $headers);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $hdrs,
    CURLOPT_TIMEOUT => 45,
  ]);
  if ($body !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  }
  $raw = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  $decoded = null;
  if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
  }
  return ['status' => $status, 'body' => $decoded, 'raw' => $raw, 'error' => $err];
}

$login = httpJson('POST', $base . '/auth/login', ['username' => $user, 'password' => $pass]);
$token = (string)($login['body']['token'] ?? '');
if ($token === '') {
  fwrite(STDERR, "Login failed HTTP {$login['status']}: " . substr((string)$login['raw'], 0, 300) . PHP_EOL);
  exit(1);
}
$auth = ['Authorization: Bearer ' . $token];

$eff = (new DateTimeImmutable('+7 days'))->format('d/m/Y');
$okList = [];
$zeroList = [];
$errList = [];

foreach ($sample as $row) {
  $make = strtoupper((string)$row['make']);
  $code = (string)$row['make_code'];
  $year = (string)$row['car_year'];
  $sum = (int)($row['sum_ins_min'] ?? 0);
  if ($sum <= 0) $sum = 300000;
  $weight = (string)($row['weight'] ?? '0');
  if ($weight === '' || $weight === '0') $weight = '1200';

  $overrides = [
    'eff_date' => $eff,
    'make' => $make,
    'make_code' => $code,
    'car_brand' => $make,
    'car_code' => $code,
    'car_year' => $year,
    'car_type' => (string)($row['car_type'] ?? '1'),
    'car_use' => '1',
    'cc' => (string)($row['cc'] ?? '1500'),
    'seat' => (string)($row['seat'] ?? '5'),
    'weight' => $weight,
    'sum_ins' => (string)$sum,
    'garage' => 'G',
    'ncb' => '0',
    'deduct' => '0',
    'deduct_lib' => '0',
    'comp_req' => 'N',
    'drv_flag' => 'N',
    'consent_drv' => 'N',
    'risk' => '1',
    'agent_ref_no' => 'PROBE-' . preg_replace('/[^A-Z0-9]/', '', $code) . '-' . $year,
  ];

  $resp = httpJson('POST', $base . '/admin/motor-ws/test-premium', [
    'overrides' => $overrides,
  ], $auth);

  $http = (int)$resp['status'];
  $bkiBody = $resp['body']['body'] ?? null;
  $packages = [];
  if (is_array($bkiBody)) {
    if (isset($bkiBody[0]) && is_array($bkiBody[0])) {
      $packages = $bkiBody;
    } elseif (isset($bkiBody['data']) && is_array($bkiBody['data'])) {
      $packages = array_is_list($bkiBody['data']) ? $bkiBody['data'] : [$bkiBody['data']];
    } elseif (isset($bkiBody['packages']) && is_array($bkiBody['packages'])) {
      $packages = $bkiBody['packages'];
    } else {
      $packages = [$bkiBody];
    }
  }

  $prem = 0.0;
  $packname = '';
  $status = '';
  foreach ($packages as $pkg) {
    if (!is_array($pkg)) continue;
    if ($packname === '') {
      $packname = trim((string)($pkg['packname'] ?? $pkg['package_name'] ?? ''));
    }
    if ($status === '') {
      $status = trim((string)($pkg['status'] ?? ''));
    }
    foreach (['total_prem_vol', 'TOTAL_PREM_VOL', 'gross_prem_vol', 'GROSS_PREM_VOL', 'premium_total'] as $k) {
      if (isset($pkg[$k]) && is_numeric($pkg[$k]) && (float)$pkg[$k] > 0) {
        $prem = max($prem, (float)$pkg[$k]);
      }
    }
  }

  $entry = [
    'make' => $make,
    'make_code' => $code,
    'car_year' => $year,
    'desc' => (string)($row['desc'] ?? ''),
    'sum_ins' => $sum,
    'http' => $http,
    'bki_http' => (int)($resp['body']['status'] ?? 0),
    'premium' => $prem,
    'status' => $status,
    'packname' => $packname,
  ];

  if ($http >= 200 && $http < 300 && $prem > 0) {
    $okList[] = $entry;
  } elseif ($http >= 200 && $http < 300) {
    $zeroList[] = $entry;
  } else {
    $errList[] = $entry + ['raw' => substr((string)$resp['raw'], 0, 180)];
  }

  usleep(150000);
}

echo "BKI premium probe via {$base}\n";
echo 'Sampled: ' . count($sample) . " codes\n";
echo str_repeat('-', 72) . PHP_EOL;

echo "\n[WITH PREMIUM] " . count($okList) . PHP_EOL;
foreach ($okList as $r) {
  echo sprintf(
    "  %-10s %-12s %s  sum=%s  prem=%s\n  %s\n",
    $r['make'],
    $r['make_code'],
    $r['car_year'],
    number_format($r['sum_ins']),
    number_format($r['premium'], 2),
    mb_strimwidth($r['desc'], 0, 70, '…')
  );
}

echo "\n[ZERO / UNAVAILABLE] " . count($zeroList) . PHP_EOL;
$counts = [];
foreach ($zeroList as $r) {
  $counts[$r['make']] = ($counts[$r['make']] ?? 0) + 1;
}
foreach ($counts as $m => $n) echo "  {$m}: {$n}\n";
echo "  examples:\n";
foreach (array_slice($zeroList, 0, 12) as $r) {
  echo sprintf(
    "    %-10s %-12s status=%s pack=%s\n",
    $r['make'],
    $r['make_code'],
    $r['status'] !== '' ? $r['status'] : '-',
    mb_strimwidth($r['packname'] !== '' ? $r['packname'] : '-', 0, 48, '…')
  );
}

echo "\n[ERRORS] " . count($errList) . PHP_EOL;
foreach (array_slice($errList, 0, 8) as $r) {
  echo sprintf("  %-10s %-12s http=%s bki=%s\n", $r['make'], $r['make_code'], $r['http'], $r['bki_http']);
}

echo "\nDone.\n";
