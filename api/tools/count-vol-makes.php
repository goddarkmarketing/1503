<?php
declare(strict_types=1);

$path = $argv[1] ?? dirname(__DIR__) . '/data/bki-vol-car-codes.json';
$data = json_decode(file_get_contents($path) ?: '{}', true);
$items = $data['items'] ?? [];
$makes = [];
foreach ($items as $row) {
  $mk = strtoupper(trim((string)($row['make'] ?? '')));
  if ($mk !== '') {
    $makes[$mk] = ($makes[$mk] ?? 0) + 1;
  }
}
ksort($makes);
echo 'source: ' . ($data['source'] ?? '?') . PHP_EOL;
echo 'exported_at: ' . ($data['exported_at'] ?? '?') . PHP_EOL;
echo 'total items: ' . count($items) . PHP_EOL;
echo 'makes: ' . count($makes) . PHP_EOL;
foreach ($makes as $name => $count) {
  echo "  {$name}: {$count}" . PHP_EOL;
}
