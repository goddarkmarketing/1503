<?php
declare(strict_types=1);

require_once __DIR__ . '/motor-ws-fixtures.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/MotorWebService.php';

try {
  $result = MotorWebService::calculateVolPremium(MotorWsFixtures::volPremiumSample());
  echo json_encode([
    'status' => $result['status'],
    'ok' => $result['ok'],
    'body' => $result['body'],
  ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $e) {
  fwrite(STDERR, $e->getMessage() . PHP_EOL);
  exit(1);
}
