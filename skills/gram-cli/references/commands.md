# Gram CLI Command Reference

This reference captures the gram/glam CLI surface used for Instagram download workflows.

## Entry Points

- Deterministic wrapper: `bash scripts/run-glam.sh`
- Underlying default binary: `/Volumes/madara/2026/twc-vault/01-Projects/gram-cli/.venv-codex/bin/glam`
- Optional override: `GRAM_CLI_BIN=/custom/path/to/glam`

## Core Commands

### Preflight / Identity

- `bash scripts/run-glam.sh check`
- `bash scripts/run-glam.sh whoami`

### Auth

- `bash scripts/run-glam.sh login --chrome-profile <name>`
- `bash scripts/run-glam.sh login --firefox-profile <name>`
- Optional flags:
  - `--save` (persist cookies/config)
  - `--print-env` (print export lines)
  - `--no-lock` (copy cookie DB first)

### Read / Download

- `bash scripts/run-glam.sh profile <username> [--posts] [--stories] [--highlights] [--limit N] [--resume] [--output DIR]`
- `bash scripts/run-glam.sh post <instagram-post-url> [--output DIR]`
- `bash scripts/run-glam.sh stories [username] [--output DIR]`
- `bash scripts/run-glam.sh highlights <username> [--output DIR]`

## Global Flags

- `--config <path>`
- `--json`
- `--quiet`

## Operational Guardrails

- Use `--limit` for bounded profile pulls.
- Use `--resume` for idempotent reruns.
- Prefer `--json` for machine parsing.
- Treat `login --save` as state-changing and require clear approval when changing auth storage.
