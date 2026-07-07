#!/usr/bin/env bash
set -euo pipefail

# Arcplume diagnostics: checks image-generation readiness for the Grok Build
# CLI session path (grok binary + OAuth session), as opposed to the
# XAI_API_KEY REST path covered by scripts/doctor.sh.
#
# Usage:
#   scripts/doctor-cli.sh
#   scripts/doctor-cli.sh --max-turns 6
#
# Checks:
# 1) grok CLI present on PATH
# 2) grok CLI session/auth valid (delegated to scripts/preflight.sh)
# 3) End-to-end minimal image generation (delegated to scripts/generate-image.sh)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFLIGHT_SH="$SCRIPT_DIR/preflight.sh"
GENERATE_IMAGE_SH="$SCRIPT_DIR/generate-image.sh"

MAX_TURNS=""
PROMPT="Arcplume doctor-cli diagnostic image: a single small gray circle on a white background, no text"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-turns) MAX_TURNS="$2"; shift 2 ;;
    --prompt) PROMPT="$2"; shift 2 ;;
    -h|--help)
      sed -n '1,17p' "$0"
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

CHECKS=()
STATUSES=()
DETAILS=()

add_check() {
  CHECKS+=("$1")
  STATUSES+=("$2")
  DETAILS+=("$3")
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

# 1) grok CLI present on PATH
if command -v grok >/dev/null 2>&1; then
  GROK_VERSION="$(grok --version 2>&1 || true)"
  add_check "grok_cli_present" "PASS" "grok found at $(command -v grok); version: ${GROK_VERSION:-unknown}"
else
  add_check "grok_cli_present" "FAIL" "grok not found on PATH"
  print_matrix
  exit 1
fi

# 2) Session/auth validity (delegated to preflight.sh; do not reimplement)
if [[ ! -x "$PREFLIGHT_SH" ]]; then
  add_check "session_valid" "FAIL" "preflight.sh missing or not executable at $PREFLIGHT_SH"
  add_check "image_generation" "FAIL" "Skipped (preflight not runnable)"
  print_matrix
  exit 1
fi

if "$PREFLIGHT_SH"; then
  add_check "session_valid" "PASS" "preflight.sh exited 0"
else
  PREFLIGHT_CODE=$?
  add_check "session_valid" "FAIL" "preflight.sh exited $PREFLIGHT_CODE"
  add_check "image_generation" "FAIL" "Skipped (preflight failed)"
  print_matrix
  exit 1
fi

# 3) End-to-end minimal image generation
if [[ ! -x "$GENERATE_IMAGE_SH" ]]; then
  add_check "image_generation" "FAIL" "generate-image.sh missing or not executable at $GENERATE_IMAGE_SH"
  print_matrix
  exit 1
fi

GEN_DIR="$(mktemp -d)"
OUT_PATH="$GEN_DIR/doctor-cli-diagnostic.png"

GEN_ARGS=(--prompt "$PROMPT" --out "$OUT_PATH")
if [[ -n "$MAX_TURNS" ]]; then
  GEN_ARGS+=(--max-turns "$MAX_TURNS")
fi

GEN_OUTPUT_FILE="$TMP_DIR/generate-image.out"
if "$GENERATE_IMAGE_SH" "${GEN_ARGS[@]}" >"$GEN_OUTPUT_FILE" 2>&1; then
  GEN_STDOUT="$(cat "$GEN_OUTPUT_FILE")"
  RESULT_PATH="${GEN_STDOUT##*$'\n'}"
  RESULT_PATH="${RESULT_PATH:-$OUT_PATH}"

  if [[ -s "$RESULT_PATH" ]]; then
    FILE_TYPE="$(file -b "$RESULT_PATH" 2>&1 || true)"
    if echo "$FILE_TYPE" | grep -qi "image"; then
      add_check "image_generation" "PASS" "Generated $RESULT_PATH ($FILE_TYPE)"
    else
      add_check "image_generation" "FAIL" "Output file is not recognized as an image: $FILE_TYPE"
      print_matrix
      exit 1
    fi
  else
    add_check "image_generation" "FAIL" "generate-image.sh exited 0 but output file missing or empty: $RESULT_PATH"
    print_matrix
    exit 1
  fi
else
  GEN_CODE=$?
  GEN_STDOUT="$(cat "$GEN_OUTPUT_FILE" 2>/dev/null || true)"
  add_check "image_generation" "FAIL" "generate-image.sh exited $GEN_CODE: ${GEN_STDOUT:-no output}"
  print_matrix
  exit 1
fi

rm -rf "$GEN_DIR"

print_matrix
exit 0
