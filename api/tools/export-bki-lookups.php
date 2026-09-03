<?php
declare(strict_types=1);

/**
 * Export BKI lookup xlsx sheets to JSON for voluntary issue dropdowns.
 *
 * Usage:
 *   php export-bki-lookups.php
 *   php export-bki-lookups.php <lookup-dir> <out-dir>
 */
$lookupDir = $argv[1] ?? dirname(__DIR__, 2)
  . '/Send to Partner - API_20260827/_lookup_extract/Look up_20260116/Look up';
$outDir = $argv[2] ?? dirname(__DIR__) . '/data';

if (!is_dir($lookupDir)) {
  fwrite(STDERR, "Lookup dir not found: {$lookupDir}\n");
  exit(1);
}
if (!is_dir($outDir)) {
  mkdir($outDir, 0775, true);
}

function xlsxRows(string $file): array
{
  $zip = new ZipArchive();
  if ($zip->open($file) !== true) {
    throw new RuntimeException("Cannot open {$file}");
  }
  $shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
  $strings = [];
  if ($shared !== '') {
    preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
    $strings = $m[1];
  }
  $xml = $zip->getFromName('xl/worksheets/sheet1.xml') ?: '';
  $zip->close();

  preg_match_all(
    '/<c\b([^>]*)>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)?/u',
    $xml,
    $cells,
    PREG_SET_ORDER
  );

  $rows = [];
  foreach ($cells as $cell) {
    $attrs = $cell[1] ?? '';
    if (!preg_match('/\br="([A-Z]+)(\d+)"/', $attrs, $rm)) {
      continue;
    }
    $col = $rm[1];
    $row = (int)$rm[2];
    $type = '';
    if (preg_match('/\bt="([^"]*)"/', $attrs, $tm)) {
      $type = $tm[1];
    }
    $raw = $cell[2] ?? '';
    $inline = $cell[3] ?? '';
    if ($inline !== '') {
      $val = $inline;
    } elseif ($type === 's') {
      $val = $strings[(int)$raw] ?? $raw;
    } else {
      $val = $raw;
    }
    $rows[$row][$col] = trim(html_entity_decode((string)$val, ENT_QUOTES | ENT_XML1, 'UTF-8'));
  }
  ksort($rows);
  return $rows;
}

function writeJson(string $path, array $payload): void
{
  file_put_contents(
    $path,
    json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  );
  echo 'Wrote ' . count($payload['items'] ?? []) . " → {$path}\n";
}

function cell(array $cols, string $letter): string
{
  return trim((string)($cols[$letter] ?? ''));
}

$exports = [];

// title.xlsx → C = Thai title, B = category group
$titleFile = $lookupDir . '/title.xlsx';
if (is_file($titleFile)) {
  $items = [];
  $seen = [];
  foreach (xlsxRows($titleFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $title = cell($cols, 'C');
    $group = cell($cols, 'B');
    if ($title === '' || ctype_digit($title) || isset($seen[$title])) continue;
    $seen[$title] = true;
    $items[] = [
      'value' => $title,
      'label' => $title,
      'group' => $group,
    ];
  }
  $priority = ['นาย' => 1, 'นาง' => 2, 'นางสาว' => 3, 'เด็กชาย' => 4, 'เด็กหญิง' => 5, 'คุณ' => 6, 'บริษัท' => 7, 'ห้างหุ้นส่วนจำกัด' => 8];
  usort($items, static function ($a, $b) use ($priority) {
    $pa = $priority[$a['value']] ?? 999;
    $pb = $priority[$b['value']] ?? 999;
    if ($pa !== $pb) return $pa <=> $pb;
    return strcmp($a['value'], $b['value']);
  });
  $exports['bki-lookup-titles.json'] = [
    'source' => basename($titleFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// color_code.xlsx
$colorFile = $lookupDir . '/color_code.xlsx';
if (is_file($colorFile)) {
  $items = [];
  foreach (xlsxRows($colorFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $code = cell($cols, 'B');
    $name = cell($cols, 'C');
    if ($code === '' || $name === '') continue;
    $items[] = [
      'value' => $code,
      'label' => $code . ' — ' . $name,
      'name' => $name,
      'name_en' => cell($cols, 'D'),
    ];
  }
  $exports['bki-lookup-colors.json'] = [
    'source' => basename($colorFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// occupation.xlsx
$occFile = $lookupDir . '/occupation.xlsx';
if (is_file($occFile)) {
  $items = [];
  foreach (xlsxRows($occFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $code = cell($cols, 'B');
    $name = cell($cols, 'C');
    if ($code === '' || $name === '') continue;
    $items[] = [
      'value' => $code,
      'label' => $code . ' — ' . $name,
      'group' => cell($cols, 'A'),
      'name' => $name,
    ];
  }
  $exports['bki-lookup-occupations.json'] = [
    'source' => basename($occFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// cust_id_type.xlsx
$idTypeFile = $lookupDir . '/cust_id_type.xlsx';
if (is_file($idTypeFile)) {
  $items = [];
  foreach (xlsxRows($idTypeFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $code = cell($cols, 'A');
    $name = cell($cols, 'B');
    if ($code === '') continue;
    $items[] = [
      'value' => $code,
      'label' => $code . ' — ' . ($name !== '' ? $name : cell($cols, 'C')),
      'name' => $name,
      'description' => cell($cols, 'C'),
    ];
  }
  $exports['bki-lookup-id-types.json'] = [
    'source' => basename($idTypeFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// driver_license_type.xlsx
$licFile = $lookupDir . '/driver_license_type.xlsx';
if (is_file($licFile)) {
  $items = [];
  foreach (xlsxRows($licFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $code = cell($cols, 'A');
    $name = cell($cols, 'B');
    if ($code === '') continue;
    $items[] = [
      'value' => $code,
      'label' => $code . ' — ' . $name,
      'name' => $name,
    ];
  }
  $exports['bki-lookup-license-types.json'] = [
    'source' => basename($licFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// jw_amph_tumb_code.xlsx — province/amphur/tambol/zip hierarchy
$tumbFile = $lookupDir . '/jw_amph_tumb_code.xlsx';
if (is_file($tumbFile)) {
  $items = [];
  $seen = [];
  foreach (xlsxRows($tumbFile) as $rnum => $cols) {
    if ($rnum <= 2) continue;
    $provCode = cell($cols, 'B');
    $amphCode = cell($cols, 'C');
    $tumbCode = cell($cols, 'D');
    $tumbName = cell($cols, 'E');
    $amphName = cell($cols, 'F');
    $provName = cell($cols, 'G');
    $zip = cell($cols, 'K');
    if ($provCode === '' || $amphCode === '' || $tumbCode === '') continue;
    $key = "{$provCode}|{$amphCode}|{$tumbCode}";
    if (isset($seen[$key])) continue;
    $seen[$key] = true;
    $items[] = [
      'province_code' => $provCode,
      'province_name' => $provName,
      'amphur_code' => $amphCode,
      'amphur_name' => $amphName,
      'tambol_code' => $tumbCode,
      'tambol_name' => $tumbName,
      'zipcode' => $zip,
    ];
  }
  $exports['bki-lookup-geo.json'] = [
    'source' => basename($tumbFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

// accessory.xlsx
$accFile = $lookupDir . '/accessory.xlsx';
if (is_file($accFile)) {
  $items = [];
  foreach (xlsxRows($accFile) as $rnum => $cols) {
    if ($rnum === 1) continue;
    $code = cell($cols, 'A');
    $name = cell($cols, 'B');
    if ($code === '' || $name === '') continue;
    $items[] = [
      'value' => $code,
      'label' => $code . ' — ' . $name,
      'name' => $name,
      'name_en' => cell($cols, 'C'),
    ];
  }
  $exports['bki-lookup-accessories.json'] = [
    'source' => basename($accFile),
    'exported_at' => gmdate('c'),
    'items' => $items,
  ];
}

foreach ($exports as $file => $payload) {
  writeJson($outDir . '/' . $file, $payload);
}

echo "Done.\n";
