<?php
declare(strict_types=1);

$files = array_slice($argv, 1);
if (!$files) {
  fwrite(STDERR, "Usage: php read-xlsx.php <file.xlsx>...\n");
  exit(1);
}

foreach ($files as $file) {
  echo "=== {$file} ===\n";
  if (!is_file($file)) {
    echo "missing\n\n";
    continue;
  }

  $zip = new ZipArchive();
  if ($zip->open($file) !== true) {
    echo "cannot open\n\n";
    continue;
  }

  $shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
  $strings = [];
  if ($shared !== '') {
    preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
    $strings = $m[1];
  }

  for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = $zip->getNameIndex($i);
    if (!preg_match('#xl/worksheets/sheet\d+\.xml#', $name)) {
      continue;
    }

    $xml = $zip->getFromName($name);
    if ($xml === false) {
      continue;
    }

    echo "-- {$name} --\n";
    preg_match_all(
      '/<c[^>]*r="([A-Z]+\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t>([^<]*)<\/t><\/is>)/',
      $xml,
      $cells,
      PREG_SET_ORDER
    );

    $rows = [];
    foreach ($cells as $cell) {
      $ref = $cell[1];
      preg_match('/(\d+)/', $ref, $rm);
      $row = (int)$rm[1];
      $type = $cell[2] ?? '';
      if (isset($cell[4]) && $cell[4] !== '') {
        $val = $cell[4];
      } elseif ($type === 's') {
        $val = $strings[(int)($cell[3] ?? 0)] ?? ($cell[3] ?? '');
      } else {
        $val = $cell[3] ?? '';
      }
      $rows[$row][] = $val;
    }

    ksort($rows);
    foreach ($rows as $rnum => $cols) {
      $line = implode(' | ', $cols);
      if (preg_match('/https?|URL|Base|REST|Basic|user_id|agent_code|agent_seq|Motor|Test|UAT|03477|bangkokinsurance/i', $line)) {
        echo "R{$rnum}: {$line}\n";
      }
    }
  }

  $zip->close();
  echo "\n";
}
