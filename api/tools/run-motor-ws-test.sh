#!/usr/bin/env bash
# Run on production/UAT server (Linux/Plesk) after git pull + config.php updated.
# Usage:
#   bash api/tools/run-motor-ws-test.sh
#   bash api/tools/run-motor-ws-test.sh --full
#   bash api/tools/run-motor-ws-test.sh --base=https://www.kladeebroker.co.th/api/v1 --full

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PHP="${PHP_BIN:-php}"
BASE="${API_BASE:-https://www.kladeebroker.co.th/api/v1}"
FULL=""

for arg in "$@"; do
  case "$arg" in
    --full) FULL="--full" ;;
    --base=*) BASE="${arg#*=}" ;;
  esac
done

exec "$PHP" "$ROOT/api/tools/motor-ws-test.php" "--base=$BASE" $FULL
