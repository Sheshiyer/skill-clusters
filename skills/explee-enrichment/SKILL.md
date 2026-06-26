---
name: explee-enrichment
description: "Use Explee enrichment APIs to find emails for contacts in single or batch mode and track async task status. USE WHEN completing outreach data or finding/verifying work emails."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee Enrichment

Use this skill for outreach data completion and email-finding workflows.

**Auth & endpoints:** see `explee-api-core`. Submits use template **T3** (POST); polls use **T4**.

## Endpoints (this product)

- `POST /public/api/v1/enrich/email` — single enrichment
- `POST /public/api/v1/enrich/email/batch` — batch submit
- `GET  /public/api/v1/enrich/email/batch/{task_id}` — batch poll
- `GET  /public/api/v1/tasks` — task status list

## Execution Pattern

1. Use single enrichment for quick checks.
2. Use batch for scale (up to documented limits).
3. Poll the task until `completed` or `failed`.
4. Return final structured results and failure reasons.

## Request Bodies (the unique part)

Wrap in template **T3** (submit) / **T4** (poll `…/batch/${TASK_ID}`) from `explee-api-core`.

Single (note the `mode` field):
```json
{"first_name":"Ada","last_name":"Lovelace","domain":"example.com","mode":"basic"}
```

Batch:
```json
{"contacts":[{"first_name":"Ada","last_name":"Lovelace","domain":"example.com"}]}
```

## Product-specific notes

- **`mode`**: confirm `basic` vs `premium` before running — they differ in credit cost.
- For low match rates, suggest improving name / domain quality.
