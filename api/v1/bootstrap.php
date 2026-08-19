<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

$apiRoot = dirname(__DIR__); // /api (not /api/v1)
$configPath = $apiRoot . '/config.php';
$config = is_file($configPath) ? require $configPath : [];
$origin = $config['app']['cors_origin'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once $apiRoot . '/lib/Database.php';
require_once $apiRoot . '/lib/Response.php';
require_once $apiRoot . '/lib/Auth.php';
require_once $apiRoot . '/lib/Agents.php';
require_once $apiRoot . '/lib/AdminUsers.php';
require_once $apiRoot . '/lib/CreditLedger.php';
require_once $apiRoot . '/lib/CreditBankAccounts.php';
require_once $apiRoot . '/lib/CreditRequests.php';
require_once $apiRoot . '/lib/Mailer.php';
require_once $apiRoot . '/lib/WithdrawRequests.php';

function api_json_body(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    return [];
  }
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function api_path(): string
{
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
  // Supports /api/v1/... whether site root or /1503/
  if (preg_match('#/api/v1(?:/index\.php)?(/.*)?$#', $uri, $m)) {
    $path = $m[1] ?? '/';
    return $path === '' ? '/' : $path;
  }
  return $uri;
}
