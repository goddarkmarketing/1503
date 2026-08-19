<?php
declare(strict_types=1);

final class Mailer
{
  public static function withdrawNotifyTo(): string
  {
    $config = Auth::config();
    $to = trim((string)($config['mail']['withdraw_to'] ?? ''));
    return $to !== '' ? $to : 'goddarkmarketing@gmail.com';
  }

  public static function adminBaseUrl(): string
  {
    $config = Auth::config();
    $url = trim((string)($config['mail']['admin_base_url'] ?? ''));
    return $url !== '' ? rtrim($url, '/') : 'https://www.kladeebroker.co.th';
  }

  /** HTML email — card layout + table + CTA button (email-client safe). */
  public static function withdrawRequestHtml(array $data): string
  {
    $id = self::e((string)($data['id'] ?? ''));
    $agentCode = self::e((string)($data['agentCode'] ?? ''));
    $agentName = self::e((string)($data['agentName'] ?? ''));
    $amount = self::e(number_format((float)($data['amount'] ?? 0), 2));
    $bank = self::e((string)($data['bankName'] ?? '-'));
    $accNo = self::e((string)($data['accountNo'] ?? '-'));
    $accName = self::e((string)($data['accountName'] ?? '-'));
    $noteRaw = trim((string)($data['note'] ?? ''));
    $note = self::e($noteRaw !== '' ? $noteRaw : '-');
    $createdAt = self::formatDateTime((string)($data['createdAt'] ?? ''));
    $adminUrl = self::e(self::adminBaseUrl() . '/admin/withdraw-requests');

    $row = static function (string $label, string $value, bool $highlight = false): string {
      $bg = $highlight ? '#f0fdf9' : '#ffffff';
      $weight = $highlight ? '700' : '400';
      $color = $highlight ? '#1a7d58' : '#0f172a';
      return '<tr>'
        . '<td style="padding:12px 16px;width:34%;background:' . $bg . ';border-bottom:1px solid #e8edf2;color:#64748b;font-size:14px;vertical-align:top">'
        . self::e($label)
        . '</td>'
        . '<td style="padding:12px 16px;background:' . $bg . ';border-bottom:1px solid #e8edf2;color:' . $color . ';font-size:14px;font-weight:' . $weight . ';vertical-align:top">'
        . $value
        . '</td>'
        . '</tr>';
    };

    return '<!DOCTYPE html>'
      . '<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      . '<body style="margin:0;padding:0;background:#f1f5f9;font-family:\'Segoe UI\',Tahoma,Arial,sans-serif;color:#0f172a">'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">'
      . '<tr><td align="center">'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">'

      // Header
      . '<tr><td style="background:#1a7d58;padding:22px 24px">'
      . '<p style="margin:0 0 4px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85)">Kladee Broker</p>'
      . '<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.35">คำขอถอนเงินใหม่</h1>'
      . '<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.92)">มีนายหน้าแจ้งถอนค่าคอมมิชชัน รอแอดมินโอนเงิน</p>'
      . '</td></tr>'

      // Amount highlight
      . '<tr><td style="padding:20px 24px 8px;text-align:center;background:#f8fafc;border-bottom:1px solid #e8edf2">'
      . '<p style="margin:0 0 4px;font-size:13px;color:#64748b">จำนวนเงินที่ขอถอน</p>'
      . '<p style="margin:0;font-size:32px;font-weight:700;color:#1a7d58;line-height:1.2">' . $amount . ' <span style="font-size:16px;font-weight:600">บาท</span></p>'
      . '</td></tr>'

      // Details table
      . '<tr><td style="padding:0 0 8px">'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'
      . $row('เลขที่คำขอ', '<span style="font-family:Consolas,Monaco,monospace">' . $id . '</span>')
      . $row('นายหน้า', $agentCode . ' — ' . $agentName)
      . ($createdAt !== '' ? $row('วันที่ขอ', $createdAt) : '')
      . $row('ธนาคาร', $bank)
      . $row('เลขบัญชี', '<span style="font-family:Consolas,Monaco,monospace;letter-spacing:0.04em">' . $accNo . '</span>')
      . $row('ชื่อบัญชี', $accName)
      . $row('หมายเหตุ', $note)
      . '</table>'
      . '</td></tr>'

      // CTA button
      . '<tr><td style="padding:8px 24px 28px;text-align:center">'
      . '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto">'
      . '<tr><td style="border-radius:8px;background:#1a7d58">'
      . '<a href="' . $adminUrl . '" target="_blank" rel="noopener" '
      . 'style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">'
      . 'เปิดหลังบ้าน — อนุมัติถอนเงิน'
      . '</a>'
      . '</td></tr>'
      . '</table>'
      . '<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5">'
      . 'หากปุ่มกดไม่ได้ คัดลอกลิงก์นี้:<br>'
      . '<a href="' . $adminUrl . '" style="color:#1a7d58;word-break:break-all">' . $adminUrl . '</a>'
      . '</p>'
      . '</td></tr>'

      // Footer
      . '<tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e8edf2;text-align:center">'
      . '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5">'
      . 'อีเมลนี้ส่งอัตโนมัติจากระบบ กล้าดีโบรคเกอร์<br>'
      . 'กรุณาโอนเงินเข้าบัญชีด้านบนแล้วแนบสลิปในหลังบ้าน'
      . '</p>'
      . '</td></tr>'

      . '</table>'
      . '</td></tr></table>'
      . '</body></html>';
  }

  private static function e(string $value): string
  {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
  }

  private static function formatDateTime(string $iso): string
  {
    $iso = trim(str_replace(' ', 'T', $iso));
    if ($iso === '') {
      return '';
    }
    $dt = date_create($iso);
    if ($dt === false) {
      return self::e($iso);
    }
    return self::e($dt->format('d/m/Y H:i'));
  }

  public static function send(string $to, string $subject, string $html): bool
  {
    $to = trim($to);
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
      return false;
    }

    $config = Auth::config();
    $from = trim((string)($config['mail']['from'] ?? 'noreply@kladeebroker.co.th'));
    $fromName = trim((string)($config['mail']['from_name'] ?? 'Kladee Broker'));
    if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
      $from = 'noreply@kladeebroker.co.th';
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'From: ' . sprintf('"%s" <%s>', addcslashes($fromName, '"\\'), $from),
      'Reply-To: ' . $from,
      'X-Mailer: KladeeBroker',
    ];
    $headerStr = implode("\r\n", $headers);
    $extra = PHP_OS_FAMILY === 'Windows' ? '' : '-f ' . $from;

    if ($extra !== '') {
      return @mail($to, $encodedSubject, $html, $headerStr, $extra);
    }
    return @mail($to, $encodedSubject, $html, $headerStr);
  }
}
