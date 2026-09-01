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
  // External Motor Web Service (BKI REST API) — credentials from partner, never commit real values.
  // Spec: Send to Partner - API_20260827/_API Spec New Version ผู้ขับขี่ 5 คน/BKI API Specification -Motor_(version1.4).xlsx
  'motor_web_service' => [
    'enabled' => false,
    // production | uat | sit — or set base_url directly
    'environment' => 'uat',
    'base_url' => '',
    'base_urls' => [
      'production' => 'https://bkiwpapi.bangkokinsurance.com',
      'uat' => 'https://bkiwpapiuat.bangkokinsurance.com',
      'sit' => 'https://bkiwpapisit.bangkokinsurance.com',
    ],
    'basic_auth_user' => 'YOUR_REST_USER',
    'basic_auth_pass' => 'YOUR_REST_PASSWORD',
    'default_params' => [
      'user_id' => 'YOUR_USER_ID',
      'agent_code' => 'YOUR_AGENT_CODE',
      'agent_seq' => 'YOUR_AGENT_SEQ',
    ],
    // IPs registered with BKI (reference only; enforced on their side).
    'allowed_ips' => [],
    'timeout_seconds' => 30,
  ],
];
