# Reddit CLI Auth Blueprint

## Preferred OAuth fields

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_REFRESH_TOKEN`
- `REDDIT_USER_AGENT`

## Public read-only (no OAuth)

- Set `REDDIT_PUBLIC_ONLY=1`
- Optional: set `REDDIT_USER_AGENT`
- Available in this mode: read-only commands (`subreddit`, `post thread`, `search`, `user profile/comments/posts`)
- Unavailable in this mode: writes, `whoami`, `inbox`, `mentions`, `saved`

## Optional account fields

- `REDDIT_USERNAME`
- `REDDIT_PASSWORD`

## Expected checks

- `run-reddit-cli.sh auth check`
- `run-reddit-cli.sh whoami`

## Security Notes

- Do not echo secrets unless user explicitly asks.
- Keep credential files permission-restricted.
- Re-check auth state after token refresh.
