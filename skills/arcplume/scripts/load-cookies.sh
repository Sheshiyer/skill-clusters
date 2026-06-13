#!/usr/bin/env bash
set -euo pipefail

# Loads AUTH_TOKEN/CT0 from env first, then ~/.claude/.env, then ~/.config/bird/config.json5
# Prints only set/missing status (never token values).

CLAUDE_ENV="${HOME}/.claude/.env"
BIRD_CFG="${HOME}/.config/bird/config.json5"

extract_from_env_file() {
  local key="$1" file="$2"
  [ -f "$file" ] || return 1
  awk -F= -v k="$key" '$1==k {v=substr($0,index($0,"=")+1)} END{if(v!="") print v}' "$file"
}

extract_from_bird_cfg() {
  local key="$1" file="$2"
  [ -f "$file" ] || return 1
  # json5-friendly simple matcher for quoted keys/values
  sed -nE "s/.*['\"]${key}['\"]\s*:\s*['\"]([^'\"]+)['\"].*/\1/p" "$file" | tail -n1
}

AUTH_TOKEN="${AUTH_TOKEN:-}"
CT0="${CT0:-}"

if [ -z "$AUTH_TOKEN" ]; then
  AUTH_TOKEN="$(extract_from_env_file AUTH_TOKEN "$CLAUDE_ENV" || true)"
fi
if [ -z "$CT0" ]; then
  CT0="$(extract_from_env_file CT0 "$CLAUDE_ENV" || true)"
fi

if [ -z "$AUTH_TOKEN" ]; then
  AUTH_TOKEN="$(extract_from_bird_cfg auth_token "$BIRD_CFG" || true)"
fi
if [ -z "$CT0" ]; then
  CT0="$(extract_from_bird_cfg ct0 "$BIRD_CFG" || true)"
fi

export AUTH_TOKEN CT0

[ -n "$AUTH_TOKEN" ] && echo "AUTH_TOKEN: set" || echo "AUTH_TOKEN: missing"
[ -n "$CT0" ] && echo "CT0: set" || echo "CT0: missing"
