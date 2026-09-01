<?php
declare(strict_types=1);

/**
 * Sample request bodies from BKI API Specification -Motor_(version1.4).xlsx (vol_premium sheet).
 * Used by motor-ws-test.php only — not production data.
 */
final class MotorWsFixtures
{
  /** Minimal body for connectivity / validation probe (no car data). */
  public static function pingBody(): array
  {
    return [];
  }

  /**
   * Example vol/premium/calculate request (from spec "Request Json" section).
   * default_params (user_id, agent_code, agent_seq) are merged by MotorWebService.
   *
   * @return array<string, mixed>
   */
  public static function volPremiumSample(): array
  {
    return [
      'eff_date' => '07/10/2025',
      'risk' => '1',
      'garage' => '',
      'car_type' => '1',
      'car_use' => '1',
      'car_brand' => 'TOYOTA',
      'car_code' => '1100001',
      'car_year' => '2020',
      'cc' => '1800',
      'seat' => '5',
      'weight' => '1200',
      'ncb' => '0',
      'deduct' => '0',
      'deduct_lib' => '0',
      'comp_req' => 'N',
      'sum_ins' => '280000',
      'agent_ref_no' => 'TEST-' . date('Ymd-His'),
    ];
  }
}
