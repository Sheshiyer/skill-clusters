# Reddit CLI Command Taxonomy

Use deterministic wrapper path:

- `bash scripts/run-reddit-cli.sh`

Default binary path:

- `/Volumes/madara/2026/twc-vault/01-Projects/reddit-cli/.venv-codex/bin/reddit-cli`

Optional override:

- `REDDIT_CLI_BIN=/custom/path/to/reddit-cli`
- `REDDIT_PUBLIC_ONLY=1` forces public read-only mode (no OAuth)

## Read Commands

- `run-reddit-cli.sh subreddit posts <subreddit> [--sort hot|new|top] [--limit N] [--json]`
- `run-reddit-cli.sh post thread <post-id-or-url> [--limit N] [--json]`
- `run-reddit-cli.sh search <query> [--subreddit NAME] [--limit N] [--json]`
- `run-reddit-cli.sh user profile <username> [--json]`
- `run-reddit-cli.sh user comments <username> [--limit N] [--json]`
- `run-reddit-cli.sh user posts <username> [--limit N] [--json]`
- `run-reddit-cli.sh inbox [--limit N] [--json]`
- `run-reddit-cli.sh mentions [--limit N] [--json]`
- `run-reddit-cli.sh saved [--limit N] [--json]`

## Write Commands

- `run-reddit-cli.sh post create --subreddit NAME --title TEXT --body TEXT`
- `run-reddit-cli.sh comment reply <thing-id> --text TEXT`
- `run-reddit-cli.sh comment edit <comment-id> --text TEXT`
- `run-reddit-cli.sh vote up|down|clear <thing-id>`
- `run-reddit-cli.sh save|unsave <thing-id>`
- `run-reddit-cli.sh message send --to USER --subject TEXT --body TEXT`
- `run-reddit-cli.sh subreddit subscribe|unsubscribe <name>`

These write commands require OAuth user auth and are blocked in public read-only mode.

## Publish Guardrail

All write commands must use Draft -> Review -> Post with explicit user confirmation.
