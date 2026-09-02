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

  /** @return array<string, array{province:string,plate_jw:string}> */
  private static function provincePlateIndex(): array
  {
    static $index = null;
    if ($index !== null) {
      return $index;
    }

    $index = [];
    $path = dirname(__DIR__) . '/data/bki-province-plate.json';
    $raw = is_file($path) ? file_get_contents($path) : false;
    $data = is_string($raw) ? json_decode($raw, true) : null;
    foreach (($data['items'] ?? []) as $row) {
      if (!is_array($row)) {
        continue;
      }
      $province = trim((string)($row['province'] ?? ''));
      $plateJw = trim((string)($row['plate_jw'] ?? ''));
      if ($province === '' || $plateJw === '') {
        continue;
      }
      $index[$province] = ['province' => $province, 'plate_jw' => $plateJw];
    }

    $aliases = [
      'กรุงเทพมหานคร' => 'กทม.',
      'กรุงเทพ' => 'กทม.',
      'พระนครศรีอยุธยา' => 'อยุธยา',
    ];
    foreach ($aliases as $from => $to) {
      if (isset($index[$to])) {
        $index[$from] = $index[$to];
      }
    }

    return $index;
  }

  /** @return array{province:string,plate_jw:string} */
  public static function resolveProvincePlate(string $provinceName): array
  {
    $provinceName = trim($provinceName);
    $index = self::provincePlateIndex();
    if ($provinceName !== '' && isset($index[$provinceName])) {
      return $index[$provinceName];
    }

    foreach ($index as $key => $row) {
      if ($provinceName !== '' && (mb_strpos($key, $provinceName) !== false || mb_strpos($provinceName, $key) !== false)) {
        return $row;
      }
    }

    return ['province' => $provinceName, 'plate_jw' => ''];
  }

  public static function mapIdType(string $idType): string
  {
    $map = [
      'idcard' => 'C',
      'passport' => 'P',
      'corporate' => 'R',
      'government' => 'G',
    ];
    $key = strtolower(trim($idType));
    return $map[$key] ?? 'C';
  }

  public static function mapCustType(string $idType): string
  {
    return strtolower(trim($idType)) === 'corporate' ? '2' : '1';
  }

  /** @param array<string,mixed> $pkg */
  public static function pkgField(array $pkg, array $keys, $default = '')
  {
    foreach ($keys as $key) {
      if (array_key_exists($key, $pkg) && $pkg[$key] !== null && $pkg[$key] !== '') {
        return $pkg[$key];
      }
    }
    return $default;
  }

  /**
   * Build BKI vol/transfer/policy body from quote + customer + selected package.
   *
   * @param array<string,mixed> $input
   * @return array<string,mixed>
   */
  public static function buildTransferPayload(array $input): array
  {
    $base = self::buildPremiumPayload($input);
    $customer = is_array($input['customer'] ?? null) ? $input['customer'] : $input;
    $package = is_array($input['package'] ?? null) ? $input['package'] : [];
    $plan = trim((string)($input['coverType'] ?? $input['selected_plan'] ?? '3plus'));

    $dateFr = self::formatEffDate((string)($input['coverage_start'] ?? $input['date_fr'] ?? ''));
    $dateTo = self::formatEffDate((string)($input['coverage_end'] ?? $input['date_to'] ?? ''));

    $licenseProvince = trim((string)($customer['licenseProvince'] ?? $input['regProvince'] ?? ''));
    $plateInfo = self::resolveProvincePlate($licenseProvince);
    $insuredProvince = trim((string)($customer['insuredProvince'] ?? $licenseProvince));
    $insuredPlate = self::resolveProvincePlate($insuredProvince);

    $firstName = trim((string)($customer['firstName'] ?? ''));
    $lastName = trim((string)($customer['lastName'] ?? ''));
    $fullName = trim((string)($customer['insuredName'] ?? ''));
    if ($fullName === '') {
      $fullName = trim($firstName . ' ' . $lastName);
    }

    $idType = (string)($customer['idType'] ?? 'idcard');
    $dob = self::formatEffDate((string)($customer['dob'] ?? ''));

    $grossPrem = self::pkgField($package, ['gross_prem_vol', 'premium', 'PREMIUM', 'net_premium', 'NET_PREMIUM', 'gross_total_vol'], 0);
    $stamp = self::pkgField($package, ['stamp_vol', 'stamp', 'STAMP'], 0);
    $vat = self::pkgField($package, ['vat_vol', 'vat', 'VAT'], 0);
    $total = self::pkgField($package, ['gross_total_vol', 'total_premium', 'premium_total', 'TOTAL_PREMIUM'], 0);
    if (!$total && $grossPrem) {
      $total = (float)$grossPrem + (float)$stamp + (float)$vat;
    }

    $buyComp = !empty($input['buyPrb']) || !empty($input['comp_req']) && strtoupper((string)$input['comp_req']) === 'Y';

    $payload = array_merge($base, [
      'date_fr' => $dateFr,
      'date_to' => $dateTo,
      'date_trn' => date('d/m/Y'),
      'date_agree' => date('d/m/Y'),
      'insurance_type' => trim((string)self::pkgField($package, ['insurance_type', 'INSURANCE_TYPE'], self::planInsuranceType($plan))),
      'package_no' => trim((string)self::pkgField($package, ['package_no', 'PACKAGE_NO', 'package_code', 'PACKAGE_CODE'])),
      'package_name' => trim((string)self::pkgField($package, ['package_name', 'PACKAGE_NAME', 'plan_name'])),
      'package_code' => trim((string)self::pkgField($package, ['package_code', 'PACKAGE_CODE'])),
      'package_seq' => trim((string)self::pkgField($package, ['package_seq', 'PACKAGE_SEQ'], '1')),
      'plan_seq' => trim((string)self::pkgField($package, ['plan_seq', 'PLAN_SEQ'], '1')),
      'sub_plan' => trim((string)self::pkgField($package, ['sub_plan', 'SUB_PLAN'], '')),
      'garage_type' => trim((string)($input['garage'] ?? self::pkgField($package, ['garage_type', 'GARAGE_TYPE'], ''))),
      'gross_prem_vol' => (string)$grossPrem,
      'stamp_vol' => (string)$stamp,
      'vat_vol' => (string)$vat,
      'gross_total_vol' => (string)$total,
      'total_prem' => (string)$total,
      'comp_flag' => $buyComp ? 'Y' : 'N',
      'plate_no' => trim((string)($customer['licensePlate'] ?? '')),
      'plate_jw' => $plateInfo['plate_jw'],
      'chassis' => trim((string)($customer['chassisNo'] ?? '')),
      'engine' => trim((string)($customer['engineNo'] ?? '')),
      'color_code' => trim((string)($customer['carColor'] ?? '01')),
      'body_code' => trim((string)($input['body_code'] ?? '001')),
      'make_model' => trim((string)($input['car_submodel'] ?? $input['make_model'] ?? '')),
      'accessory_flag' => 'N',
      'cust1_type' => self::mapCustType($idType),
      'cust1_foreign_flag' => 'N',
      'cust1_id_type' => self::mapIdType($idType),
      'cust1_id' => trim((string)($customer['idNumber'] ?? '')),
      'cust1_tax_id' => strtolower($idType) === 'corporate' ? trim((string)($customer['idNumber'] ?? '')) : '',
      'cust1_gender' => trim((string)($customer['gender'] ?? 'M')),
      'cust1_title' => trim((string)($customer['titleTh'] ?? '')),
      'cust1_name' => $fullName,
      'cust1_occupation' => trim((string)($customer['occupation'] ?? '001')),
      'cust1_dob' => $dob,
      'cust1_home_number' => trim((string)($customer['address'] ?? '')),
      'cust1_tambol' => trim((string)($customer['insuredSubdistrict'] ?? '')),
      'cust1_amphur_code' => trim((string)($customer['insuredDistrict'] ?? '')),
      'cust1_province_code' => $insuredPlate['province'],
      'cust1_zipcode' => trim((string)($customer['insuredPostal'] ?? '')),
      'cust1_mobile_tel' => trim((string)($customer['phone'] ?? '')),
      'cust1_email' => trim((string)($customer['email'] ?? '')),
    ]);

    $drivers = is_array($input['drivers'] ?? null) ? $input['drivers'] : [];
    $driverMode = trim((string)($input['driverMode'] ?? 'unnamed'));
    if ($driverMode === 'named' && $drivers !== []) {
      foreach (array_slice($drivers, 0, 5) as $idx => $driver) {
        if (!is_array($driver)) {
          continue;
        }
        $n = $idx + 1;
        $payload["driver{$n}_name"] = trim((string)(($driver['firstName'] ?? '') . ' ' . ($driver['lastName'] ?? '')));
        $payload["driver{$n}_id"] = trim((string)($driver['idNumber'] ?? ''));
        $payload["driver{$n}_license"] = trim((string)($driver['licenseNo'] ?? ''));
        $payload["driver{$n}_dob"] = self::formatEffDate((string)($driver['dob'] ?? ''));
      }
    }

    foreach ($payload as $key => $value) {
      if ($value === '' || $value === null) {
        unset($payload[$key]);
      }
    }

    return $payload;
  }

  public static function planInsuranceType(string $plan): string
  {
    $map = [
      '2plus' => '2+',
      '3plus' => '3+',
      '3' => '3',
    ];
    return $map[strtolower(trim($plan))] ?? '3+';
  }

  /**
   * @param mixed $body
   * @return array{status_code:?string,status_message:?string,policy_no:?string,raw:mixed}
   */
  public static function parseTransferResponse($body): array
  {
    $statusCode = null;
    $statusMessage = null;
    $policyNo = null;

    if (is_array($body)) {
      foreach (['status', 'STATUS', 'ERR_CODE', 'err_code'] as $key) {
        if (isset($body[$key]) && $body[$key] !== '') {
          $statusCode = (string)$body[$key];
          break;
        }
      }
      foreach (['status_message', 'STATUS_MESSAGE', 'message', 'ERR_MSG', 'err_msg'] as $key) {
        if (isset($body[$key]) && $body[$key] !== '') {
          $val = $body[$key];
          $statusMessage = is_array($val) ? implode(' ', array_map('strval', $val)) : (string)$val;
          break;
        }
      }
      foreach (['policy_no', 'POLICY_NO', 'pol_no', 'POL_NO', 'vol_policy_no'] as $key) {
        if (isset($body[$key]) && $body[$key] !== '') {
          $policyNo = (string)$body[$key];
          break;
        }
      }
      if ($policyNo === null && isset($body['data']) && is_array($body['data'])) {
        foreach (['policy_no', 'POLICY_NO', 'pol_no'] as $key) {
          if (!empty($body['data'][$key])) {
            $policyNo = (string)$body['data'][$key];
            break;
          }
        }
      }
    }

    return [
      'status_code' => $statusCode,
      'status_message' => $statusMessage,
      'policy_no' => $policyNo,
      'raw' => $body,
    ];
  }
}
