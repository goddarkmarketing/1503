# Kladee Broker — run full BKI Motor WS test suite on local XAMPP
# Usage:
#   .\api\tools\run-motor-ws-test.ps1
#   .\api\tools\run-motor-ws-test.ps1 -Full
#   .\api\tools\run-motor-ws-test.ps1 -Base "http://localhost/kladeebroker/api/v1"

param(
  [switch]$Full,
  [string]$Base = "http://localhost/kladeebroker/api/v1"
)

$php = "C:\xampp\php\php.exe"
$script = Join-Path $PSScriptRoot "motor-ws-test.php"

if (-not (Test-Path $php)) {
  Write-Error "PHP not found at $php — start XAMPP or adjust path."
  exit 1
}

$args = @($script, "--base=$Base")
if ($Full) { $args += "--full" }

& $php @args
exit $LASTEXITCODE
