<?php
declare(strict_types=1);

$file = $argv[1] ?? '';
$code = $argv[2] ?? 'TO327-03';
if ($file === '' || !is_file($file)) {
  fwrite(STDERR, "Usage: php lookup-vol-car.php <bki_car_code_VOL.xlsx> [CAR_CODE]\n");
  exit(1);
}

$zip = new ZipArchive();
$zip->open($file);
$shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
$strings = [];
if ($shared !== '') {
  preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
  $strings = $m[1];
}

$xml = $zip->getFromName('xl/worksheets/sheet1.xml');
$zip->close();

preg_match_all(
  '/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)/',
  $xml ?: '',
  $cells,
  PREG_SET_ORDER
);

$rows = [];
foreach ($cells as $cell) {
  $col = $cell[1];
  $row = (int)$cell[2];
  $type = $cell[3] ?? '';
  if (isset($cell[5]) && $cell[5] !== '') {
    $val = $cell[5];
  } elseif ($type === 's') {
    $val = $strings[(int)($cell[4] ?? 0)] ?? ($cell[4] ?? '');
  } else {
    $val = $cell[4] ?? '';
  }
  $rows[$row][$col] = $val;
}

$header = $rows[1] ?? [];
$found = null;
foreach ($rows as $rnum => $cols) {
  if ($rnum === 1) {
    continue;
  }
  foreach ($cols as $val) {
    if ((string)$val === $code) {
      $found = ['row' => $rnum, 'data' => $cols];
      break 2;
    }
  }
}

if (!$found) {
  echo "Not found: $code\n";
  exit(1);
}

echo json_encode([
  'car_code' => $code,
  'row' => $found['row'],
  'columns' => $found['data'],
  'header' => $header,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
