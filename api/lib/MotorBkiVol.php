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
   * Spec v1.4 requires consent_drv + drv_flag on every premium request.
   * Named-driver fields (drv_year / drv1_*) are conditional when drv_flag=Y.
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

    $named = strtolower(trim((string)($input['driverMode'] ?? $input['driver_mode'] ?? ''))) === 'named'
      || strtoupper(trim((string)($input['drv_flag'] ?? ''))) === 'Y';
    $consentDrv = strtoupper(trim((string)($input['consent_drv'] ?? 'N')));
    if ($consentDrv !== 'Y') {
      $consentDrv = 'N';
    }
    // Quote-time premium calc usually has no driver IDs yet — use unnamed rates.
    $hasDriverId = trim((string)($input['drv1_id'] ?? $input['driver1_id'] ?? '')) !== '';
    if ($named && !$hasDriverId) {
      $named = false;
    }

    // BKI guidance: leave risk/garage empty on premium calculate so all packages return first.
    // Filtering by garage/risk happens after the agent picks a package (transfer/issue).
    $garage = '';
    $risk = '';
    $plateJw = trim((string)($input['plate_jw'] ?? ''));
    if ($plateJw === '') {
      $province = trim((string)($input['regProvince'] ?? $input['licenseProvince'] ?? ''));
      if ($province !== '') {
        $plateJw = self::resolveProvincePlate($province)['plate_jw'] ?? '';
      }
    }

    $body = [
      'eff_date' => $effDate,
      'risk' => $risk,
      'garage' => $garage,
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
      'comp_req' => trim((string)($input['comp_req'] ?? (
        !empty($input['buyPrb']) || strtoupper(trim((string)($input['comp_flag'] ?? ''))) === 'Y' ? 'Y' : 'N'
      ))),
      'sum_ins' => $sumIns,
      'agent_ref_no' => $agentRef,
      'cctv_flag' => strtoupper(trim((string)($input['cctv_flag'] ?? $input['dashcam'] ?? 'N'))) === 'Y' ? 'Y' : 'N',
      'drv_flag' => $named ? 'Y' : 'N',
      'consent_drv' => $named ? $consentDrv : 'N',
      'plate_jw' => $plateJw,
    ];

    if ($named) {
      $drvYear = trim((string)($input['drv_year'] ?? $input['driverYear'] ?? ''));
      if ($drvYear === '' && !empty($input['drv1_dob'])) {
        $dob = (string)$input['drv1_dob'];
        if (preg_match('/(\d{4})/', $dob, $m)) {
          $drvYear = $m[1];
        }
      }
      if ($drvYear !== '') {
        $body['drv_year'] = $drvYear;
      }
      foreach ([1, 2, 3, 4, 5] as $i) {
        $id = trim((string)($input["drv{$i}_id"] ?? $input["driver{$i}_id"] ?? ''));
        $lc = trim((string)($input["drv{$i}_lc"] ?? $input["drv{$i}_license_no"] ?? $input["driver{$i}_license"] ?? ''));
        $score = trim((string)($input["drv{$i}_score"] ?? ''));
        if ($id !== '') {
          $body["drv{$i}_id"] = $id;
        }
        if ($lc !== '') {
          $body["drv{$i}_lc"] = $lc;
        }
        if ($score !== '') {
          $body["drv{$i}_score"] = $score;
        }
      }
    }

    foreach ($body as $key => $value) {
      if ($value === '') {
        unset($body[$key]);
      }
    }

    return $body;
  }

  /** Map UI garage labels to BKI codes: D=dealer, G=general. */
  public static function normalizeGarageCode(string $value): string
  {
    $raw = trim($value);
    if ($raw === '') {
      return '';
    }
    $upper = strtoupper($raw);
    if ($upper === 'D' || $upper === 'DG') {
      return 'D';
    }
    if ($upper === 'G' || $upper === 'GG') {
      return 'G';
    }
    $lower = strtolower($raw);
    if (in_array($lower, ['dealer', 'dealership', 'showroom'], true)) {
      return 'D';
    }
    if (in_array($lower, ['garage', 'general', 'อู่', 'ซ่อมอู่'], true)) {
      return 'G';
    }
    if (mb_strpos($raw, 'ห้าง') !== false) {
      return 'D';
    }
    if (mb_strpos($raw, 'อู่') !== false) {
      return 'G';
    }
    return '';
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
      if (isset($body['ERR_CODE']) || isset($body['err_code'])) {
        $statusCode = $statusCode ?: (string)($body['ERR_CODE'] ?? $body['err_code'] ?? '');
      }
      if (isset($body['ERR_MSG']) || isset($body['err_msg'])) {
        $err = $body['ERR_MSG'] ?? $body['err_msg'];
        $statusMessage = $statusMessage ?: (is_array($err) ? implode(' ', array_map('strval', $err)) : (string)$err);
      }

      $list = self::extractPackageList($body);
      if (is_array($list)) {
        foreach ($list as $row) {
          if (is_array($row) && !array_is_list($row)) {
            $packages[] = self::normalizePremiumPackage($row);
          }
        }
      }

      if (($statusMessage === null || $statusMessage === '') && $packages !== []) {
        $first = $packages[0];
        $pkgStatus = trim((string)($first['status'] ?? ''));
        $packname = trim((string)($first['packname'] ?? $first['package_name'] ?? ''));
        if ($pkgStatus !== '' && $pkgStatus !== '0' && !self::packagesHavePremium($packages)) {
          $statusMessage = $packname !== ''
            ? $packname
            : ('BKI package status=' . $pkgStatus);
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

  /** @param array<string,mixed> $pkg */
  private static function normalizePremiumPackage(array $pkg): array
  {
    $aliases = [
      'package_name' => ['packname', 'PACKNAME', 'packageName'],
      'total_prem_vol' => ['TOTAL_PREM_VOL', 'totalPremVol', 'TotalPremVol', 'gross_total_vol', 'GROSS_TOTAL_VOL'],
      'gross_prem_vol' => ['GROSS_PREM_VOL', 'grossPremVol', 'GrossPremVol'],
      'stamp' => ['STAMP', 'stamp_vol', 'STAMP_VOL', 'stampVol'],
      'vat' => ['VAT', 'vat_vol', 'VAT_VOL', 'vatVol'],
      'pack_no' => ['PACK_NO', 'package_no', 'PACKAGE_NO'],
    ];
    foreach ($aliases as $target => $sources) {
      if (!isset($pkg[$target]) || $pkg[$target] === '' || $pkg[$target] === null) {
        foreach ($sources as $source) {
          if (isset($pkg[$source]) && $pkg[$source] !== '' && $pkg[$source] !== null) {
            $pkg[$target] = $pkg[$source];
            break;
          }
        }
      }
    }

    // Preserve compact sum-insured choices before dropping the large phase list.
    foreach (['sumins_phase', 'SUMINS_PHASE'] as $phaseKey) {
      if (!isset($pkg[$phaseKey]) || !is_array($pkg[$phaseKey])) {
        continue;
      }
      $opts = [];
      foreach ($pkg[$phaseKey] as $value) {
        if (is_numeric($value) && (float)$value > 0) {
          $opts[] = (float)$value;
        }
      }
      if ($opts !== []) {
        $pkg['sumins_options'] = array_values(array_unique($opts));
      }
      unset($pkg[$phaseKey]);
    }

    $amount = self::packagePremiumAmount($pkg);
    if ($amount !== null) {
      $pkg['premium_total'] = $amount;
      if (!isset($pkg['total_prem_vol']) || $pkg['total_prem_vol'] === '' || $pkg['total_prem_vol'] === null
        || (float)$pkg['total_prem_vol'] <= 0) {
        $pkg['total_prem_vol'] = $amount;
      }
    }

    // Keep payload small for browser dataset storage.
    unset($pkg['ncb_phase'], $pkg['NCB_PHASE']);

    return $pkg;
  }

  /**
   * Final voluntary premium from a BKI package row (spec: total_prem_vol).
   *
   * @param array<string,mixed> $pkg
   */
  public static function packagePremiumAmount(array $pkg): ?float
  {
    $total = self::pkgField($pkg, [
      'premium_total', 'total_prem_vol', 'TOTAL_PREM_VOL', 'totalPremVol',
      'gross_total_vol', 'GROSS_TOTAL_VOL', 'grossTotalVol',
      'total_prem', 'TOTAL_PREM', 'total_premium', 'TOTAL_PREMIUM',
    ], null);
    if ($total !== null && $total !== '' && is_numeric($total) && (float)$total > 0) {
      return round((float)$total, 2);
    }

    $gross = self::pkgField($pkg, ['gross_prem_vol', 'GROSS_PREM_VOL', 'grossPremVol', 'premium', 'PREMIUM'], null);
    if ($gross === null || $gross === '' || !is_numeric($gross) || (float)$gross <= 0) {
      return null;
    }
    $stamp = self::pkgField($pkg, ['stamp_vol', 'STAMP_VOL', 'stamp', 'STAMP'], 0);
    $vat = self::pkgField($pkg, ['vat_vol', 'VAT_VOL', 'vat', 'VAT'], 0);
    $stampN = is_numeric($stamp) ? (float)$stamp : 0.0;
    $vatN = is_numeric($vat) ? (float)$vat : 0.0;
    return round((float)$gross + $stampN + $vatN, 2);
  }

  /** @param array<int,array<string,mixed>> $packages */
  public static function packagesHavePremium(array $packages): bool
  {
    foreach ($packages as $pkg) {
      if (is_array($pkg) && self::packagePremiumAmount($pkg) !== null) {
        return true;
      }
    }
    return false;
  }

  /**
   * Pick nearest allowed sum insured from package sumins_options / sumins_phase.
   *
   * @param array<int,array<string,mixed>> $packages
   */
  public static function suggestSumInsFromPackages(array $packages, $requested): ?string
  {
    $req = is_numeric($requested) ? (float)$requested : 0.0;
    foreach ($packages as $pkg) {
      if (!is_array($pkg)) {
        continue;
      }
      $opts = $pkg['sumins_options'] ?? $pkg['sumins_phase'] ?? $pkg['SUMINS_PHASE'] ?? null;
      if (!is_array($opts) || $opts === []) {
        continue;
      }
      $best = null;
      $bestDist = null;
      foreach ($opts as $opt) {
        if (!is_numeric($opt) || (float)$opt <= 0) {
          continue;
        }
        $value = (float)$opt;
        $dist = abs($value - $req);
        if ($bestDist === null || $dist < $bestDist) {
          $best = $value;
          $bestDist = $dist;
        }
      }
      if ($best === null) {
        continue;
      }
      $asInt = (string)(int)round($best);
      if ($asInt !== (string)(int)round($req)) {
        return $asInt;
      }
    }
    return null;
  }

  /** @param array<string,mixed> $body */
  private static function extractPackageList(array $body): ?array
  {
    $isPackageList = static function ($candidate): bool {
      if (!is_array($candidate) || $candidate === [] || !array_is_list($candidate)) {
        return false;
      }
      $first = $candidate[0] ?? null;
      return is_array($first) && $first !== [] && !array_is_list($first);
    };

    $candidates = [
      $body['packages'] ?? null,
      $body['Packages'] ?? null,
      $body['package'] ?? null,
      $body['Package'] ?? null,
      $body['packageList'] ?? null,
      $body['PackageList'] ?? null,
      $body['data'] ?? null,
      $body['Data'] ?? null,
      $body['result'] ?? null,
      $body['Result'] ?? null,
    ];

    foreach ($candidates as $candidate) {
      if (!is_array($candidate) || $candidate === []) {
        continue;
      }
      if ($isPackageList($candidate)) {
        return $candidate;
      }
      // Nested list under common keys.
      foreach (['packages', 'Packages', 'packageList', 'PackageList', 'items', 'Items', 'data', 'Data'] as $key) {
        if (isset($candidate[$key]) && $isPackageList($candidate[$key])) {
          return $candidate[$key];
        }
      }
      // Single package object with premium-ish fields.
      if (
        isset($candidate['gross_prem_vol'])
        || isset($candidate['GROSS_PREM_VOL'])
        || isset($candidate['total_prem_vol'])
        || isset($candidate['TOTAL_PREM_VOL'])
        || isset($candidate['gross_total_vol'])
        || isset($candidate['GROSS_TOTAL_VOL'])
        || isset($candidate['grossTotalVol'])
        || isset($candidate['packname'])
        || isset($candidate['package_code'])
        || isset($candidate['PACKAGE_CODE'])
        || isset($candidate['premium'])
        || isset($candidate['PREMIUM'])
      ) {
        return [$candidate];
      }
    }

    if ($isPackageList($body)) {
      return $body;
    }

    // Single top-level package object (rare, but supported).
    if (
      isset($body['gross_prem_vol'])
      || isset($body['GROSS_PREM_VOL'])
      || isset($body['total_prem_vol'])
      || isset($body['TOTAL_PREM_VOL'])
      || isset($body['packname'])
      || isset($body['package_code'])
      || isset($body['PACKAGE_CODE'])
    ) {
      return [$body];
    }

    return null;
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
      'corporate' => 'B',
      'government' => 'G',
      'c' => 'C',
      'p' => 'P',
      'b' => 'B',
      'r' => 'B',
      'g' => 'G',
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

    $grossPrem = self::pkgField($package, ['gross_prem_vol', 'GROSS_PREM_VOL', 'premium', 'PREMIUM', 'net_premium', 'NET_PREMIUM', 'gross_total_vol', 'total_prem_vol'], 0);
    $stamp = self::pkgField($package, ['stamp_vol', 'stamp', 'STAMP'], 0);
    $vat = self::pkgField($package, ['vat_vol', 'vat', 'VAT'], 0);
    $total = self::pkgField($package, ['total_prem_vol', 'gross_total_vol', 'total_premium', 'premium_total', 'TOTAL_PREMIUM'], 0);
    if (!$total && $grossPrem) {
      $total = (float)$grossPrem + (float)$stamp + (float)$vat;
    }

    $buyComp = !empty($input['buyPrb'])
      || strtoupper(trim((string)($input['comp_req'] ?? $input['comp_flag'] ?? ''))) === 'Y';

    $compPrem = self::pkgField($package, ['gross_prem_comp', 'GROSS_PREM_COMP', 'comp_premium'], '');
    $compStamp = self::pkgField($package, ['stamp_comp', 'STAMP_COMP'], '');
    $compVat = self::pkgField($package, ['vat_comp', 'VAT_COMP'], '');
    $compTotal = self::pkgField($package, ['gross_total_comp', 'GROSS_TOTAL_COMP', 'total_prem_comp'], '');
    if ($buyComp && $compTotal === '' && $compPrem !== '') {
      $compTotal = (string)((float)$compPrem + (float)$compStamp + (float)$compVat);
    }

    $provCode = trim((string)($customer['insuredProvinceCode'] ?? ''));
    if ($provCode === '') {
      $provCode = MotorBkiLookup::resolveProvinceCode($insuredProvince);
    }
    $amphCode = trim((string)($customer['insuredDistrictCode'] ?? $customer['insuredDistrict'] ?? ''));
    if ($amphCode !== '' && !preg_match('/^\d{1,2}$/', $amphCode)) {
      $amphCode = MotorBkiLookup::resolveAmphurCode($provCode, $amphCode);
    } elseif (preg_match('/^\d{1,2}$/', $amphCode)) {
      $amphCode = str_pad($amphCode, 2, '0', STR_PAD_LEFT);
    }
    $tambolRaw = trim((string)($customer['insuredSubdistrictCode'] ?? $customer['insuredSubdistrict'] ?? ''));
    $tambol = MotorBkiLookup::resolveTambol($provCode, $amphCode, $tambolRaw);
    $zip = trim((string)($customer['insuredPostal'] ?? $tambol['zipcode'] ?? ''));

    $homeNo = trim((string)($customer['homeNumber'] ?? $customer['address'] ?? ''));
    $moo = trim((string)($customer['moo'] ?? ''));
    $soi = trim((string)($customer['soi'] ?? ''));
    $road = trim((string)($customer['road'] ?? ''));
    $building = trim((string)($customer['building'] ?? ''));

    $foreign = strtolower($idType) === 'passport' ? 'Y' : 'N';
    $driverMode = trim((string)($input['driverMode'] ?? 'unnamed'));
    $named = $driverMode === 'named';
    $consentDrv = strtoupper(trim((string)($input['consent_drv'] ?? $customer['consent_drv'] ?? 'N')));
    if ($consentDrv !== 'Y') {
      $consentDrv = 'N';
    }

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
      'total_prem' => (string)($buyComp && $compTotal !== ''
        ? ((float)$total + (float)$compTotal)
        : $total),
      'comp_req' => $buyComp ? 'Y' : 'N',
      'comp_flag' => $buyComp ? 'Y' : 'N',
      'gross_prem_comp' => $buyComp ? (string)$compPrem : '',
      'stamp_comp' => $buyComp ? (string)$compStamp : '',
      'vat_comp' => $buyComp ? (string)$compVat : '',
      'gross_total_comp' => $buyComp ? (string)$compTotal : '',
      'plate_no' => trim((string)($customer['licensePlate'] ?? '')),
      'plate_jw' => $plateInfo['plate_jw'],
      'chassis' => trim((string)($customer['chassisNo'] ?? '')),
      'engine' => trim((string)($customer['engineNo'] ?? '')),
      'color_code' => trim((string)($customer['carColor'] ?? '01')),
      'body_code' => trim((string)($input['body_code'] ?? $customer['body_code'] ?? '001')),
      'make_model' => trim((string)($input['car_submodel'] ?? $input['make_model'] ?? '')),
      'accessory_flag' => trim((string)($customer['accessory_flag'] ?? 'N')) ?: 'N',
      'drv_flag' => $named ? 'Y' : 'N',
      'consent_drv' => $named ? $consentDrv : 'N',
      'cust1_type' => self::mapCustType($idType),
      'cust1_foreign_flag' => $foreign,
      'cust1_id_type' => self::mapIdType($idType),
      'cust1_id' => trim((string)($customer['idNumber'] ?? '')),
      'cust1_tax_id' => strtolower($idType) === 'corporate' ? trim((string)($customer['idNumber'] ?? '')) : '',
      'cust1_gender' => trim((string)($customer['gender'] ?? 'M')),
      'cust1_title' => trim((string)($customer['titleTh'] ?? '')),
      'cust1_name' => $fullName,
      'cust1_occupation' => trim((string)($customer['occupation'] ?? '1011')),
      'cust1_dob' => $dob,
      'cust1_nationality_name' => trim((string)($customer['nationality'] ?? ($foreign === 'Y' ? '' : 'ไทย'))),
      'cust1_home_number' => $homeNo,
      'cust1_building' => $building,
      'cust1_moo' => $moo,
      'cust1_soi' => $soi,
      'cust1_road' => $road,
      'cust1_tambol' => $tambol['name'] !== '' ? $tambol['name'] : $tambolRaw,
      'cust1_amphur_code' => $amphCode,
      'cust1_province_code' => $provCode !== '' ? $provCode : $insuredPlate['province'],
      'cust1_zipcode' => $zip,
      'cust1_mobile_tel' => trim((string)($customer['phone'] ?? '')),
      'cust1_email' => trim((string)($customer['email'] ?? '')),
      'print_cust' => trim((string)($customer['print_cust'] ?? '1')),
    ]);

    $drivers = is_array($input['drivers'] ?? null) ? $input['drivers'] : [];
    if ($named && $drivers !== []) {
      foreach (array_slice($drivers, 0, 5) as $idx => $driver) {
        if (!is_array($driver)) {
          continue;
        }
        $n = $idx + 1;
        $drvName = trim((string)($driver['name'] ?? ''));
        if ($drvName === '') {
          $drvName = trim((string)(($driver['firstName'] ?? '') . ' ' . ($driver['lastName'] ?? '')));
        }
        $payload["drv{$n}_title"] = trim((string)($driver['title'] ?? $driver['titleTh'] ?? ''));
        $payload["drv{$n}_name"] = $drvName;
        $payload["drv{$n}_id"] = trim((string)($driver['idNumber'] ?? $driver['id'] ?? ''));
        $payload["drv{$n}_license_no"] = trim((string)($driver['licenseNo'] ?? $driver['license_no'] ?? ''));
        $payload["drv{$n}_license_type"] = trim((string)($driver['licenseType'] ?? $driver['license_type'] ?? '02'));
        $licExpire = trim((string)($driver['licenseExpire'] ?? $driver['license_expire'] ?? ''));
        if ($licExpire !== '') {
          $payload["drv{$n}_license_expire"] = self::formatEffDate($licExpire);
        }
        $drvDob = trim((string)($driver['dob'] ?? ''));
        if ($drvDob !== '') {
          $payload["drv{$n}_dob"] = self::formatEffDate($drvDob);
        }
        if ($consentDrv === 'Y') {
          $payload["drv{$n}_score"] = trim((string)($driver['score'] ?? '0'));
        }
        $natType = trim((string)($driver['nationalityType'] ?? ''));
        $natName = trim((string)($driver['nationality'] ?? ''));
        if ($natType !== '') {
          $payload["drv{$n}_nationality_type"] = $natType;
        }
        if ($natName !== '') {
          $payload["drv{$n}_nationality_name"] = $natName;
        }
      }
    }

    // Optional accessories 1..5
    if (($payload['accessory_flag'] ?? 'N') === 'Y') {
      $accessories = is_array($input['accessories'] ?? null) ? $input['accessories'] : [];
      foreach (array_slice($accessories, 0, 5) as $idx => $acc) {
        if (!is_array($acc)) continue;
        $n = $idx + 1;
        $payload["accessory{$n}_code"] = trim((string)($acc['code'] ?? ''));
        $payload["accessory{$n}_detail"] = trim((string)($acc['detail'] ?? ''));
        $payload["accessory{$n}_price"] = trim((string)($acc['price'] ?? ''));
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
   * @return array{
   *   status_code:?string,
   *   status_message:?string,
   *   policy_no:?string,
   *   link_policy:?string,
   *   comp_policy_no:?string,
   *   link_comp_policy:?string,
   *   raw:mixed
   * }
   */
  public static function parseTransferResponse($body): array
  {
    $statusCode = null;
    $statusMessage = null;
    $policyNo = null;
    $linkPolicy = null;
    $compPolicyNo = null;
    $linkCompPolicy = null;

    $pick = static function (array $src, array $keys): ?string {
      foreach ($keys as $key) {
        if (isset($src[$key]) && $src[$key] !== '' && $src[$key] !== null) {
          $val = $src[$key];
          return is_array($val) ? implode(' ', array_map('strval', $val)) : (string)$val;
        }
      }
      return null;
    };

    if (is_array($body)) {
      $statusCode = $pick($body, ['status', 'STATUS', 'ERR_CODE', 'err_code']);
      $statusMessage = $pick($body, ['status_message', 'STATUS_MESSAGE', 'message', 'ERR_MSG', 'err_msg']);
      $policyNo = $pick($body, ['policyNo', 'policy_no', 'POLICY_NO', 'pol_no', 'POL_NO', 'vol_policy_no']);
      $linkPolicy = $pick($body, ['linkPolicy', 'link_policy', 'LINK_POLICY']);
      $compPolicyNo = $pick($body, ['compPolicyNo', 'comp_policy_no', 'COMP_POLICY_NO']);
      $linkCompPolicy = $pick($body, ['linkCompPolicy', 'link_comp_policy', 'LINK_COMP_POLICY']);

      if (isset($body['data']) && is_array($body['data'])) {
        $policyNo = $policyNo ?: $pick($body['data'], ['policyNo', 'policy_no', 'POLICY_NO', 'pol_no']);
        $linkPolicy = $linkPolicy ?: $pick($body['data'], ['linkPolicy', 'link_policy']);
        $compPolicyNo = $compPolicyNo ?: $pick($body['data'], ['compPolicyNo', 'comp_policy_no']);
        $linkCompPolicy = $linkCompPolicy ?: $pick($body['data'], ['linkCompPolicy', 'link_comp_policy']);
      }
    }

    return [
      'status_code' => $statusCode,
      'status_message' => $statusMessage,
      'policy_no' => $policyNo,
      'link_policy' => $linkPolicy,
      'comp_policy_no' => $compPolicyNo,
      'link_comp_policy' => $linkCompPolicy,
      'raw' => $body,
    ];
  }
}
