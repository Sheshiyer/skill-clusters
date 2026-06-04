---
name: business-content-orchestrator
description: "Route a business-content task to the right skill among 10 specialists — voice profiling, long-form articles, multi-platform content systems, SEO, market/competitor research, launch campaigns, investor decks/memos, investor outreach, lead intelligence, and social-graph ranking. USE WHEN a user is writing, marketing, fundraising, or doing outbound for a product or company but hasn't named the specific concern."
cluster: business-content
version: 1.0.0
---

# Business-Content Orchestrator

The single entry skill for go-to-market writing and outbound. It locates the task on the
**lane × audience** map and delegates to one of 10 specialist spokes. The cross-cutting model
every spoke shares — the source-derived **Voice Profile**, the research/signal substrate, and
the channel contract that keeps a message native to its surface — lives in
`business-content-core`; read it before drafting anything reputation-, launch-, or
fundraising-sensitive.

## Routing map (intent → spoke)

**Establish the voice & evidence (shared substrate — almost always first)**
- Reusable style from real source material → `brand-voice` *(produces the `VOICE PROFILE` every other lane consumes)*
- Market sizing, competitor scans, fund/diligence research → `market-research` *(produces the evidence other lanes cite)*

**Publish (own channels)**
- Long-form: articles, guides, tutorials, newsletter issues → `article-writing`
- Platform-native systems: X / LinkedIn / TikTok / YouTube threads, scripts, calendars, repurposing → `content-engine`
- Search visibility: technical SEO, on-page, schema, Core Web Vitals, keyword mapping → `seo`

**Market (the launch)**
- Multi-channel launch as one orchestrated campaign (positioning → landing copy → email → ads → social → video scripts) → `marketing-campaign` *(itself an orchestration layer; it pulls `brand-voice`, `content-engine`, and `seo`)*

**Fund (investor-facing)**
- Decks, one-pagers, memos, models, accelerator apps that must stay mutually consistent → `investor-materials`
- Cold emails, warm-intro blurbs, follow-ups, update emails to angels/VCs/accelerators → `investor-outreach`

**Reach (outbound & network)**
- Full find → score → warm-path → enrich → draft pipeline for high-value contacts → `lead-intelligence`
- The standalone graph-ranking engine (bridge math, decay tuning, network-gap analysis) → `social-graph-ranker` *(the model `lead-intelligence` runs internally; break it out when the user wants the ranking itself)*

## Standard Operating Flow

1. Locate the task: which lane (publish / market / fund / reach) and which audience (public, investor, prospect).
2. If the output is voice-sensitive, **run `brand-voice` first** and reuse its `VOICE PROFILE` — never re-derive style per draft or default to generic AI copy. If it makes a business claim, ground it via `market-research`. (Model in `business-content-core`.)
3. Delegate to the spoke(s). Multi-step asks fan out in lane order — e.g. "launch this" → `brand-voice` → `marketing-campaign` (which pulls `content-engine` + `seo`); "raise a round" → `investor-materials` → `investor-outreach`; "find and reach buyers" → `social-graph-ranker` → `lead-intelligence`.
4. Return: chosen spoke(s), the voice/evidence inputs they consumed, the target channel(s), and the next action (draft, deck, sequence, or outreach list).

## Guardrails

See `business-content-core`. In short: **voice-first, evidence-backed, channel-native** — one
`VOICE PROFILE` flows everywhere instead of per-draft mimicry; every business claim traces to a
real source, not invention; each message is shaped for its surface (the same copy reused across
email, LinkedIn, and X is a tell). Never auto-send outbound — draft and let the user approve.
The cluster's value is content that reads like a specific person with receipts; don't quietly
let it collapse into platform slop.
