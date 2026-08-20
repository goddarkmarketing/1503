<?php
declare(strict_types=1);

final class Maintenance
{
  private static function flagPath(): string
  {
    return dirname(__DIR__, 2) . '/.maintenance';
  }

  public static function isProductionRequest(): bool
  {
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === 'localhost' || $host === '127.0.0.1' || str_starts_with($host, 'localhost:')) {
      return false;
    }

    $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
    if ($uri === '/kladeebroker' || str_starts_with($uri, '/kladeebroker/')) {
      return false;
    }

    return (bool)preg_match('/^(www\.)?kladeebroker\.co\.th$/', $host);
  }

  public static function isEnabled(): bool
  {
    return is_file(self::flagPath()) && self::isProductionRequest();
  }

  public static function respondIfEnabled(): void
  {
    if (!self::isEnabled()) {
      return;
    }

    http_response_code(503);
    header('Retry-After: 3600');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
      'ok' => false,
      'error' => 'maintenance',
      'message' => 'ระบบกำลังบำรุงรักษาอยู่ กรุณากลับมาใหม่ภายหลัง'
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }
}
