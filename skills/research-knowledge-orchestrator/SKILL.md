---
name: research-knowledge-orchestrator
description: "Route a research or knowledge task to the right skill among 12 specialists — current-web research, neural discovery, multi-source cited synthesis, systematic literature review, scholarly evaluation, biomedical/patent/genomic databases, codebase onboarding, guided code tours, live docs lookup, and persistent project memory. USE WHEN a user wants to research, investigate, review the literature, look something up, or understand a codebase but hasn't named the specific tool."
cluster: research-knowledge
version: 1.0.0
---

# Research & Knowledge Orchestrator

The single entry skill for research and knowledge work. It locates the task on the
**question type × evidence depth** map and delegates to one of 12 specialist spokes. The
cross-cutting discipline every spoke shares — pick the *lightest* evidence lane that answers
the question, label every claim by provenance, and escalate only when synthesis demands it —
lives in `research-knowledge-core`; read it before promising coverage or mixing sources.

## Routing map (intent → spoke)

**Operate a research pass (start here when the lane is unclear)**
- "Research this", "compare", "what's the latest", recurring lookup → `research-ops` *(operator wrapper; chooses the lane below)*

**Current-web research**
- Fast discovery / web · code · company · people lookup → `exa-search`
- Thorough, cited, multi-source report ("deep dive", "current state of") → `deep-research`

**Academic & scientific literature**
- Find · screen · synthesize · cite a body of literature → `scientific-thinking-literature-review`
- Judge a paper / proposal / methods section / evidence quality → `scientific-thinking-scholar-evaluation`
- Biomedical literature, MeSH, PMID, E-utilities → `scientific-db-pubmed-database`
- Patents & trademarks, official IP records → `scientific-db-uspto-database`
- Genomic database queries, sequence lookup, enrichment → `scientific-pkg-gget`

**Understand a codebase**
- Map an unfamiliar repo → onboarding guide + starter CLAUDE.md → `codebase-onboarding`
- Author a step-by-step `.tour` walkthrough (onboarding / PR / RCA) → `code-tour`

**Reference & memory**
- Up-to-date library/framework docs (named framework, API, setup) → `documentation-lookup`
- Persist project context across sessions; resume where you left off → `ck`

## Standard Operating Flow

1. Classify the ask: which **question type** (current fact · comparison · literature · IP · genomic · codebase · API reference · resume context) and which **evidence depth**.
2. Take the **lightest useful lane first** — local/docs/memory before web, `exa-search` before `deep-research`, scoping review before systematic. The model and escalation ladder are in `research-knowledge-core`.
3. Delegate to the spoke(s). Multi-step asks fan out in evidence order (e.g. "review the literature and rate the key paper" → `scientific-thinking-literature-review` → `scientific-thinking-scholar-evaluation`).
4. Return: chosen spoke(s), the evidence lane used, claims labeled by provenance (sourced fact / supplied context / inference / recommendation), dates on freshness-sensitive answers, and the next action.

## Guardrails

See `research-knowledge-core`. In short: **evidence-tier discipline** — never answer a current
question from stale memory when a fresh search is cheap; never mix inference into sourced facts
without labeling it; never spin up a heavyweight research pass when local code, docs, or `ck`
memory already hold the answer; always date freshness-sensitive claims and name your sources.
The cluster's value is *trustworthy, traceable* answers — don't trade that for speed.

## Boundaries

- **"Research this" — which spoke?** Default a bare, lane-unclear "research this" to
  `research-ops`, which picks the rung. Skip it and go direct when the lane is already obvious:
  `deep-research` for a thorough multi-source cited report on a *general/web* topic; the
  `scientific-*` spokes (`scientific-thinking-literature-review`, `-scholar-evaluation`,
  `scientific-db-pubmed-database`, `-uspto-database`, `scientific-pkg-gget`) when the subject is
  *academic / biomedical / IP / genomic* and needs scholarly rigor or a citable database.
- **Codebase, not the web.** `codebase-onboarding` and `code-tour` operate on *this* repo's own
  source — mapping it and authoring `.tour` walkthroughs. They are not web research; for external
  topics use `deep-research` / `exa-search` instead.
