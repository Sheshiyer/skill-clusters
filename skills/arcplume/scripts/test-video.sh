#!/usr/bin/env bash
set -euo pipefail

# Repeatable xAI video endpoint smoke test.
# Usage:
#   scripts/test-video.sh --prompt "..." [--duration 5] [--model grok-imagine-video] [--out ./out.mp4] [--timeout 420]

MODEL="grok-imagine-video"
DURATION=5
TIMEOUT_SEC=420
POLL_INTERVAL=5
PROMPT=""
OUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt) PROMPT="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --timeout) TIMEOUT_SEC="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,40p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if [[ -z "$PROMPT" ]]; then
  echo "ERROR: --prompt is required" >&2
  exit 2
fi

if [[ -z "${XAI_API_KEY:-}" && -f "$HOME/.claude/.env" ]]; then
  XAI_API_KEY="$(awk -F= '$1=="XAI_API_KEY"{v=substr($0,index($0,"=")+1)} END{print v}' "$HOME/.claude/.env")"
  export XAI_API_KEY
fi

if [[ -z "${XAI_API_KEY:-}" ]]; then
  echo "ERROR: XAI_API_KEY is missing" >&2
  exit 3
fi

OUT_DIR="${OUT_FILE%/*}"
if [[ "$OUT_DIR" == "$OUT_FILE" ]]; then
  OUT_DIR="."
fi
mkdir -p "$OUT_DIR"

if [[ -z "$OUT_FILE" ]]; then
  stamp="$(date +%Y%m%d-%H%M%S)"
  OUT_FILE="$OUT_DIR/video-test-${stamp}.mp4"
fi

START_JSON="$(mktemp)"
STATUS_JSON="$(mktemp)"
trap 'rm -f "$START_JSON" "$STATUS_JSON"' EXIT

start_code=$(curl -sS -o "$START_JSON" -w "%{http_code}" -X POST "https://api.x.ai/v1/videos/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${XAI_API_KEY}" \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"${PROMPT//\"/\\\"}\",\"duration\":${DURATION}}")

if [[ "$start_code" != "200" ]]; then
  echo "ERROR: start request failed (HTTP $start_code)" >&2
  cat "$START_JSON" >&2
  exit 4
fi

request_id=$(python3 - <<'PY' "$START_JSON"
import json,sys
print(json.load(open(sys.argv[1])).get('request_id',''))
PY
)

if [[ -z "$request_id" ]]; then
  echo "ERROR: missing request_id in response" >&2
  cat "$START_JSON" >&2
  exit 5
fi

echo "request_id=$request_id"

deadline=$(( $(date +%s) + TIMEOUT_SEC ))
attempt=0
while [[ $(date +%s) -lt $deadline ]]; do
  attempt=$((attempt+1))
  code=$(curl -sS -o "$STATUS_JSON" -w "%{http_code}" "https://api.x.ai/v1/videos/${request_id}" \
    -H "Authorization: Bearer ${XAI_API_KEY}")

  if [[ "$code" != "200" && "$code" != "202" ]]; then
    echo "ERROR: poll failed (HTTP $code)" >&2
    cat "$STATUS_JSON" >&2
    exit 6
  fi

  status=$(python3 - <<'PY' "$STATUS_JSON"
import json,sys
obj=json.load(open(sys.argv[1]))
print(obj.get('status',''))
PY
)
  progress=$(python3 - <<'PY' "$STATUS_JSON"
import json,sys
obj=json.load(open(sys.argv[1]))
print(obj.get('progress',''))
PY
)

  echo "poll_${attempt}: http=${code} status=${status} progress=${progress}"

  if [[ "$status" == "done" ]]; then
    video_url=$(python3 - <<'PY' "$STATUS_JSON"
import json,sys
obj=json.load(open(sys.argv[1]))
print((obj.get('video') or {}).get('url',''))
PY
)
    if [[ -z "$video_url" ]]; then
      echo "ERROR: done status but no video URL" >&2
      cat "$STATUS_JSON" >&2
      exit 7
    fi
    curl -sS -L "$video_url" -o "$OUT_FILE"
    echo "ok=true"
    echo "output=$OUT_FILE"
    echo "bytes=$(wc -c < "$OUT_FILE" | tr -d ' ')"
    exit 0
  fi

  if [[ "$status" == "failed" || "$status" == "expired" ]]; then
    echo "ERROR: terminal status=$status" >&2
    cat "$STATUS_JSON" >&2
    exit 8
  fi

  sleep "$POLL_INTERVAL"
done

echo "ERROR: timeout waiting for video" >&2
cat "$STATUS_JSON" >&2
exit 9
