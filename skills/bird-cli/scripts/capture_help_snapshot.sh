#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/references"
OUT_FILE="$OUT_DIR/help-snapshot.txt"

mkdir -p "$OUT_DIR"

commands=(
  "--help"
  "query-ids --help"
  "tweet --help"
  "reply --help"
  "read --help"
  "replies --help"
  "thread --help"
  "search --help"
  "mentions --help"
  "bookmarks --help"
  "unbookmark --help"
  "follow --help"
  "unfollow --help"
  "lists --help"
  "list-timeline --help"
  "home --help"
  "following --help"
  "followers --help"
  "likes --help"
  "whoami --help"
  "about --help"
  "user-tweets --help"
  "news --help"
  "check --help"
)

{
  echo "# bird help snapshot"
  echo "# generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo

  for c in "${commands[@]}"; do
    echo "============================================================"
    echo "$ bird $c"
    echo "============================================================"
    # shellcheck disable=SC2086
    bird $c || true
    echo
  done
} > "$OUT_FILE"

echo "Wrote $OUT_FILE"
