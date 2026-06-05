#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/references"
OUT_FILE="$OUT_DIR/help-snapshot.txt"
RUNNER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/run-reddit-cli.sh"
mkdir -p "$OUT_DIR"

if ! "$RUNNER" --help >/dev/null 2>&1; then
  {
    echo "# reddit-cli help snapshot"
    echo "# generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo
    echo "ERROR: reddit-cli binary not found via run-reddit-cli.sh"
    echo "Set REDDIT_CLI_BIN or install reddit-cli and rerun this script."
  } > "$OUT_FILE"
  echo "Wrote $OUT_FILE (error snapshot)"
  exit 0
fi

commands=(
  "--help"
  "auth check --help"
  "whoami --help"
  "subreddit posts --help"
  "post thread --help"
  "search --help"
  "post create --help"
  "comment reply --help"
  "message send --help"
)

{
  echo "# reddit-cli help snapshot"
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
