<?php
declare(strict_types=1);

/**
 * BKI voluntary motor — lookup data + request/response helpers for agent API.
 */
final class MotorBkiVol
{
  private static ?array $catalog = null;

  public static function catalogPath(): string
  {
    return dirname(__DIR__) . '/data/bki-vol-car-codes.json';
  }

  /** @return array{source?:string,items:array<int,array<string,mixed>>} */
  public static function catalog(): array
  {
    if (self::$catalog !== null) {
      return self::$catalog;
    }

    $path = self::catalogPath();
    if (!is_file($path)) {
      self::$catalog = ['items' => []];
      return self::$catalog;
    }

    $raw = file_get_contents($path);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    self::$catalog = is_array($data) ? $data : ['items' => []];
    if (!isset(self::$catalog['items']) || !is_array(self::$catalog['items'])) {
      self::$catalog['items'] = [];
    }

    foreach (self::$catalog['items'] as &$row) {
      if (is_array($row) && isset($row['desc'])) {
        $row['desc'] = self::normalizeCarDesc((string)$row['desc']);
      }
    }
    unset($row);

    return self::$catalog;
  }

  /** Remove consecutive duplicate tokens from BKI lookup descriptions. */
  public static function normalizeCarDesc(string $desc): string
  {
    $desc = trim(preg_replace('/\s+/u', ' ', $desc) ?? '');
    if ($desc === '') {
      return '';
    }

    $parts = preg_split('/\s+/u', $desc) ?: [];
    $out = [];
    foreach ($parts as $part) {
      if ($out !== [] && strcasecmp((string)end($out), $part) === 0) {
        continue;
      }
      $out[] = $part;
    }

    return implode(' ', $out);
  }

  /** @param callable(array,string):string $cell */
  public static function buildCarDescFromLookupRow(callable $cell, array $cols): string
  {
    $carName = $cell($cols, 'C');
    $option = $cell($cols, 'H');
    $sub2 = $cell($cols, 'G');
    $extra = '';
    if ($sub2 !== '' && preg_match('/(\([^)]+\)(?:\s+[^\s]+)*)\s*$/u', $sub2, $m)) {
      $extra = trim($m[1]);
    }

    return self::normalizeCarDesc(trim(implode(' ', array_filter([$carName, $option, $extra]))));
  }

  /** @return array<int,string> */
  public static function listMakes(): array
  {
    $makes = [];
    foreach (self::catalog()['items'] ?? [] as $row) {
      if (!is_array($row)) {
        continue;
      }
      $rowMake = strtoupper(trim((string)($row['make'] ?? '')));
      if ($rowMake !== '') {
        $makes[$rowMake] = true;
      }
    }

    $makeList = array_keys($makes);
    sort($makeList, SORT_STRING);

    return $makeList;
  }

  /**
   * @return array{items:array<int,array<string,mixed>>,makes:array<int,string>}
   */
  public static function searchCarCodes(string $make = '', string $q = '', int $limit = 80): array
  {
    $make = strtoupper(trim($make));
    $q = trim($q);
    $limit = max(1, min(200, $limit));
    $items = self::catalog()['items'] ?? [];
    $out = [];

    foreach ($items as $row) {
      if (!is_array($row)) {
        continue;
      }
      $rowMake = strtoupper(trim((string)($row['make'] ?? '')));
      if ($make !== '' && $rowMake !== $make) {
        continue;
      }
      if ($q !== '') {
        $hay = strtoupper(implode(' ', [
          (string)($row['make_code'] ?? ''),
          (string)($row['desc'] ?? ''),
          (string)($row['make'] ?? ''),
          (string)($row['car_year'] ?? ''),
        ]));
        if (strpos($hay, strtoupper($q)) === false) {
          continue;
        }
      }
      $out[] = $row;
      if (count($out) >= $limit) {
        break;
      }
    }

    return [
      'items' => $out,
      'makes' => self::listMakes(),
    ];
  }

  /** @return array<string,mixed>|null */
  public static function findCarVariant(string $makeCode, string $carYear): ?array
  {
    $makeCode = trim($makeCode);
    $carYear = trim($carYear);
    foreach (self::catalog()['items'] ?? [] as $row) {
      if (!is_array($row)) {
        continue;
      }
      if ((string)($row['make_code'] ?? '') === $makeCode
        && (string)($row['car_year'] ?? '') === $carYear) {
        return $row;
      }
    }
    return null;
  }

  /**
   * Build BKI vol/premium/calculate body (legacy + v1.4 field names).
   *
   * @param array<string,mixed> $input
   * @return array<string,mixed>
   */
  public static function buildPremiumPayload(array $input): array
  {
    $makeCode = trim((string)($input['make_code'] ?? $input['car_code'] ?? ''));
    $carYear = trim((string)($input['car_year'] ?? ''));
    $variant = ($makeCode !== '' && $carYear !== '')
      ? self::findCarVariant($makeCode, $carYear)
      : null;

    $make = strtoupper(trim((string)($input['make'] ?? $input['car_brand'] ?? ($variant['make'] ?? ''))));
    $effDate = self::formatEffDate((string)($input['eff_date'] ?? $input['coverage_start'] ?? ''));
    $sumIns = trim((string)($input['sum_ins'] ?? $input['sumInsured'] ?? ''));
    if ($sumIns === '' && $variant) {
      $min = (int)($variant['sum_ins_min'] ?? 0);
      $max = (int)($variant['sum_ins_max'] ?? 0);
      $sumIns = (string)($min > 0 ? $min : ($max > 0 ? $max : 0));
    }

    $agentRef = trim((string)($input['agent_ref_no'] ?? ''));
    if ($agentRef === '') {
      $agentRef = 'KB-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
    }

    $carType = trim((string)($input['car_type'] ?? ($variant['car_type'] ?? '1')));
    $carUse = trim((string)($input['car_use'] ?? ($variant['car_use'] ?? '1')));
    if (preg_match('/^\d{3,}$/', $carUse)) {
      $carUse = '1';
    }

    $body = [
      'eff_date' => $effDate,
      'risk' => trim((string)($input['risk'] ?? '1')),
      'garage' => trim((string)($input['garage'] ?? '')),
      'car_type' => $carType,
      'car_use' => $carUse,
      'make' => $make,
      'make_code' => $makeCode,
      'car_brand' => $make,
      'car_code' => $makeCode,
      'car_year' => $carYear,
      'cc' => trim((string)($input['cc'] ?? ($variant['cc'] ?? '0'))),
      'seat' => trim((string)($input['seat'] ?? ($variant['seat'] ?? '5'))),
      'weight' => trim((string)($input['weight'] ?? ($variant['weight'] ?? '0'))),
      'zone_use' => trim((string)($input['zone_use'] ?? '1')),
      'ncb' => trim((string)($input['ncb'] ?? '0')),
      'deduct' => trim((string)($input['deduct'] ?? '0')),
      'deduct_lib' => trim((string)($input['deduct_lib'] ?? '0')),
      'comp_req' => trim((string)($input['comp_req'] ?? 'N')),
      'sum_ins' => $sumIns,
      'agent_ref_no' => $agentRef,
    ];

    foreach ($body as $key => $value) {
      if ($value === '') {
        unset($body[$key]);
      }
    }

    return $body;
  }

  /**
   * @param mixed $body
   * @return array{status_code:?string,status_message:?string,packages:array<int,array<string,mixed>>,raw:mixed}
   */
  public static function parsePremiumResponse($body): array
  {
    $packages = [];
    $statusCode = null;
    $statusMessage = null;

    if (is_array($body)) {
      if (isset($body['status']) || isset($body['STATUS'])) {
        $statusCode = (string)($body['status'] ?? $body['STATUS'] ?? '');
      }
      if (isset($body['status_message']) || isset($body['STATUS_MESSAGE']) || isset($body['message'])) {
        $statusMessage = (string)($body['status_message'] ?? $body['STATUS_MESSAGE'] ?? $body['message'] ?? '');
      }

      $list = null;
      if (isset($body['packages']) && is_array($body['packages'])) {
        $list = $body['packages'];
      } elseif (isset($body['data']) && is_array($body['data'])) {
        $list = $body['data'];
      } elseif (array_is_list($body)) {
        $list = $body;
      }

      if (is_array($list)) {
        foreach ($list as $row) {
          if (is_array($row)) {
            $packages[] = $row;
          }
        }
      }
    }

    return [
      'status_code' => $statusCode,
      'status_message' => $statusMessage,
      'packages' => $packages,
      'raw' => $body,
    ];
  }

  public static function formatEffDate(string $value): string
  {
    $value = trim($value);
    if ($value === '') {
      return date('d/m/Y');
    }
    if (preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', $value)) {
      return $value;
    }
    if (preg_match('#^(\d{4})-(\d{2})-(\d{2})$#', $value, $m)) {
      return $m[3] . '/' . $m[2] . '/' . $m[1];
    }
    return date('d/m/Y');
  }
}
