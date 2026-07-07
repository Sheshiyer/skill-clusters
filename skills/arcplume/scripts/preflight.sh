#!/usr/bin/env bash
set -euo pipefail

# Arcplume preflight: validates a Grok Build CLI session before running the
# rest of the workflow.
#
# Grok Build (xAI's coding-agent CLI) caches OAuth tokens locally under
# ~/.grok/auth.json after `grok login`. This script never reads or prints
# that file's contents; it only checks for the binary and runs a live
# functional probe against the service, the same way the previous
# bird-cookie-based preflight ran `bird whoami` as its functional check.
#
# `grok inspect --json` was evaluated as a possible shortcut (it dumps local
# config: skills, hooks, mcp servers, permissions, etc.) but it does not
# expose any authenticated/logged-in/session field, so it cannot be used as
# an auth signal here. Instead we run a real single-turn prompt through the
# CLI and confirm the service actually replied.
#
# Exit codes:
#   0 - Grok Build session validated (live functional check succeeded)
#   3 - grok binary not found
#   4 - no local Grok Build session found (~/.grok/auth.json missing)
#   5 - session validation failed (functional check did not return the
#       expected response)

if ! command -v grok >/dev/null 2>&1; then
  echo "❌ grok CLI not found. Install Grok Build (https://x.ai) before running this workflow."
  exit 3
fi

echo "✅ grok CLI: $(grok --version 2>&1 | head -n1)"

if [ ! -f "${HOME}/.grok/auth.json" ]; then
  echo "❌ No local Grok Build session found (~/.grok/auth.json missing). Run 'grok login' and retry."
  exit 4
fi

echo "✅ Grok Build session file present."

PROBE_DIR="$(mktemp -d)"
trap 'rm -rf "$PROBE_DIR"' EXIT

PROBE_JSON="$PROBE_DIR/probe.json"

if ! grok -p "reply with exactly the word ok" \
  --output-format json \
  --max-turns 1 \
  --always-approve \
  --cwd "$PROBE_DIR" >"$PROBE_JSON" 2>/dev/null; then
  echo "❌ Session validation failed (grok invocation errored). Run 'grok login' and retry."
  exit 5
fi

PROBE_OK="$(python3 - <<'PY' "$PROBE_JSON"
import json, sys
try:
    obj = json.load(open(sys.argv[1]))
    stop_reason = obj.get("stopReason", "")
    text = obj.get("text", "")
    print("ok" if stop_reason == "EndTurn" and text else "fail")
except Exception:
    print("fail")
PY
)"

if [ "$PROBE_OK" = "ok" ]; then
  echo "✅ Grok Build session validated (single-turn probe succeeded)."
else
  echo "❌ Session validation failed (unexpected response from grok). Run 'grok login' and retry."
  exit 5
fi
