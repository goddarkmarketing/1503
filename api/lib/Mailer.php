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
