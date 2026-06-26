---
name: explee-autogtm
description: "Orchestrate an end-to-end AutoGTM flow: ICP query → account/person discovery → enrichment → prioritized outreach list. USE WHEN building a full GTM pipeline from a natural-language objective."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee AutoGTM

Use this skill for full-funnel go-to-market automation using Explee APIs.

This skill is a **composition** — it chains `explee-search` and `explee-enrichment` and adds no
new endpoints. **Auth & endpoints:** see `explee-api-core` (every step is template **T3**).

## Objective

Produce a prioritized, outreach-ready list from a natural-language GTM objective.

## AutoGTM Workflow

1. **Translate ICP → filters** — `POST /public/api/v1/search/nl-to-filters`
2. **Find target accounts and decision-makers** —
   `POST /public/api/v1/search/companies` + `POST /public/api/v1/search/people`
3. **Enrich contactability** — `POST /public/api/v1/enrich/email` (or the batch variant)
4. **Rank for activation** — by title relevance, company-fit score, and enrichment success
5. **Return GTM-ready output** — company, person, title, email status, priority tier, reasoning

## Example bodies

Step 1 (`nl-to-filters`) — body field is **`query`** (verified; `definition` returns HTTP 422). It
returns `companies_filters` / `people_filters` that feed steps 2–3:
```json
{"query":"US B2B SaaS, 50-500 employees, hiring RevOps"}
```

Step 3 (`enrich/email`):
```json
{"first_name":"Jane","last_name":"Doe","domain":"acme.com","mode":"basic"}
```

For the `companies` / `people` search bodies (step 2), pass the `*_filters` from step 1; confirm the
exact fields at `https://api.explee.com/public/api/docs`.

## Output Format (required)

Always return:
- Query objective used
- Endpoints called
- Candidate count by stage (found → enriched → prioritized)
- Top targets with short reason codes (`FIT`, `ROLE`, `EMAIL_OK`)
