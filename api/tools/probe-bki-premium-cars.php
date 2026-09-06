<?php
declare(strict_types=1);

/**
 * Probe which BKI VOL car codes return a real premium for this agent.
 *
 * Usage:
 *   php api/tools/probe-bki-premium-cars.php
 *   php api/tools/probe-bki-premium-cars.php --limit=40
 *   php api/tools/probe-bki-premium-cars.php --brand=HONDA
 */
$apiRoot = dirname(__DIR__);
require_once $apiRoot . '/v1/bootstrap.php';
require_once $apiRoot . '/lib/MotorWebService.php';
require_once $apiRoot . '/lib/MotorBkiVol.php';

$opts = getopt('', ['limit::', 'brand::', 'per-brand::', 'json']);
$limit = max(1, (int)($opts['limit'] ?? 60));
$brandFilter = strtoupper(trim((string)($opts['brand'] ?? '')));
$perBrand = max(1, (int)($opts['per-brand'] ?? 3));
$asJson = array_key_exists('json', $opts);

$dataPath = $apiRoot . '/data/bki-vol-car-codes.json';
$payload = json_decode((string)file_get_contents($dataPath), true);
$items = is_array($payload['items'] ?? null) ? $payload['items'] : [];
if ($items === []) {
  fwrite(STDERR, "No car codes found\n");
  exit(1);
}

// Prefer one representative year per make_code (mid / latest available).
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

// Sample across brands: up to N codes per brand, then fill remaining slots.
$byBrand = [];
foreach ($byCode as $code => $row) {
  $make = strtoupper((string)$row['make']);
  $byBrand[$make][] = $row;
}
ksort($byBrand);

$sample = [];
foreach ($byBrand as $make => $rows) {
  usort($rows, static function ($a, $b) {
    return strcmp((string)$a['make_code'], (string)$b['make_code']);
  });
  $take = array_slice($rows, 0, $perBrand);
  foreach ($take as $row) {
    $sample[] = $row;
    if (count($sample) >= $limit) break 2;
  }
}

if (!MotorWebService::isReady()) {
  fwrite(STDERR, "Motor WS not ready\n");
  exit(1);
}

$eff = (new DateTimeImmutable('+7 days'))->format('d/m/Y');
$results = [];
$okList = [];
$zeroList = [];
$errList = [];

foreach ($sample as $i => $row) {
  $make = (string)$row['make'];
  $code = (string)$row['make_code'];
  $year = (string)$row['car_year'];
  $sum = (int)($row['sum_ins_min'] ?? 0);
  if ($sum <= 0) $sum = 300000;

  $input = [
    'make' => $make,
    'make_code' => $code,
    'car_year' => $year,
    'cc' => (string)($row['cc'] ?? '1500'),
    'seat' => (string)($row['seat'] ?? '5'),
    'weight' => (string)(($row['weight'] ?? '0') === '0' || ($row['weight'] ?? '') === '' ? '1200' : $row['weight']),
    'car_type' => (string)($row['car_type'] ?? '1'),
    'car_use' => '1', // BKI use type personal
    'reg_type' => (string)($row['car_use'] ?? '110'),
    'sum_ins' => $sum,
    'coverage_start' => $eff,
    'garage' => 'G',
    'deduct' => '0',
    'ncb' => '0',
    'comp_req' => 'N',
    'driverMode' => 'unnamed',
    'drv_flag' => 'N',
    'consent_drv' => 'N',
    'risk' => '1',
  ];

  $body = MotorBkiVol::buildPremiumPayload($input);
  $resp = MotorWebService::calculateVolPremium($body);
  $parsed = MotorBkiVol::parsePremiumResponse($resp['body'] ?? null);
  $packages = $parsed['packages'] ?? [];
  $first = is_array($packages[0] ?? null) ? $packages[0] : [];
  $prem = 0.0;
  foreach ($packages as $pkg) {
    if (!is_array($pkg)) continue;
    foreach (['total_prem_vol', 'gross_prem_vol', 'premium_total', 'TOTAL_PREM_VOL'] as $k) {
      if (isset($pkg[$k]) && is_numeric($pkg[$k]) && (float)$pkg[$k] > 0) {
        $prem = max($prem, (float)$pkg[$k]);
      }
    }
  }
  $packname = trim((string)($first['packname'] ?? $first['package_name'] ?? $parsed['status_message'] ?? ''));
  $status = trim((string)($first['status'] ?? ''));
  $http = (int)($resp['status'] ?? 0);
  $entry = [
    'make' => $make,
    'make_code' => $code,
    'car_year' => $year,
    'desc' => (string)($row['desc'] ?? ''),
    'sum_ins' => $sum,
    'http' => $http,
    'premium' => $prem,
    'status' => $status,
    'packname' => $packname,
    'ok' => $http >= 200 && $http < 300 && $prem > 0,
  ];
  $results[] = $entry;
  if ($entry['ok']) $okList[] = $entry;
  elseif ($http >= 200 && $http < 300) $zeroList[] = $entry;
  else $errList[] = $entry;

  usleep(120000);
}

if ($asJson) {
  echo json_encode([
    'probed' => count($results),
    'with_premium' => count($okList),
    'zero_or_unavailable' => count($zeroList),
    'errors' => count($errList),
    'ok' => $okList,
    'zero' => $zeroList,
    'err' => $errList,
  ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
  exit(0);
}

echo "BKI premium probe\n";
echo 'Sampled: ' . count($results) . " unique codes (limit={$limit}, per-brand={$perBrand})\n";
echo str_repeat('-', 72) . PHP_EOL;

echo "\n[WITH PREMIUM] " . count($okList) . PHP_EOL;
foreach ($okList as $r) {
  echo sprintf(
    "  %-8s %-12s %s  prem=%s  %s\n",
    $r['make'],
    $r['make_code'],
    $r['car_year'],
    number_format($r['premium'], 2),
    mb_strimwidth($r['desc'], 0, 42, '…')
  );
}

echo "\n[HTTP OK BUT PREMIUM 0 / UNAVAILABLE] " . count($zeroList) . PHP_EOL;
$byMakeZero = [];
foreach ($zeroList as $r) {
  $byMakeZero[$r['make']] = ($byMakeZero[$r['make']] ?? 0) + 1;
}
foreach ($byMakeZero as $m => $n) {
  echo "  {$m}: {$n}\n";
}
if ($zeroList) {
  $sampleZero = array_slice($zeroList, 0, 8);
  echo "  examples:\n";
  foreach ($sampleZero as $r) {
    echo sprintf(
      "    %-8s %-12s status=%s pack=%s\n",
      $r['make'],
      $r['make_code'],
      $r['status'] !== '' ? $r['status'] : '-',
      mb_strimwidth($r['packname'] !== '' ? $r['packname'] : '-', 0, 50, '…')
    );
  }
}

echo "\n[HTTP / TRANSPORT ERRORS] " . count($errList) . PHP_EOL;
foreach (array_slice($errList, 0, 10) as $r) {
  echo sprintf(
    "  %-8s %-12s http=%s pack=%s\n",
    $r['make'],
    $r['make_code'],
    $r['http'],
    mb_strimwidth($r['packname'] !== '' ? $r['packname'] : '-', 0, 50, '…')
  );
}

echo "\nDone.\n";
