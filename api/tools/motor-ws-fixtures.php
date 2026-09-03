<?php
declare(strict_types=1);

/**
 * Sample request bodies from BKI API Specification -Motor_(version1.4).xlsx (vol_premium sheet).
 */
final class MotorWsFixtures
{
  /**
   * Full vol/premium/calculate sample (v1.4 field names: make, make_code).
   * default_params (user_id, agent_code, agent_seq) are merged by MotorWebService.
   *
   * @return array<string, mixed>
   */
  public static function volPremiumSample(): array
  {
    // From Look up/bki_car_code_VOL_WithSumins_20260706.xlsx — TO327-03 (TOYOTA CAMRY 2.5 HV NAVI)
    // SUM_INS 330000–390000; sample uses 350000
    return [
      'eff_date' => '07/10/2026',
      'risk' => '1',
      'garage' => '',
      'car_type' => '1',
      'car_use' => '1',
      'make' => 'TOYOTA',
      'make_code' => 'TO327-03',
      'car_brand' => 'TOYOTA',
      'car_code' => 'TO327-03',
      'car_year' => '2012',
      'cc' => '2500',
      'seat' => '5',
      'weight' => '0',
      'zone_use' => '1',
      'ncb' => '0',
      'deduct' => '0',
      'deduct_lib' => '0',
      'comp_req' => 'N',
      'sum_ins' => '350000',
      'cctv_flag' => 'N',
      'drv_flag' => 'N',
      'consent_drv' => 'N',
      'agent_ref_no' => 'TEST-' . date('Ymd-His'),
    ];
  }

  /** Legacy field names from older spec examples (fallback test). */
  public static function volPremiumSampleLegacy(): array
  {
    $body = self::volPremiumSample();
    $body['car_brand'] = $body['make'];
    $body['car_code'] = $body['make_code'];
    unset($body['make'], $body['make_code']);
    return $body;
  }
}
