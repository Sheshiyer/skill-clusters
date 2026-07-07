#!/usr/bin/env bash
set -euo pipefail

# Generate a single image via the Grok Build CLI's existing OAuth session.
#
# Usage:
#   scripts/generate-image.sh --prompt "..." --out ./out.jpg [--max-turns 6] [--timeout 180]
#
# Requires the `grok` binary (Grok Build, xAI's coding-agent CLI) to already
# be installed and logged in via OAuth (~/.grok/auth.json). This script never
# reads or prints the contents of that file.
#
# Exit codes:
#   0  success; final image copied to --out (path printed to stdout)
#   2  invalid/missing arguments
#   3  `grok` command not found on PATH
#   4  failed to parse result.json from grok, or sessionId missing
#   5  grok ran but no image file was produced (model's own text is printed)
#   6  images were found but copying to --out failed
#   7  grok did not finish within --timeout seconds (session left in place for post-mortem)
#
# Design notes learned from live testing: result.json/result.err must NOT live inside
# the directory passed as --cwd. Grok Build is a coding agent that explores its cwd on
# start; if it finds its own
# in-flight redirected stdout/stderr sitting there it reads them as "context" and can
# derail into unrelated exploration or stall entirely. --disallowed-tools Shell is
# required because the model's own bundled "imagine" skill prefers hand-drawing exact/
# geometric shapes via code over calling GenerateImage; blocking Shell removes that
# option so it falls back to the real image tool instead of silently substituting one.

PROMPT=""
OUT_FILE=""
MAX_TURNS=6
TIMEOUT_SECS=180

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt) PROMPT="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --max-turns) MAX_TURNS="$2"; shift 2 ;;
    --timeout) TIMEOUT_SECS="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,32p' "$0"
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

if ! command -v grok >/dev/null 2>&1; then
  echo "❌ grok CLI not found. Install Grok Build (~/.grok/bin/grok) and log in via OAuth before running this workflow." >&2
  exit 3
fi

TMP_DIR="$(mktemp -d)"
# The grok --cwd MUST stay separate from where we capture stdout/stderr: if grok's own
# in-flight result.json/result.err live inside its --cwd, it finds and reads them as
# "context" on startup and can derail or stall (confirmed via live testing).
CWD_DIR="$TMP_DIR/workspace"
LOG_DIR="$TMP_DIR/logs"
mkdir -p "$CWD_DIR" "$LOG_DIR"

COPIED_OUT=0
cleanup() {
  if [[ "$COPIED_OUT" -eq 1 ]]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

RESULT_JSON="$LOG_DIR/result.json"
RESULT_ERR="$LOG_DIR/result.err"

SYSTEM_PROMPT_OVERRIDE="You are generating a single image for a headless, non-interactive tool invocation. Always use your built-in image-generation tool (GenerateImage) to produce the requested image. Never hand-write code (SVG, HTML canvas, matplotlib, PIL, etc.) to approximate or draw the image yourself, even if the request describes an exact structure or a simple geometric shape. Call the real image-generation tool exactly once, then end the turn."

# Portable wall-clock timeout: this box has neither GNU `timeout` nor `gtimeout`.
# Run grok in the background, race it against a watchdog sleep. If the watchdog wins,
# it drops a sentinel file so we can tell "grok was killed for timing out" apart from
# "grok exited non-zero on its own" after the fact.
TIMED_OUT_MARKER="$LOG_DIR/timed_out"
set +e
grok -p "$PROMPT" \
  --system-prompt-override "$SYSTEM_PROMPT_OVERRIDE" \
  --output-format json \
  --always-approve \
  --no-subagents \
  --disallowed-tools Shell \
  --max-turns "$MAX_TURNS" \
  --cwd "$CWD_DIR" \
  >"$RESULT_JSON" 2>"$RESULT_ERR" &
GROK_PID=$!

(
  sleep "$TIMEOUT_SECS"
  if kill -0 "$GROK_PID" 2>/dev/null; then
    touch "$TIMED_OUT_MARKER"
    kill -9 "$GROK_PID" 2>/dev/null
  fi
) &
WATCHDOG_PID=$!

wait "$GROK_PID" 2>/dev/null
kill "$WATCHDOG_PID" 2>/dev/null
wait "$WATCHDOG_PID" 2>/dev/null
set -e

if [[ -f "$TIMED_OUT_MARKER" ]]; then
  echo "❌ grok did not finish within ${TIMEOUT_SECS}s; killed the stalled session." >&2
  echo "--- diagnostic (tail of stderr so far) ---" >&2
  tail -n 40 "$RESULT_ERR" >&2 || true
  exit 7
fi

PARSED="$(python3 - "$RESULT_JSON" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path, "r") as f:
        obj = json.load(f)
    session_id = obj.get("sessionId", "") or ""
    stop_reason = obj.get("stopReason", "") or ""
    text = obj.get("text", "") or ""
except Exception:
    print("PARSE_FAILED")
    sys.exit(0)

# Use a delimiter unlikely to appear in the fields, then base64 to keep
# multi-line text intact across the bash/python boundary.
import base64
print("PARSE_OK")
print(base64.b64encode(session_id.encode()).decode())
print(base64.b64encode(stop_reason.encode()).decode())
print(base64.b64encode(text.encode()).decode())
PY
)"

PARSE_STATUS="$(printf '%s\n' "$PARSED" | sed -n '1p')"

if [[ "$PARSE_STATUS" != "PARSE_OK" ]]; then
  echo "❌ Failed to parse grok result.json." >&2
  echo "--- diagnostic (tail of stderr) ---" >&2
  tail -n 40 "$RESULT_ERR" >&2 || true
  exit 4
fi

SESSION_ID="$(printf '%s\n' "$PARSED" | sed -n '2p' | base64 --decode)"
STOP_REASON="$(printf '%s\n' "$PARSED" | sed -n '3p' | base64 --decode)"
MODEL_TEXT="$(printf '%s\n' "$PARSED" | sed -n '4p' | base64 --decode)"

if [[ -z "$SESSION_ID" ]]; then
  echo "❌ grok result.json parsed but sessionId is empty (stopReason=${STOP_REASON:-unknown})." >&2
  echo "--- diagnostic (tail of stderr) ---" >&2
  tail -n 40 "$RESULT_ERR" >&2 || true
  exit 4
fi

IMAGES_DIR="$(find "$HOME/.grok/sessions" -type d -path "*/${SESSION_ID}/images" 2>/dev/null | head -n1 || true)"

if [[ -z "$IMAGES_DIR" ]]; then
  echo "❌ No image was produced for this session." >&2
  echo "--- model's explanation ---" >&2
  echo "$MODEL_TEXT" >&2
  exit 5
fi

IMAGE_COUNT=0
NEWEST_IMAGE=""
NEWEST_MTIME=-1
while IFS= read -r -d '' img; do
  IMAGE_COUNT=$((IMAGE_COUNT + 1))
  mtime="$(stat -f '%m' "$img" 2>/dev/null || stat -c '%Y' "$img" 2>/dev/null || echo 0)"
  if [[ "$mtime" -gt "$NEWEST_MTIME" ]]; then
    NEWEST_MTIME="$mtime"
    NEWEST_IMAGE="$img"
  fi
done < <(find "$IMAGES_DIR" -type f -print0)

if [[ "$IMAGE_COUNT" -eq 0 || -z "$NEWEST_IMAGE" ]]; then
  echo "❌ No image was produced for this session." >&2
  echo "--- model's explanation ---" >&2
  echo "$MODEL_TEXT" >&2
  exit 5
fi

OUT_DIR="$(dirname "$OUT_FILE")"
if ! mkdir -p "$OUT_DIR"; then
  echo "❌ Failed to create parent directory for --out: $OUT_DIR" >&2
  exit 6
fi

if ! cp "$NEWEST_IMAGE" "$OUT_FILE"; then
  echo "❌ Failed to copy generated image to --out: $OUT_FILE" >&2
  exit 6
fi

COPIED_OUT=1

if [[ "$IMAGE_COUNT" -gt 1 ]]; then
  EXTRA=$((IMAGE_COUNT - 1))
  echo "ℹ️  ${EXTRA} additional image(s) also produced in: $IMAGES_DIR" >&2
fi

echo "$OUT_FILE"
