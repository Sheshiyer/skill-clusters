#!/usr/bin/env bash
set -euo pipefail

# Generate a single video via xAI's billed REST API (Grok Imagine video).
#
# Usage:
#   scripts/generate-video.sh --prompt "..." --out ./out.mp4 [--duration 5] [--model grok-imagine-video] [--timeout 420]
#
# This is the "Optional: API mode" path documented in SKILL.md, not the CLI-session
# mode that scripts/generate-image.sh uses. Grok Build's own OAuth session does not
# currently expose a native video-generation tool (confirmed by live testing: asking
# it to generate video with no workarounds allowed gets an explicit "no built-in
# video-generation tool available here" answer). This script requires XAI_API_KEY and
# bills against your xAI account, exactly like scripts/test-video.sh already does --
# it just wraps the same endpoint in this skill's standard --prompt/--out interface.
#
# Exit codes:
#   0  success; final video copied to --out (path printed to stdout)
#   2  invalid/missing arguments
#   3  XAI_API_KEY missing (env or ~/.claude/.env)
#   4  start request failed, or response had no request_id
#   5  polling failed, hit a terminal failure/expired status, or timed out
#   6  a "done" status was returned but the video download failed or was empty

PROMPT=""
OUT_FILE=""
DURATION=5
MODEL="grok-imagine-video"
TIMEOUT_SEC=420
POLL_INTERVAL=5

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt) PROMPT="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --timeout) TIMEOUT_SEC="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,23p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$PROMPT" ]]; then
  echo "ERROR: --prompt is required" >&2
  exit 2
fi

if [[ -z "$OUT_FILE" ]]; then
  echo "ERROR: --out is required" >&2
  exit 2
fi

if [[ -z "${XAI_API_KEY:-}" && -f "$HOME/.claude/.env" ]]; then
  XAI_API_KEY="$(awk -F= '$1=="XAI_API_KEY"{v=substr($0,index($0,"=")+1)} END{print v}' "$HOME/.claude/.env")"
  export XAI_API_KEY
fi

if [[ -z "${XAI_API_KEY:-}" ]]; then
  echo "❌ XAI_API_KEY is missing (env or ~/.claude/.env). This is billed API mode, distinct from the CLI-session mode." >&2
  exit 3
fi

OUT_DIR="$(dirname "$OUT_FILE")"
mkdir -p "$OUT_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
START_JSON="$TMP_DIR/start.json"
STATUS_JSON="$TMP_DIR/status.json"

echo "Requesting video generation (model=$MODEL, duration=${DURATION}s)..." >&2
START_CODE="$(curl -sS -o "$START_JSON" -w "%{http_code}" -X POST "https://api.x.ai/v1/videos/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${XAI_API_KEY}" \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"${PROMPT//\"/\\\"}\",\"duration\":${DURATION}}")"

if [[ "$START_CODE" != "200" ]]; then
  echo "❌ Start request failed (HTTP $START_CODE)." >&2
  cat "$START_JSON" >&2
  exit 4
fi

REQUEST_ID="$(python3 - "$START_JSON" <<'PY'
import json, sys
try:
    print(json.load(open(sys.argv[1])).get('request_id', ''))
except Exception:
    print('')
PY
)"

if [[ -z "$REQUEST_ID" ]]; then
  echo "❌ HTTP 200 but no request_id in response." >&2
  cat "$START_JSON" >&2
  exit 4
fi

echo "request_id=$REQUEST_ID; polling..." >&2

deadline=$(( $(date +%s) + TIMEOUT_SEC ))
attempt=0
while [[ $(date +%s) -lt $deadline ]]; do
  attempt=$((attempt + 1))
  POLL_CODE="$(curl -sS -o "$STATUS_JSON" -w "%{http_code}" "https://api.x.ai/v1/videos/${REQUEST_ID}" \
    -H "Authorization: Bearer ${XAI_API_KEY}")"

  if [[ "$POLL_CODE" != "200" && "$POLL_CODE" != "202" ]]; then
    echo "❌ Poll failed (HTTP $POLL_CODE) on attempt $attempt." >&2
    cat "$STATUS_JSON" >&2
    exit 5
  fi

  STATUS="$(python3 - "$STATUS_JSON" <<'PY'
import json, sys
try:
    print(json.load(open(sys.argv[1])).get('status', ''))
except Exception:
    print('')
PY
)"
  echo "poll_${attempt}: status=${STATUS:-unknown}" >&2

  if [[ "$STATUS" == "done" ]]; then
    VIDEO_URL="$(python3 - "$STATUS_JSON" <<'PY'
import json, sys
obj = json.load(open(sys.argv[1]))
print((obj.get('video') or {}).get('url', ''))
PY
)"
    if [[ -z "$VIDEO_URL" ]]; then
      echo "❌ Status done but no video URL in response." >&2
      cat "$STATUS_JSON" >&2
      exit 6
    fi
    if ! curl -sS -L "$VIDEO_URL" -o "$OUT_FILE"; then
      echo "❌ Failed to download video to --out: $OUT_FILE" >&2
      exit 6
    fi
    if [[ ! -s "$OUT_FILE" ]]; then
      echo "❌ Downloaded video file is empty: $OUT_FILE" >&2
      exit 6
    fi
    echo "$OUT_FILE"
    exit 0
  fi

  if [[ "$STATUS" == "failed" || "$STATUS" == "expired" ]]; then
    echo "❌ Terminal status: $STATUS" >&2
    cat "$STATUS_JSON" >&2
    exit 5
  fi

  sleep "$POLL_INTERVAL"
done

echo "❌ Timed out after ${TIMEOUT_SEC}s waiting for video (request_id=$REQUEST_ID)." >&2
exit 5
