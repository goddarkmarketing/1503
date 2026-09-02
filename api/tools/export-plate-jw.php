<?php
declare(strict_types=1);

$file = $argv[1] ?? '';
$out = $argv[2] ?? dirname(__DIR__) . '/data/bki-province-plate.json';

if ($file === '' || !is_file($file)) {
  fwrite(STDERR, "Usage: php export-plate-jw.php <plate_jw.xlsx> [out.json]\n");
  exit(1);
}

$zip = new ZipArchive();
if ($zip->open($file) !== true) {
  fwrite(STDERR, "Cannot open xlsx\n");
  exit(1);
}

$shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
$strings = [];
if ($shared !== '') {
  preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
  $strings = $m[1];
}
$zip->close();

$items = [];
for ($i = 3; $i + 1 < count($strings); $i += 2) {
  $province = trim((string)$strings[$i]);
  $plateJw = trim((string)$strings[$i + 1]);
  if ($province === '' || $plateJw === '') {
    continue;
  }
  if ($province === 'ตามรายการ' || $plateJw === 'ตามรายการ') {
    continue;
  }
  $items[$province] = [
    'province' => $province,
    'plate_jw' => $plateJw,
  ];
}

$payload = [
  'source' => basename($file),
  'exported_at' => gmdate('c'),
  'items' => array_values($items),
];

file_put_contents($out, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo 'Wrote ' . count($items) . " items to {$out}\n";
