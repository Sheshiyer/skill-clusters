# Bird CLI Command Reference

This reference is derived from `bird --help` and selected `bird <command> --help` outputs on 2026-02-21.

## Core Global Flags

- Auth:
  - `--auth-token <token>`
  - `--ct0 <token>`
  - `--chrome-profile <name>`
  - `--chrome-profile-dir <path>`
  - `--firefox-profile <name>`
  - `--cookie-source <source>` (repeatable)
  - `--cookie-timeout <ms>`
- Request/runtime:
  - `--timeout <ms>`
  - `--quote-depth <depth>`
- Output style:
  - `--plain`
  - `--no-emoji`
  - `--no-color`

## JSON-capable Commands

From CLI help, `--json` is supported by:

- `read`
- `replies`
- `thread`
- `search`
- `mentions`
- `bookmarks`
- `likes`
- `following`
- `followers`
- `about`
- `lists`
- `list-timeline`
- `user-tweets`
- `query-ids`

`--json-full` is available for tweet commands to include raw API payloads.

## Command Groups

### Preflight / Identity

- `bird check`
- `bird whoami`
- `bird query-ids [--json] [--fresh]`

### Read Tweet(s)

- `bird read <tweet-id-or-url> [--json] [--json-full]`
- `bird replies <tweet-id-or-url> [--all] [--max-pages N] [--cursor C] [--json]`
- `bird thread <tweet-id-or-url> [--all] [--max-pages N] [--cursor C] [--json]`
- Shortcut: `bird <tweet-id-or-url> [--json]`

### Discovery / Search

- `bird search <query> [-n N] [--all] [--max-pages N] [--cursor C] [--json]`
- `bird mentions [-u @handle] [-n N] [--json]`
- `bird home [-n N] [--following] [--json]`
- `bird user-tweets <handle> [-n N] [--max-pages N] [--delay ms] [--cursor C] [--json]`
- `bird news|trending [-n N] [--ai-only] [--with-tweets] [--tweets-per-item N] [--for-you|--news-only|--sports|--entertainment|--trending-only] [--json]`

### Account Collections

- `bird bookmarks [-n N] [--folder-id ID] [--all] [--max-pages N] [--cursor C] [--json]`
- `bird likes [-n N] [--all] [--max-pages N] [--cursor C] [--json]`
- `bird lists [--json]`
- `bird list-timeline <list-id-or-url> [-n N] [--all] [--max-pages N] [--cursor C] [--json]`
- `bird following [--json]`
- `bird followers [--json]`
- `bird about <username> [--json]`

### Write / State-changing

- `bird tweet <text>`
- `bird reply <tweet-id-or-url> <text>`
- `bird unbookmark <tweet-id-or-url...>`
- `bird follow <username-or-id>`
- `bird unfollow <username-or-id>`

### Draft -> Review -> Post (required for write commands)

For `tweet`, `reply`, `follow`, `unfollow`, and `unbookmark`:

1. Draft the exact text/action in chat first.
2. Review by restating target + final command intent.
3. Wait for explicit user confirmation (`confirm`/`post`).
4. Execute command and report ID/URL/result.

There is no dry-run publish flag, so review text in chat is mandatory before execution.

## Operational Guardrails

- Prefer bounded runs (`-n`, `--max-pages`) over unbounded `--all`.
- For `list-timeline --all`, CLI help includes ban risk warning; use only with explicit user consent.
- Use `--json` whenever structured downstream parsing is needed.
- If explicit confirmation is missing for a state-changing command, stay read-only.
