#!/usr/bin/env bash
set -euo pipefail

# Arcplume diagnostics: checks video-generation readiness for xAI Imagine.
#
# Usage:
#   scripts/doctor.sh
#   scripts/doctor.sh --timeout 15 --poll-attempts 12 --poll-interval 5
#
# Checks:
# 1) XAI API key present
# 2) API endpoint reachable
# 3) Video generation request accepted
# 4) Poll status progression (pending/done)

TIMEOUT=15
POLL_ATTEMPTS=10
POLL_INTERVAL=3
MODEL="grok-imagine-video"
DURATION=5
PROMPT="Arcplume diagnostics clip: minimal glowing feather bridge symbol on dark background, no text."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --poll-attempts) POLL_ATTEMPTS="$2"; shift 2 ;;
    --poll-interval) POLL_INTERVAL="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --prompt) PROMPT="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,55p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

START_JSON="$TMP_DIR/start.json"
STATUS_JSON="$TMP_DIR/status.json"

CHECKS=()
STATUSES=()
DETAILS=()

add_check() {
  CHECKS+=("$1")
  STATUSES+=("$2")
  DETAILS+=("$3")
}

load_key() {
  if [[ -n "${XAI_API_KEY:-}" ]]; then
    return 0
  fi

  local env_file="$HOME/.claude/.env"
  if [[ -f "$env_file" ]]; then
    XAI_API_KEY="$(awk -F= '$1=="XAI_API_KEY"{v=substr($0,index($0,"=")+1)} END{print v}' "$env_file")"
    export XAI_API_KEY
  fi
}

print_matrix() {
  echo
  printf '%-26s | %-6s | %s\n' "CHECK" "RESULT" "DETAIL"
  printf '%-26s-+-%-6s-+-%s\n' "--------------------------" "------" "-----------------------------------------------"
  local i
  for i in "${!CHECKS[@]}"; do
    printf '%-26s | %-6s | %s\n' "${CHECKS[$i]}" "${STATUSES[$i]}" "${DETAILS[$i]}"
  done
  echo
}

load_key
if [[ -n "${XAI_API_KEY:-}" ]]; then
  add_check "key_present" "PASS" "XAI_API_KEY found (value redacted)"
else
  add_check "key_present" "FAIL" "XAI_API_KEY missing (env or ~/.claude/.env)"
  print_matrix
  exit 1
fi

# 2) Endpoint reachability (auth required endpoint)
MODELS_CODE="$(curl -sS -o "$TMP_DIR/models.json" -w "%{http_code}" --max-time "$TIMEOUT" \
  -H "Authorization: Bearer ${XAI_API_KEY}" \
  https://api.x.ai/v1/models || true)"

if [[ "$MODELS_CODE" == "200" ]]; then
  add_check "endpoint_reachable" "PASS" "GET /v1/models -> HTTP 200"
elif [[ "$MODELS_CODE" == "401" || "$MODELS_CODE" == "403" ]]; then
  add_check "endpoint_reachable" "PASS" "Host reachable; auth rejected (HTTP $MODELS_CODE)"
  add_check "request_accepted" "FAIL" "Skipped due to auth rejection"
  add_check "poll_status" "FAIL" "Skipped (no request id)"
  print_matrix
  exit 1
else
  add_check "endpoint_reachable" "FAIL" "GET /v1/models -> HTTP ${MODELS_CODE:-unknown}"
  add_check "request_accepted" "FAIL" "Skipped due to unreachable endpoint"
  add_check "poll_status" "FAIL" "Skipped (no request id)"
  print_matrix
  exit 1
fi

# 3) Request acceptance
START_CODE="$(curl -sS -o "$START_JSON" -w "%{http_code}" --max-time "$TIMEOUT" -X POST \
  https://api.x.ai/v1/videos/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${XAI_API_KEY}" \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"${PROMPT//\"/\\\"}\",\"duration\":${DURATION}}" || true)"

if [[ "$START_CODE" != "200" ]]; then
  add_check "request_accepted" "FAIL" "POST /v1/videos/generations -> HTTP $START_CODE"
  add_check "poll_status" "FAIL" "Skipped (request not accepted)"
  print_matrix
  exit 1
fi

REQUEST_ID="$(python3 - <<'PY' "$START_JSON"
import json,sys
try:
    obj=json.load(open(sys.argv[1]))
    print(obj.get('request_id',''))
except Exception:
    print('')
PY
)"

if [[ -z "$REQUEST_ID" ]]; then
  add_check "request_accepted" "FAIL" "HTTP 200 but no request_id in response"
  add_check "poll_status" "FAIL" "Skipped (missing request id)"
  print_matrix
  exit 1
fi

add_check "request_accepted" "PASS" "Request accepted; request_id=$REQUEST_ID"

# 4) Poll status progression
poll_pass=0
poll_detail=""
for ((i=1; i<=POLL_ATTEMPTS; i++)); do
  POLL_CODE="$(curl -sS -o "$STATUS_JSON" -w "%{http_code}" --max-time "$TIMEOUT" \
    -H "Authorization: Bearer ${XAI_API_KEY}" \
    "https://api.x.ai/v1/videos/${REQUEST_ID}" || true)"

  if [[ "$POLL_CODE" != "200" && "$POLL_CODE" != "202" ]]; then
    poll_detail="HTTP $POLL_CODE on poll_${i}"
    break
  fi

  STATUS="$(python3 - <<'PY' "$STATUS_JSON"
import json,sys
try:
    obj=json.load(open(sys.argv[1]))
    print(obj.get('status',''))
except Exception:
    print('')
PY
)"

  if [[ "$STATUS" == "done" ]]; then
    poll_pass=1
    poll_detail="done on poll_${i}"
    break
  elif [[ "$STATUS" == "pending" || "$STATUS" == "processing" ]]; then
    poll_detail="${STATUS} at poll_${i}"
  elif [[ "$STATUS" == "failed" || "$STATUS" == "expired" ]]; then
    poll_detail="terminal status=${STATUS} at poll_${i}"
    break
  else
    poll_detail="status=${STATUS:-unknown} at poll_${i}"
  fi

  sleep "$POLL_INTERVAL"
done

if [[ "$poll_pass" -eq 1 ]]; then
  add_check "poll_status" "PASS" "$poll_detail"
  print_matrix
  exit 0
fi

if [[ -z "$poll_detail" ]]; then
  poll_detail="no successful terminal status within attempts"
fi
add_check "poll_status" "FAIL" "$poll_detail"
print_matrix
exit 1
