#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v bird >/dev/null 2>&1; then
  echo "❌ bird CLI not found. Install bird before running this workflow."
  exit 3
fi

echo "✅ bird CLI: $(bird --version | head -n1)"

# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/load-cookies.sh" >/dev/null

if [ -z "${AUTH_TOKEN:-}" ] || [ -z "${CT0:-}" ]; then
  echo "❌ Missing AUTH_TOKEN or CT0. Add them to env or ~/.claude/.env"
  exit 4
fi

if bird --auth-token "$AUTH_TOKEN" --ct0 "$CT0" whoami >/dev/null 2>&1; then
  echo "✅ Cookie-auth session validated (bird whoami succeeded)."
else
  echo "❌ Cookie-auth validation failed (bird whoami). Refresh credentials and retry."
  exit 5
fi
