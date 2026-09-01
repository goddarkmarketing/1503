<?php
declare(strict_types=1);

foreach (array_slice($argv, 1) as $file) {
  echo "=== {$file} ===\n";
  $zip = new ZipArchive();
  if ($zip->open($file) !== true) {
    echo "cannot open\n\n";
    continue;
  }
  $shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
  preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
  foreach ($m[1] as $s) {
    if (preg_match('/https?|URL|Base|REST|Basic|user_id|agent|Motor|Test|UAT|03477|bangkok|wsdl|endpoint|auth/i', $s)) {
      echo $s . "\n";
    }
  }
  $zip->close();
  echo "\n";
}
