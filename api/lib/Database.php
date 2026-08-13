<?php
declare(strict_types=1);

final class Database
{
  private static ?PDO $pdo = null;

  public static function pdo(): PDO
  {
    if (self::$pdo instanceof PDO) {
      return self::$pdo;
    }

    $configPath = dirname(__DIR__) . '/config.php';
    if (!is_file($configPath)) {
      throw new RuntimeException('Missing api/config.php — copy from config.example.php');
    }

    $config = require $configPath;
    $db = $config['db'] ?? [];
    $host = $db['host'] ?? 'localhost';
    $port = (int)($db['port'] ?? 3306);
    $name = $db['name'] ?? '';
    $user = $db['user'] ?? '';
    $pass = $db['pass'] ?? '';
    $charset = $db['charset'] ?? 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
    self::$pdo = new PDO($dsn, $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return self::$pdo;
  }
}
