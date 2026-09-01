<?php
declare(strict_types=1);

/**
 * Server-side client for BKI Motor Web Service REST API (Basic Auth).
 * Spec: BKI API Specification -Motor_(version1.4).xlsx
 */
final class MotorWebService
{
  public const PATH_VOL_PREMIUM_CALCULATE = '/vol/premium/calculate';
  public const PATH_VOL_TRANSFER_POLICY = '/vol/transfer/policy';

  public static function config(): array
  {
    return Auth::config()['motor_web_service'] ?? [];
  }

  public static function baseUrl(): string
  {
    $cfg = self::config();
    $direct = trim((string)($cfg['base_url'] ?? ''));
    if ($direct !== '') {
      return rtrim($direct, '/');
    }

    $env = strtolower(trim((string)($cfg['environment'] ?? 'uat')));
    $urls = $cfg['base_urls'] ?? [];
    $fromEnv = trim((string)($urls[$env] ?? ''));
    if ($fromEnv !== '') {
      return rtrim($fromEnv, '/');
    }

    return '';
  }

  public static function isReady(): bool
  {
    $cfg = self::config();
    if (empty($cfg['enabled'])) {
      return false;
    }
    $user = trim((string)($cfg['basic_auth_user'] ?? ''));
    $pass = (string)($cfg['basic_auth_pass'] ?? '');
    return self::baseUrl() !== '' && $user !== '' && $pass !== '';
  }

  /** @return array<string, string> */
  public static function defaultParams(): array
  {
    $params = self::config()['default_params'] ?? [];
    $out = [];
    foreach ($params as $key => $value) {
      if ($value === null || $value === '') {
        continue;
      }
      $out[(string)$key] = (string)$value;
    }
    return $out;
  }

  /**
   * @param array<string, mixed> $body
   * @return array{ok:bool,status:int,body:mixed,raw:string,headers:array<string,string>}
   */
  public static function calculateVolPremium(array $body = []): array
  {
    return self::request(self::PATH_VOL_PREMIUM_CALCULATE, [], $body, 'POST');
  }

  /**
   * @param array<string, mixed> $body
   * @return array{ok:bool,status:int,body:mixed,raw:string,headers:array<string,string>}
   */
  public static function transferVolPolicy(array $body = []): array
  {
    return self::request(self::PATH_VOL_TRANSFER_POLICY, [], $body, 'POST');
  }

  /**
   * Lightweight connectivity check — expects validation/auth response, not HTTP transport failure.
   * @return array{reachable:bool,status:int,body:mixed,message:string}
   */
  public static function ping(): array
  {
    $result = self::calculateVolPremium([]);
    $status = $result['status'];
    $body = $result['body'];

    if ($status === 401 || $status === 403) {
      $raw = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_UNICODE);
      $cloudFrontBlocked = is_string($body) && stripos($body, 'cloudfront') !== false;
      return [
        'reachable' => true,
        'status' => $status,
        'body' => $body,
        'message' => $cloudFrontBlocked
          ? 'Request blocked by CloudFront — server outbound IP may not be on BKI whitelist.'
          : 'API reachable but authorization denied — check Basic Auth credentials.',
      ];
    }

    if ($status >= 400 && $status < 500) {
      return [
        'reachable' => true,
        'status' => $status,
        'body' => $body,
        'message' => 'API reachable (received client/validation response).',
      ];
    }

    if ($result['ok']) {
      return [
        'reachable' => true,
        'status' => $status,
        'body' => $body,
        'message' => 'API reachable and returned success.',
      ];
    }

    return [
      'reachable' => $status > 0,
      'status' => $status,
      'body' => $body,
      'message' => $status > 0
        ? 'API responded with HTTP ' . $status
        : 'No HTTP response — check network or IP whitelist.',
    ];
  }

  /**
   * @param array<string, scalar|null> $query
   * @param array<string, mixed>|null $body
   * @return array{ok:bool,status:int,body:mixed,raw:string,headers:array<string,string>}
   */
  public static function request(
    string $path,
    array $query = [],
    ?array $body = null,
    string $method = 'GET'
  ): array {
    if (!self::isReady()) {
      throw new RuntimeException('Motor Web Service is not configured (set enabled=true and base URL in config.php)');
    }

    $cfg = self::config();
    $baseUrl = self::baseUrl();
    $path = '/' . ltrim($path, '/');
    $method = strtoupper($method);

    if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
      $body = array_merge(self::defaultParams(), $body);
    }

    $query = array_merge(self::defaultParams(), $query);
    $filtered = [];
    foreach ($query as $key => $value) {
      if ($value === null || $value === '') {
        continue;
      }
      $filtered[(string)$key] = (string)$value;
    }

    $qs = ($filtered && $body === null) ? ('?' . http_build_query($filtered)) : '';
    $url = $baseUrl . $path . $qs;
    $timeout = max(5, (int)($cfg['timeout_seconds'] ?? 30));

    $ch = curl_init($url);
    if ($ch === false) {
      throw new RuntimeException('Unable to initialize HTTP client');
    }

    $headers = [
      'Accept: application/json',
      'Content-Type: application/json',
    ];

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 3,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_CONNECTTIMEOUT => min(10, $timeout),
      CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
      CURLOPT_USERPWD => (string)$cfg['basic_auth_user'] . ':' . (string)$cfg['basic_auth_pass'],
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_CUSTOMREQUEST => $method,
      CURLOPT_HEADER => true,
    ]);

    if ($body !== null && $method !== 'GET' && $method !== 'HEAD') {
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    $raw = curl_exec($ch);
    if ($raw === false) {
      $err = curl_error($ch);
      curl_close($ch);
      throw new RuntimeException('Motor Web Service request failed: ' . $err);
    }

    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $rawHeaders = substr($raw, 0, $headerSize);
    $rawBody = substr($raw, $headerSize);
    $parsedHeaders = self::parseHeaders($rawHeaders);
    $decoded = json_decode($rawBody, true);
    $payload = json_last_error() === JSON_ERROR_NONE ? $decoded : $rawBody;

    return [
      'ok' => $status >= 200 && $status < 300,
      'status' => $status,
      'body' => $payload,
      'raw' => $rawBody,
      'headers' => $parsedHeaders,
    ];
  }

  /** Safe summary for admin UI — no secrets. */
  public static function statusReport(): array
  {
    $cfg = self::config();
    $user = (string)($cfg['basic_auth_user'] ?? '');
    $pass = (string)($cfg['basic_auth_pass'] ?? '');
    $baseUrl = self::baseUrl();
    $environment = (string)($cfg['environment'] ?? 'uat');

    return [
      'enabled' => !empty($cfg['enabled']),
      'ready' => self::isReady(),
      'environment' => $environment,
      'base_url' => $baseUrl !== '' ? $baseUrl : null,
      'base_urls' => $cfg['base_urls'] ?? [],
      'endpoints' => [
        'vol_premium_calculate' => self::PATH_VOL_PREMIUM_CALCULATE,
        'vol_transfer_policy' => self::PATH_VOL_TRANSFER_POLICY,
      ],
      'basic_auth_user' => $user !== '' ? $user : null,
      'has_password' => $pass !== '',
      'default_params' => self::defaultParams(),
      'allowed_ips' => array_values($cfg['allowed_ips'] ?? []),
      'timeout_seconds' => (int)($cfg['timeout_seconds'] ?? 30),
      'spec_folder' => 'Send to Partner - API_20260827',
    ];
  }

  /** @return array<string, string> */
  private static function parseHeaders(string $raw): array
  {
    $headers = [];
    foreach (preg_split('/\r\n|\n|\r/', $raw) as $line) {
      if (strpos($line, ':') === false) {
        continue;
      }
      [$name, $value] = explode(':', $line, 2);
      $headers[trim($name)] = trim($value);
    }
    return $headers;
  }
}
