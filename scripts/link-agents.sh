#!/usr/bin/env bash
#
# link-agents.sh — make ~/.agents/skills/<skill> point at THIS repo's canonical copies,
# so the repo is the single source of truth and your local agent runtime sees the same files.
#
# SAFE BY DEFAULT: prints what it WOULD do and changes nothing. Pass --apply to execute.
# Reversible: --unlink restores the backed-up originals.
#
#   ./scripts/link-agents.sh              # dry-run (default) — preview
#   ./scripts/link-agents.sh --apply      # create symlinks (originals moved to backup)
#   ./scripts/link-agents.sh --unlink --apply   # remove symlinks, restore originals
#
set -euo pipefail

REPO_SKILLS="$(cd "$(dirname "$0")/../skills" && pwd)"
AGENTS_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"
BACKUP_DIR="$HOME/.agents/skills.backup"

APPLY=0; UNLINK=0; SKIP_HEALTH=0
for a in "$@"; do
  case "$a" in
    --apply)  APPLY=1 ;;
    --unlink) UNLINK=1 ;;
    --skip-health) SKIP_HEALTH=1 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "unknown arg: $a (use --apply / --unlink / --skip-health / --help)"; exit 2 ;;
  esac
done

run() { if [ "$APPLY" = 1 ]; then eval "$@"; else echo "    [dry-run] $*"; fi; }

# Drift firewall: structural Skills-Health gate must pass before we deploy (fail closed).
# Skipped for --unlink (tearing down) and when --skip-health is explicit.
if [ "$APPLY" = 1 ] && [ "$UNLINK" = 0 ] && [ "$SKIP_HEALTH" = 0 ]; then
  if command -v node >/dev/null 2>&1; then
    echo "Running Skills-Health gate…"
    if ! node "$(dirname "$0")/skills-health.mjs"; then
      echo "✖ Skills-Health FAILED — refusing to deploy. Fix errors or re-run with --skip-health." >&2
      exit 1
    fi
  else
    echo "⚠ node not found — skipping Skills-Health gate (install Node ≥18 for drift protection)." >&2
  fi
fi

mkdir -p "$AGENTS_DIR"
[ "$APPLY" = 1 ] || echo "DRY-RUN (no changes). Re-run with --apply to execute."
echo "repo skills : $REPO_SKILLS"
echo "agents dir  : $AGENTS_DIR"
echo

for src in "$REPO_SKILLS"/*/; do
  name="$(basename "$src")"
  dest="$AGENTS_DIR/$name"

  if [ "$UNLINK" = 1 ]; then
    if [ -L "$dest" ]; then
      echo "unlink  $name"
      run "rm \"$dest\""
      [ -d "$BACKUP_DIR/$name" ] && run "mv \"$BACKUP_DIR/$name\" \"$dest\""
    else
      echo "skip    $name (not a symlink)"
    fi
    continue
  fi

  if [ -L "$dest" ]; then
    echo "ok      $name (already symlinked)"
    continue
  fi
  if [ -e "$dest" ]; then
    echo "backup  $name -> $BACKUP_DIR/$name"
    run "mkdir -p \"$BACKUP_DIR\" && mv \"$dest\" \"$BACKUP_DIR/$name\""
  fi
  echo "link    $name"
  run "ln -s \"${src%/}\" \"$dest\""
done

echo
echo "done${APPLY:+ (applied)}"
