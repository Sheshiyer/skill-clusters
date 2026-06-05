---
name: bird-cli
description: X/Twitter operations using the bird CLI for reading timelines, searching posts, fetching threads/replies, and posting tweets or replies. Use when asked to read Twitter/X content, monitor mentions, get bookmarks/likes/follows/lists, publish via bird, or debug bird authentication/config.
cluster: social-media
version: 1.0.0
---

# Bird CLI

## Overview

Use this skill to operate Twitter/X through the local `bird` CLI (`bird 0.8.0`).
Prefer JSON output (`--json`) for machine-readable processing, then summarize for the user.

## Capability Map (from `bird --help`)

- Identity/auth checks: `check`, `whoami`, `query-ids`
- Read single tweet: `read`, shorthand `bird <tweet-id-or-url> [--json]`
- Read conversations: `replies`, `thread`
- Discovery: `search`, `mentions`, `news`/`trending`, `home`, `user-tweets`
- Library/account views: `bookmarks`, `likes`, `lists`, `list-timeline`, `following`, `followers`, `about`
- Write actions: `tweet`, `reply`, `unbookmark`, `follow`, `unfollow`

Load detailed command notes from `references/commands.md` when choosing flags.

## Workflow

### 1. Preflight

1. Confirm binary: `command -v bird && bird --version`
2. Check credentials: `bird check`
3. Verify account context: `bird whoami`

If credential checks fail, report the exact error and stop before any publish flow starts.
These checks are mandatory before draft/review/post steps.

### 2. Read-first defaults

Use read commands by default unless the user explicitly asks to modify account state.

- Start with narrow fetch sizes (`-n 10` or `-n 20`)
- Prefer `--json` for parsing and reliable summarization
- Use `--cursor`/`--max-pages` for controlled pagination
- Avoid broad scraping flags unless explicitly requested

### 3. Write actions (state-changing)

Treat these as state-changing commands:

- `tweet`
- `reply`
- `unbookmark`
- `follow`
- `unfollow`

Run these commands only through this sequence:

1. Draft: produce the exact text or action plan.
2. Review: show the draft/command target and request explicit confirmation (`confirm`/`post`).
3. Post: execute only after explicit confirmation and return resulting IDs/URLs.

Until confirmation arrives, remain read-only even if the intent seems obvious.
If intent is unclear, ask once before executing.

### 4. Safety and rate-risk guidance

- `list-timeline --all` warns account ban risk in CLI help; do not use unless user explicitly requests it.
- Prefer bounded pagination (`--max-pages`) over unbounded `--all`.
- Keep timeouts explicit for long jobs (`--timeout <ms>`).
- Treat the review step as the write authorization guardrail; do not skip it.

## Output Patterns

- For exploration requests: return concise highlights + important IDs/URLs.
- For monitoring requests: return counts, top items, and next cursor if pagination remains.
- For publish requests: include the command result and posted tweet ID/URL when available.

## Auth and Config Notes

Bird supports credentials via:

- direct cookies: `--auth-token`, `--ct0`
- browser profile extraction: `--chrome-profile`, `--chrome-profile-dir`, `--firefox-profile`, `--cookie-source`
- config files: `~/.config/bird/config.json5` and `./.birdrc.json5`

Useful env vars:

- `BIRD_TIMEOUT_MS`
- `BIRD_COOKIE_TIMEOUT_MS`
- `BIRD_QUOTE_DEPTH`
- `NO_COLOR`

## Maintenance

If Bird is upgraded, regenerate command help snapshot:

```bash
bash scripts/capture_help_snapshot.sh
```

This refreshes `references/help-snapshot.txt`.
