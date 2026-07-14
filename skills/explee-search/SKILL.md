---
name: explee-search
description: "Use Explee Search APIs to find companies and people with natural-language targeting and optional AI scoring. USE WHEN finding accounts, prospects, or converting an ICP to filters."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee Search

Use this skill for lead generation, ICP targeting, account research, and people discovery.

**Auth & endpoints:** see `explee-api-core`. These are all `POST` calls (template **T3**) with
`X-API-Key`; cookie mode via `explee-auth-cookie`. The orchestrator / Worker selects cookie-first
with key fallback.

## Endpoints (this product)

- `POST /public/api/v1/search/nl-to-filters` — natural language → filters
- `POST /public/api/v1/search/companies`
- `POST /public/api/v1/search/companies-by-domains`
- `POST /public/api/v1/search/people`
- `POST /public/api/v1/search/people-by-domains`

## Execution Pattern

1. Start from the user goal (ICP, territory, titles, domains).
2. If the input is vague, call `nl-to-filters` first.
3. Run one search endpoint with a limited result set.
4. Return concise rows + a next-step recommendation.

## Request bodies

Wrap any call in template **T3** from `explee-api-core`.

**`nl-to-filters`** — natural-language ICP → structured filters. The body field is **`query`**
(verified against the live API; `{"definition": …}` here returns **HTTP 422**):
```json
{"query":"B2B fintech in Europe hiring SDRs"}
```
It returns `{ "focus": "companies"|"people", "companies_filters": {…}, "people_filters": {…} }`.
Feed those returned `*_filters` objects into the search endpoints below.

**`companies` / `people`** — pass the `companies_filters` / `people_filters` object from
`nl-to-filters`. The exact accepted field set isn't pinned here — confirm against
`https://api.explee.com/public/api/docs` before a paid run.
