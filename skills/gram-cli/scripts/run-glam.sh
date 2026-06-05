#!/usr/bin/env bash
set -euo pipefail

DEFAULT_BIN="/Volumes/madara/2026/twc-vault/01-Projects/gram-cli/.venv-codex/bin/glam"

resolve_bin() {
  if [[ -n "${GRAM_CLI_BIN:-}" ]]; then
    echo "$GRAM_CLI_BIN"
    return 0
  fi

  if [[ -x "$DEFAULT_BIN" ]]; then
    echo "$DEFAULT_BIN"
    return 0
  fi

  if command -v glam >/dev/null 2>&1; then
    command -v glam
    return 0
  fi

  if command -v gram >/dev/null 2>&1; then
    command -v gram
    return 0
  fi

  return 1
}

BIN="$(resolve_bin || true)"
if [[ -z "$BIN" ]]; then
  echo "ERROR: gram-cli binary not found." >&2
  echo "Set GRAM_CLI_BIN or install glam at $DEFAULT_BIN." >&2
  exit 127
fi

exec "$BIN" "$@"
