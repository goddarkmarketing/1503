<?php
declare(strict_types=1);

$file = $argv[1] ?? '';
if ($file === '' || !is_file($file)) {
  fwrite(STDERR, "Usage: php dump-xlsx-all-strings.php <file.xlsx>\n");
  exit(1);
}

$zip = new ZipArchive();
$zip->open($file);
$shared = $zip->getFromName('xl/sharedStrings.xml') ?: '';
preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $shared, $m);
foreach ($m[1] as $i => $t) {
  echo ($i + 1) . ': ' . $t . PHP_EOL;
}
