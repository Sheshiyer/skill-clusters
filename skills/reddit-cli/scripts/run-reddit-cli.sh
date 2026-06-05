#!/usr/bin/env bash
set -euo pipefail

DEFAULT_BIN="/Volumes/madara/2026/twc-vault/01-Projects/reddit-cli/.venv-codex/bin/reddit-cli"

resolve_bin() {
  if [[ -n "${REDDIT_CLI_BIN:-}" ]]; then
    echo "$REDDIT_CLI_BIN"
    return 0
  fi

  if [[ -x "$DEFAULT_BIN" ]]; then
    echo "$DEFAULT_BIN"
    return 0
  fi

  if command -v reddit-cli >/dev/null 2>&1; then
    command -v reddit-cli
    return 0
  fi

  return 1
}

BIN="$(resolve_bin || true)"
if [[ -z "$BIN" ]]; then
  echo "ERROR: reddit-cli binary not found." >&2
  echo "Set REDDIT_CLI_BIN or install reddit-cli at $DEFAULT_BIN." >&2
  exit 127
fi

exec "$BIN" "$@"
