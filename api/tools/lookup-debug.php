<?php
declare(strict_types=1);
$f = $argv[1] ?? '';
$z = new ZipArchive();
$z->open($f);
$s = $z->getFromName('xl/sharedStrings.xml');
preg_match_all('/<t(?:[^>]*)>([^<]*)<\/t>/', $s, $m);
$idx = array_search('TO327-03', $m[1], true);
echo "TO327-03 string index: " . var_export($idx, true) . PHP_EOL;
$xml = $z->getFromName('xl/worksheets/sheet1.xml');
if ($idx !== false && preg_match('/<v>' . $idx . '<\\/v>/', $xml, $mm)) {
  echo "Found cell reference nearby\n";
}
preg_match_all('/<c[^>]*r="([A-Z]+\d+)"[^>]*t="s"[^>]*><v>(\d+)<\\/v>/', $xml, $cells, PREG_SET_ORDER);
foreach ($cells as $c) {
  if ((int)$c[2] === $idx) {
    echo "Cell {$c[1]} = TO327-03\n";
  }
}
echo 'Total shared strings: ' . count($m[1]) . PHP_EOL;
echo 'Total s-cells: ' . count($cells) . PHP_EOL;
