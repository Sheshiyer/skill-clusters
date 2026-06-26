---
name: explee-orchestrator
description: "Route user intent to the correct Explee product skill (Search, Enrichment, Agents, AutoGTM), using cookie-first auth with API-key fallback. USE WHEN a user has an Explee task but hasn't named the specific product."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee Orchestrator

The single entry skill for Explee tasks. It decides which product workflow to run and which
credential mode to use, then delegates the mechanics.

## Cluster map (routing targets)

- `explee-search` — companies / people / ICP → filters
- `explee-enrichment` — single & batch email finding, task status
- `explee-agents` — pre-built & custom agent runs + polling
- `explee-autogtm` — end-to-end GTM pipeline (composes search + enrichment)
- `explee-auth-cookie` — cookie/session + `EXPLEE_SECRETS` KV auth
- `explee-api-core` — shared base URL, endpoint catalog, templates, errors, guardrails

## Routing Rules by Intent

- **Search** → `explee-search`: find companies / accounts / prospects, find people by
  role/title/domain, or convert a natural-language ICP to filters.
- **Enrichment** → `explee-enrichment`: find/verify work emails, run single or batch enrichment,
  or track task status.
- **Agents** → `explee-agents`: run pre-built agent workflows, run custom agents with
  prompts/schemas, or poll agent runs.
- **AutoGTM** → `explee-autogtm`: build an end-to-end GTM pipeline, turn an ICP into a prioritized
  outreach list, or chain search + enrichment + ranking.

## Credential Strategy

Preference order (mechanics in `explee-auth-cookie` and `explee-api-core`):

1. **Cookie first** — when a session cookie / `EXPLEE_SECRETS` KV is available.
2. **API key fallback** — `X-API-Key` when the cookie is unavailable or rejected.
3. **On failure** — on `401` / `403` with a cookie, retry once with the API key; if both fail, ask
   the user to refresh credentials.

When deployed as a Worker (`worker/` in this repo — `explee-proxy`), this order runs server-side:
callers hit the proxy with `X-Proxy-Token: <token>` and it injects the cookies / falls back to the
key automatically. See `explee-auth-cookie` and `worker/README.md`.

## Standard Operating Flow

1. Classify intent into one route (Search / Enrichment / Agents / AutoGTM).
2. Confirm the objective and expected output format.
3. Execute with cookie auth first.
4. If needed, retry with API-key fallback.
5. Return a concise summary: selected route, endpoint(s), auth mode used, status code(s), result
   summary, and the next action.

## Guardrails

See the shared guardrails in `explee-api-core` (don't print full credentials, flag credit impact,
pilot before scaling, confirm scope on mutating / high-cost actions).
