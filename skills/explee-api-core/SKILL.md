---
name: explee-api-core
description: "Shared reference for all Explee skills: base URL, full endpoint catalog, API-key authentication, canonical curl templates, and shared error/retry/guardrail rules. USE WHEN an Explee task needs endpoint, auth, retry, or guardrail context."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee API Core

Shared reference for the Explee skill cluster. The hub (`explee-orchestrator`) and the product
spokes (`explee-search`, `explee-enrichment`, `explee-agents`, `explee-autogtm`) reference this
file for the base URL, endpoint catalog, authentication, request templates, error handling, and
guardrails — so none of them repeat it.

> This is a reference, not a workflow. It isn't invoked on its own; the other Explee skills point here.

## Base URL

- API host: `https://api.explee.com`
- Docs UI: `https://api.explee.com/public/api/docs`

This is the Explee API host — **not** a Cloudflare Worker URL. A Worker may sit in front of it to
inject cookie/session auth; see `explee-auth-cookie`.

## Authentication (API key)

Default / headless mode uses an API-key header:

- Header: `X-API-Key: <api_key>`
- Shell: `export EXPLEE_API_KEY='<your_api_key>'`

The same endpoints also accept **cookie/session** auth. For the cookie header and the
`EXPLEE_SECRETS` KV credential model (the cookie-first / key-fallback flow), see `explee-auth-cookie`.

## Endpoint Catalog

All paths are relative to `https://api.explee.com`.

| Method | Path | Product | Purpose |
|---|---|---|---|
| POST | `/public/api/v1/search/nl-to-filters` | Search | Natural-language ICP → filters |
| POST | `/public/api/v1/search/companies` | Search | Find companies / accounts |
| POST | `/public/api/v1/search/companies-by-domains` | Search | Resolve companies from domains |
| POST | `/public/api/v1/search/people` | Search | Find people by role / title / filters |
| POST | `/public/api/v1/search/people-by-domains` | Search | Find people at given domains |
| POST | `/public/api/v1/enrich/email` | Enrichment | Find / verify a single work email |
| POST | `/public/api/v1/enrich/email/batch` | Enrichment | Submit a batch email-enrichment job |
| GET | `/public/api/v1/enrich/email/batch/{task_id}` | Enrichment | Poll a batch enrichment job |
| GET | `/public/api/v1/tasks` | Enrichment | List async task status |
| GET | `/public/api/v1/agents` | Agents | List agents + their `input_schema` |
| POST | `/public/api/v1/agents/{agent_id}/runs` | Agents | Run a pre-built agent |
| POST | `/public/api/v1/agents/runs` | Agents | Run a custom agent |
| GET | `/public/api/v1/agents/runs/{run_id}` | Agents | Poll an agent run |

**AutoGTM** adds no endpoints of its own — it composes Search + Enrichment.

> **Request-body note:** `nl-to-filters` takes `{"query": "<natural language>"}` (verified — **not**
> `definition`, which returns HTTP 422) and returns `companies_filters` / `people_filters`, which feed
> `/search/companies` and `/search/people`. Confirm other endpoints' body fields at `/public/api/docs`.

## Canonical curl Templates

Four templates cover every call. Substitute `<endpoint>` with a path from the catalog. For cookie
auth, swap `-H "X-API-Key: ${EXPLEE_API_KEY}"` for `-H "Cookie: ${EXPLEE_COOKIE}"` (see
`explee-auth-cookie`).

**T1 — GET**
```bash
curl 'https://api.explee.com/<endpoint>' \
  -H 'Accept: application/json' \
  -H "X-API-Key: ${EXPLEE_API_KEY}"
```

**T2 — GET with query params**
```bash
curl 'https://api.explee.com/<endpoint>?page=1&limit=20' \
  -H 'Accept: application/json' \
  -H "X-API-Key: ${EXPLEE_API_KEY}"
```

**T3 — POST with JSON body**
```bash
curl 'https://api.explee.com/<endpoint>' \
  -X POST \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: ${EXPLEE_API_KEY}" \
  --data '{"key":"value"}'
```

**T4 — Poll by id (GET with path param)**
```bash
curl "https://api.explee.com/<endpoint>/${ID}" \
  -H 'Accept: application/json' \
  -H "X-API-Key: ${EXPLEE_API_KEY}"
```

## Errors & Retry

| Status | Meaning | Action |
|---|---|---|
| `401` / `403` | Auth expired / invalid | If using cookie, retry **once** with API key; else refresh credentials (`explee-auth-cookie`) |
| `404` | Path differs from docs | Re-check `https://api.explee.com/public/api/docs` |
| `415` / `422` | Payload / schema mismatch | Re-validate the request body against the docs |
| `429` | Rate / credit limit | Back off; reduce batch size |

Async jobs (`/enrich/email/batch/{task_id}`, `/agents/runs/{run_id}`): poll until status is
`completed` or `failed`, then surface results and any failure reasons. Server-side `curl` / agent
calls are **not** subject to browser CORS.

## Shared Guardrails

- Never print a full API key or full cookie string in user-visible output.
- Call out estimated credit impact before large or batch operations.
- Start narrow — run a small pilot before scaling a search or enrichment.
- Validate payloads (and any returned `input_schema`) before POSTing.
- Confirm scope before mutating or high-cost actions; don't trigger unrelated endpoints.

## How spokes use this

Product skills don't repeat the base URL, API-key setup, templates, or guardrails. They state only
their own endpoints and unique workflow, then defer here for the mechanics.
