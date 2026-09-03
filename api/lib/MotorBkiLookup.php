<?php
declare(strict_types=1);

/**
 * BKI voluntary motor lookup catalogs (titles, colors, geo, etc.).
 */
final class MotorBkiLookup
{
  /** @var array<string, array|null> */
  private static array $cache = [];

  public static function dataDir(): string
  {
    return dirname(__DIR__) . '/data';
  }

  /** @return array{items:array<int,array<string,mixed>>} */
  public static function load(string $name): array
  {
    if (array_key_exists($name, self::$cache)) {
      return self::$cache[$name] ?? ['items' => []];
    }

    $map = [
      'titles' => 'bki-lookup-titles.json',
      'colors' => 'bki-lookup-colors.json',
      'occupations' => 'bki-lookup-occupations.json',
      'id-types' => 'bki-lookup-id-types.json',
      'license-types' => 'bki-lookup-license-types.json',
      'geo' => 'bki-lookup-geo.json',
      'accessories' => 'bki-lookup-accessories.json',
      'provinces-plate' => 'bki-province-plate.json',
    ];

    if (!isset($map[$name])) {
      self::$cache[$name] = ['items' => []];
      return self::$cache[$name];
    }

    $path = self::dataDir() . '/' . $map[$name];
    if (!is_file($path)) {
      self::$cache[$name] = ['items' => []];
      return self::$cache[$name];
    }

    $raw = file_get_contents($path);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    self::$cache[$name] = is_array($data) ? $data : ['items' => []];
    if (!isset(self::$cache[$name]['items']) || !is_array(self::$cache[$name]['items'])) {
      self::$cache[$name]['items'] = [];
    }
    return self::$cache[$name];
  }

  /**
   * @return array{
   *   titles:array<int,array<string,mixed>>,
   *   colors:array<int,array<string,mixed>>,
   *   occupations:array<int,array<string,mixed>>,
   *   id_types:array<int,array<string,mixed>>,
   *   license_types:array<int,array<string,mixed>>,
   *   accessories:array<int,array<string,mixed>>,
   *   provinces:array<int,array<string,mixed>>
   * }
   */
  public static function catalogs(): array
  {
    $geo = self::load('geo')['items'];
    $provinces = [];
    $seen = [];
    foreach ($geo as $row) {
      if (!is_array($row)) continue;
      $code = (string)($row['province_code'] ?? '');
      $name = (string)($row['province_name'] ?? '');
      if ($code === '' || isset($seen[$code])) continue;
      $seen[$code] = true;
      $provinces[] = [
        'value' => $code,
        'label' => $name !== '' ? $name : $code,
        'name' => $name,
        'code' => $code,
      ];
    }

    $plate = self::load('provinces-plate')['items'];
    foreach ($plate as $row) {
      if (!is_array($row)) continue;
      $name = (string)($row['province'] ?? '');
      if ($name === '') continue;
      // Keep plate_jw provinces available by Thai name for plate selection.
    }

    return [
      'titles' => self::load('titles')['items'],
      'colors' => self::load('colors')['items'],
      'occupations' => self::load('occupations')['items'],
      'id_types' => self::load('id-types')['items'],
      'license_types' => self::load('license-types')['items'],
      'accessories' => self::load('accessories')['items'],
      'provinces' => $provinces,
      'provinces_plate' => array_values(array_filter(array_map(static function ($row) {
        if (!is_array($row)) return null;
        $name = trim((string)($row['province'] ?? ''));
        $jw = trim((string)($row['plate_jw'] ?? ''));
        if ($name === '' || $jw === '') return null;
        return [
          'value' => $name,
          'label' => $name . ' (' . $jw . ')',
          'plate_jw' => $jw,
          'name' => $name,
        ];
      }, $plate))),
    ];
  }

  /** @return array<int,array<string,mixed>> */
  public static function amphurs(string $provinceCode): array
  {
    $provinceCode = trim($provinceCode);
    $out = [];
    $seen = [];
    foreach (self::load('geo')['items'] as $row) {
      if (!is_array($row)) continue;
      if ((string)($row['province_code'] ?? '') !== $provinceCode) continue;
      $code = (string)($row['amphur_code'] ?? '');
      if ($code === '' || isset($seen[$code])) continue;
      $seen[$code] = true;
      $out[] = [
        'value' => $code,
        'label' => (string)($row['amphur_name'] ?? $code),
        'name' => (string)($row['amphur_name'] ?? ''),
        'code' => $code,
        'province_code' => $provinceCode,
      ];
    }
    return $out;
  }

  /** @return array<int,array<string,mixed>> */
  public static function tambols(string $provinceCode, string $amphurCode): array
  {
    $provinceCode = trim($provinceCode);
    $amphurCode = trim($amphurCode);
    $out = [];
    foreach (self::load('geo')['items'] as $row) {
      if (!is_array($row)) continue;
      if ((string)($row['province_code'] ?? '') !== $provinceCode) continue;
      if ((string)($row['amphur_code'] ?? '') !== $amphurCode) continue;
      $code = (string)($row['tambol_code'] ?? '');
      $name = (string)($row['tambol_name'] ?? '');
      if ($code === '') continue;
      $out[] = [
        'value' => $code,
        'label' => $name !== '' ? $name : $code,
        'name' => $name,
        'code' => $code,
        'zipcode' => (string)($row['zipcode'] ?? ''),
        'province_code' => $provinceCode,
        'amphur_code' => $amphurCode,
      ];
    }
    return $out;
  }

  /** Resolve BKI province code from Thai province name (geo or plate lookup). */
  public static function resolveProvinceCode(string $provinceName): string
  {
    $provinceName = trim($provinceName);
    if ($provinceName === '') return '';

    if (preg_match('/^\d{1,2}$/', $provinceName)) {
      return str_pad($provinceName, 2, '0', STR_PAD_LEFT);
    }

    $aliases = [
      'กรุงเทพมหานคร' => 'กทม.',
      'กรุงเทพ' => 'กทม.',
      'พระนครศรีอยุธยา' => 'อยุธยา',
    ];
    $needle = $aliases[$provinceName] ?? $provinceName;

    foreach (self::load('geo')['items'] as $row) {
      if (!is_array($row)) continue;
      $name = (string)($row['province_name'] ?? '');
      if ($name === $needle || $name === $provinceName) {
        return (string)($row['province_code'] ?? '');
      }
    }

    return '';
  }

  /**
   * Resolve amphur code from province code + amphur Thai name.
   */
  public static function resolveAmphurCode(string $provinceCode, string $amphurNameOrCode): string
  {
    $amphurNameOrCode = trim($amphurNameOrCode);
    if ($amphurNameOrCode === '') return '';
    if (preg_match('/^\d{1,2}$/', $amphurNameOrCode)) {
      return str_pad($amphurNameOrCode, 2, '0', STR_PAD_LEFT);
    }
    foreach (self::amphurs($provinceCode) as $row) {
      if (($row['name'] ?? '') === $amphurNameOrCode || ($row['label'] ?? '') === $amphurNameOrCode) {
        return (string)$row['code'];
      }
    }
    return '';
  }

  /**
   * Resolve tambol name/code from province+amphur + tambol name/code.
   * @return array{code:string,name:string,zipcode:string}
   */
  public static function resolveTambol(string $provinceCode, string $amphurCode, string $tambolNameOrCode): array
  {
    $tambolNameOrCode = trim($tambolNameOrCode);
    if ($tambolNameOrCode === '') {
      return ['code' => '', 'name' => '', 'zipcode' => ''];
    }
    foreach (self::tambols($provinceCode, $amphurCode) as $row) {
      if (($row['code'] ?? '') === $tambolNameOrCode
        || ($row['name'] ?? '') === $tambolNameOrCode
        || ($row['label'] ?? '') === $tambolNameOrCode) {
        return [
          'code' => (string)$row['code'],
          'name' => (string)$row['name'],
          'zipcode' => (string)($row['zipcode'] ?? ''),
        ];
      }
    }
    return ['code' => $tambolNameOrCode, 'name' => $tambolNameOrCode, 'zipcode' => ''];
  }
}
