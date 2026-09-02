<?php
declare(strict_types=1);
$f = $argv[1] ?? '';
$rowNum = (int)($argv[2] ?? 5978);
$z = new ZipArchive();
$z->open($f);
$s = $z->getFromName('xl/sharedStrings.xml');
preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $s, $m);
$strings = $m[1];
$xml = $z->getFromName('xl/worksheets/sheet1.xml');
preg_match_all(
  '/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)/',
  $xml,
  $cells,
  PREG_SET_ORDER
);
$rows = [];
foreach ($cells as $cell) {
  $row = (int)$cell[2];
  if ($row !== $rowNum && $row !== 1) {
    continue;
  }
  $type = $cell[3] ?? '';
  $val = isset($cell[5]) && $cell[5] !== '' ? $cell[5] : (($type === 's') ? ($strings[(int)($cell[4] ?? 0)] ?? $cell[4]) : $cell[4]);
  $rows[$row][$cell[1]] = $val;
}
echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
