---
name: reddit-cli
description: Reddit publishing and research workflow wrapper for a local reddit-cli command surface. Use when asked to read subreddit/user/thread content, monitor inbox/mentions, or publish posts/comments with explicit confirmation and safety controls.
cluster: social-media
version: 1.0.0
---

# Reddit CLI

## Overview

Use this skill for Reddit read/write operations through the deterministic wrapper:
`scripts/run-reddit-cli.sh` (prefers `<reddit-cli-repo>/.venv/bin/reddit-cli`).
Default behavior is read-only. Write commands require explicit confirmation.
For no-OAuth workflows, set `REDDIT_PUBLIC_ONLY=1` to force public read-only mode.

If the binary is missing, treat this skill as a blueprint and report the missing executable plus next setup step.

## Capability Map (Target Wrapper)

### Read operations (default)

- `bash scripts/run-reddit-cli.sh subreddit posts <subreddit>`
- `bash scripts/run-reddit-cli.sh subreddit hot|new|top <subreddit>`
- `bash scripts/run-reddit-cli.sh post thread <post-id-or-url>`
- `bash scripts/run-reddit-cli.sh search <query>`
- `bash scripts/run-reddit-cli.sh user profile <username>`
- `bash scripts/run-reddit-cli.sh user comments <username>`
- `bash scripts/run-reddit-cli.sh user posts <username>`
- `bash scripts/run-reddit-cli.sh inbox`
- `bash scripts/run-reddit-cli.sh mentions`
- `bash scripts/run-reddit-cli.sh saved`

`inbox`, `mentions`, and `saved` are OAuth-only even though they are read actions.

### Write operations (state-changing)

- `bash scripts/run-reddit-cli.sh post create`
- `bash scripts/run-reddit-cli.sh comment reply <thing-id>`
- `bash scripts/run-reddit-cli.sh comment edit <comment-id>`
- `bash scripts/run-reddit-cli.sh vote up|down|clear <thing-id>`
- `bash scripts/run-reddit-cli.sh save|unsave <thing-id>`
- `bash scripts/run-reddit-cli.sh message send`
- `bash scripts/run-reddit-cli.sh subreddit subscribe|unsubscribe <name>`

## Workflow

### 1. Preflight

1. Verify binary wrapper: `bash scripts/run-reddit-cli.sh --help`
2. Verify auth: `bash scripts/run-reddit-cli.sh auth check` or `bash scripts/run-reddit-cli.sh whoami`

If unavailable, stop and report missing command/auth.

For public read-only mode, `auth check` should report `mode=public-read-only`.

### 2. Read-first mode

- Start with bounded limits (`--limit`, `--max-pages`).
- Prefer `--json` for downstream parsing.
- Summarize before expanding scope.

### 3. Draft -> Review -> Post (required)

For any state-changing command:

1. Draft exact content/action plan.
2. Review target subreddit/thread + final text with user.
3. Wait for explicit confirmation (`confirm`/`post`).
4. Execute and return resulting post/comment/message URL/ID.

Until explicit confirmation arrives, remain read-only.

## Auth and Config Blueprint

Expected env variables:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_REFRESH_TOKEN`
- `REDDIT_USER_AGENT`

Optional config path convention:

- `~/.config/reddit-cli/config.json`
- `REDDIT_PUBLIC_ONLY=1` (skip OAuth and force read-only public endpoints)

Deterministic binary resolution order:

1. `REDDIT_CLI_BIN` (if set)
2. `<reddit-cli-repo>/.venv/bin/reddit-cli`
3. `reddit-cli` in `PATH`

## Safety Guardrails

- Enforce explicit confirmation for writes.
- Avoid unbounded fetch/stream unless user asks.
- Respect NSFW boundaries unless explicitly requested.
- Never print secrets by default.

## Maintenance

When reddit-cli is installed/updated, refresh command snapshot:

```bash
bash scripts/capture_help_snapshot.sh
```
