<?php
/**
 * Copy to config.php on the server and fill in Plesk database credentials.
 * Do not commit config.php.
 */
return [
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'kladeebroker',
    'user' => 'YOUR_DB_USER',
    'pass' => 'YOUR_DB_PASSWORD',
    'charset' => 'utf8mb4',
  ],
  'app' => [
    'name' => 'Kladee Broker API',
    'env' => 'production', // local | production
    'session_ttl_hours' => 168, // 7 days
    'cors_origin' => '*', // tighten later e.g. https://kladeebroker.co.th
  ],
  'mail' => [
    'from' => 'noreply@kladeebroker.co.th',
    'from_name' => 'Kladee Broker',
    'withdraw_to' => 'goddarkmarketing@gmail.com',
    'agent_request_to' => 'goddarkmarketing@gmail.com',
    'identity_to' => 'goddarkmarketing@gmail.com',
    'admin_base_url' => 'https://www.kladeebroker.co.th',
  ],
];
