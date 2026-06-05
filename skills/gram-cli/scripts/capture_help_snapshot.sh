#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/references"
OUT_FILE="$OUT_DIR/help-snapshot.txt"
RUNNER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/run-glam.sh"
mkdir -p "$OUT_DIR"

if ! "$RUNNER" --help >/dev/null 2>&1; then
  {
    echo "# gram-cli help snapshot"
    echo "# generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo
    echo "ERROR: gram-cli binary not found via run-glam.sh"
    echo "Set GRAM_CLI_BIN or install gram-cli and rerun this script."
  } > "$OUT_FILE"
  echo "Wrote $OUT_FILE (error snapshot)"
  exit 0
fi

commands=(
  "--help"
  "check --help"
  "whoami --help"
  "login --help"
  "profile --help"
  "post --help"
  "stories --help"
  "highlights --help"
)

{
  echo "# gram-cli help snapshot"
  echo "# cli: $RUNNER"
  echo "# generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  for c in "${commands[@]}"; do
    echo "============================================================"
    echo "$ $RUNNER $c"
    echo "============================================================"
    # shellcheck disable=SC2086
    "$RUNNER" $c 2>&1 || true
    echo
  done
} > "$OUT_FILE"

echo "Wrote $OUT_FILE"
