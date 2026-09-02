<?php
declare(strict_types=1);

/** Export car codes from BKI lookup xlsx to JSON (fixed column layout). */
$file = $argv[1] ?? '';
$limit = (int)($argv[2] ?? 800);
$out = $argv[3] ?? '';

if ($file === '' || !is_file($file)) {
  fwrite(STDERR, "Usage: php export-vol-car-codes.php <xlsx> [limit] [out.json]\n");
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

$xml = $zip->getFromName('xl/worksheets/sheet1.xml');
$zip->close();

preg_match_all(
  '/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)/',
  $xml ?: '',
  $cells,
  PREG_SET_ORDER
);

$resolveCell = static function (string $col, string $raw, string $type) use ($strings): string {
  if ($raw === '') {
    return '';
  }
  $numericCols = ['N', 'O', 'P', 'Q', 'A'];
  if (in_array($col, $numericCols, true)) {
    return trim($raw);
  }
  if ($type === 's' || (ctype_digit($raw) && (int)$raw < count($strings))) {
    return trim($strings[(int)$raw] ?? $raw);
  }
  return trim($raw);
};

$rows = [];
foreach ($cells as $cell) {
  $col = $cell[1];
  $row = (int)$cell[2];
  $type = $cell[3] ?? '';
  $raw = $cell[4] ?? '';
  if (isset($cell[5]) && $cell[5] !== '') {
    $val = $cell[5];
  } else {
    $val = $resolveCell($col, $raw, $type);
  }
  $rows[$row][$col] = trim((string)$val);
}

$cell = static function (array $cols, string $letter): string {
  return trim((string)($cols[$letter] ?? ''));
};

$items = [];
$seen = [];
$count = 0;
foreach ($rows as $rnum => $cols) {
  if ($rnum === 1 || $count >= $limit) {
    continue;
  }

  $makeCode = $cell($cols, 'B');
  $carYear = $cell($cols, 'N');
  if ($makeCode === '' || !preg_match('/^\d{4}$/', $carYear)) {
    continue;
  }

  $itemKey = $makeCode . '|' . $carYear;
  if (isset($seen[$itemKey])) {
    continue;
  }

  $brand = strtoupper($cell($cols, 'D'));
  require_once dirname(__DIR__) . '/lib/MotorBkiVol.php';
  $desc = MotorBkiVol::buildCarDescFromLookupRow($cell, $cols);
  $cc = $cell($cols, 'I') ?: '0';
  $weight = $cell($cols, 'J') ?: '0';
  $seat = $cell($cols, 'K');
  if ($seat === '' || !ctype_digit($seat) || (int)$seat <= 1) {
    $seat = '5';
  }
  $carType = $cell($cols, 'L') ?: '1';
  $carUse = $cell($cols, 'M') ?: '1';
  $sumMin = (int)preg_replace('/[^0-9]/', '', $cell($cols, 'P') ?: '0');
  $sumMax = (int)preg_replace('/[^0-9]/', '', $cell($cols, 'Q') ?: '0');

  $items[] = [
    'make' => $brand,
    'make_code' => $makeCode,
    'car_year' => $carYear,
    'desc' => $desc,
    'cc' => $cc,
    'seat' => $seat,
    'weight' => $weight,
    'car_type' => $carType,
    'car_use' => $carUse,
    'sum_ins_min' => $sumMin,
    'sum_ins_max' => $sumMax,
  ];
  $seen[$itemKey] = true;
  $count++;
}

$payload = [
  'source' => basename($file),
  'exported_at' => gmdate('c'),
  'items' => $items,
];

$json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
if ($out !== '') {
  if (!is_dir(dirname($out))) {
    mkdir(dirname($out), 0775, true);
  }
  file_put_contents($out, $json);
  echo "Wrote {$count} items to {$out}\n";
} else {
  echo $json;
}
