<?php
declare(strict_types=1);

$file = $argv[1] ?? '';
if ($file === '' || !is_file($file)) {
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

$workbook = $zip->getFromName('xl/workbook.xml') ?: '';
preg_match_all('/name="([^"]+)"/', $workbook, $sheetNames);

for ($i = 0; $i < $zip->numFiles; $i++) {
  $name = $zip->getNameIndex($i);
  if (!preg_match('#xl/worksheets/sheet(\d+)\.xml#', $name, $sm)) {
    continue;
  }

  $idx = (int)$sm[1] - 1;
  $title = $sheetNames[1][$idx] ?? $name;
  echo "===== {$title} ({$name}) =====\n";

  $xml = $zip->getFromName($name);
  if ($xml === false) {
    continue;
  }

  preg_match_all(
    '/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)/',
    $xml,
    $cells,
    PREG_SET_ORDER
  );

  $grid = [];
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
    $grid[$row][$col] = $val;
  }

  ksort($grid);
  foreach ($grid as $rowNum => $cols) {
    ksort($cols);
    $line = implode(' | ', array_values($cols));
    if (trim($line) !== '') {
      echo "R{$rowNum}: {$line}\n";
    }
  }
  echo "\n";
}
