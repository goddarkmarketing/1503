<?php
declare(strict_types=1);
/**
 * Debug: show exact request MotorWebService would send (no HTTP call).
 */
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/MotorWebService.php';

$cfg = MotorWebService::config();
$body = array_merge(MotorWebService::defaultParams(), []);
$url = MotorWebService::baseUrl() . MotorWebService::PATH_VOL_PREMIUM_CALCULATE;

echo "URL: $url\n";
echo "METHOD: POST\n";
echo "BASIC_USER: " . ($cfg['basic_auth_user'] ?? '') . "\n";
echo "PASS_LEN: " . strlen((string)($cfg['basic_auth_pass'] ?? '')) . "\n";
echo "BODY: " . json_encode($body, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

$expected = base64_encode(($cfg['basic_auth_user'] ?? '') . ':' . ($cfg['basic_auth_pass'] ?? ''));
echo "Authorization: Basic $expected\n";
