---
name: explee-auth-cookie
description: "Cookie/session and EXPLEE_SECRETS KV credential model for Explee: build the Cookie header, the cookie-first/key-fallback rule, and the cookie-vs-tracking-param pitfalls. USE WHEN setting up or refreshing Explee auth. Endpoints and API-key auth: see explee-api-core."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee Auth (Cookie & KV)

The cookie/session credential specialist for the Explee cluster. Endpoints, the API-key header,
request templates, and shared error handling live in `explee-api-core` — this skill owns only the
**cookie/session** side and the **`EXPLEE_SECRETS` KV** model.

## Operating Rules

1. **Never hardcode cookies in files.** Treat cookies as sensitive credentials; obtain them from
   the user (or read them from KV — see below) for the current session.
2. **Use `Cookie:` header authentication.** Include the cookie string exactly as issued:
   `Cookie: <name1>=<...>; <name2>=<...>; ...`
3. **Don't confuse URL tracking params with cookies.** Query params like `_gl` and `_gcl_au` are
   URL analytics parameters — **not** valid `Cookie` header values. Use only real browser cookie
   key/value pairs from the `Cookie` request header.
4. **Discover endpoints from docs first** (`https://api.explee.com/public/api/docs`) and confirm
   assumptions before any mutating request.
5. **Safe progression:** test auth on a read-only endpoint first, then perform the operation.
6. **Be explicit in outputs:** report method, endpoint, status, and a summarized response. If
   unauthorized, ask for (or refresh) credentials.

## Cookie templates

Use the four templates in `explee-api-core` (T1–T4), but swap the auth header:

```bash
export EXPLEE_COOKIE='<name1>=<...>; <name2>=<...>'
# replace:  -H "X-API-Key: ${EXPLEE_API_KEY}"
# with:     -H "Cookie: ${EXPLEE_COOKIE}"
```

## EXPLEE_SECRETS / KV credential model

For headless / Worker use, cookie values are stored in a Cloudflare **KV namespace `EXPLEE_SECRETS`**
with three keys:

| KV key | Holds |
|---|---|
| `ex_access` | Explee access cookie value |
| `ex_org` | Explee org cookie value |
| `logto_session` | Value of the Logto session cookie (`logto_<session_id>`) |

A Cloudflare Worker reads these three keys, assembles the `Cookie:` header, calls Explee, and on
`401` / `403` **falls back to `X-API-Key`** — this is the cluster's "cookie-first, key-fallback" rule.

> The wrangler setup steps live in the repo `README.md`. **Placeholders only** — never commit real
> cookie values, `ex_access` / `ex_org` / `logto_session` values, or API keys to this repo.

**Deployed implementation:** `worker/` in this repo (`explee-proxy`) is exactly this Worker — it gates
inbound calls on `X-Proxy-Token`, then injects the KV cookies and falls back to the key. Point Explee
calls at the proxy origin instead of `api.explee.com`; see `worker/README.md`.

## Troubleshooting (cookie-specific)

- **401 / 403** — cookie expired or incomplete. Refresh the cookie set (or the KV keys); then, if a
  key is available, retry once with `X-API-Key`.
- **Cookie missing keys** — if the session cookie exists but auth still fails, capture the full
  cookie set from an authenticated request.
- For non-auth status codes (404 / 415 / 422 / 429) and async polling, see `explee-api-core`.

## What to avoid

- Don't store cookies in repository files or plans.
- Don't print full cookie values in user-visible summaries.
- Don't run destructive endpoints without confirming intent.
