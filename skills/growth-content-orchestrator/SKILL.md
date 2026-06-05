---
name: growth-content-orchestrator
description: "Route a growth/marketing task to the right skill among 13 demand-generation specialists — content strategy, long-form writing, conversion copy and editing, cold and lifecycle email, paid ad creative, lead magnets and free tools, marketing psychology, the idea bank, and launch planning. USE WHEN a user wants to plan, write, convert, or amplify marketing content but hasn't named the specific concern."
cluster: growth-content
version: 1.0.0
---

# Growth Content Orchestrator

The single entry skill for growth and content-marketing work. It locates the task on the
**funnel stage × asset type** map and delegates to one of 13 specialist spokes. The
cross-cutting decision every asset shares — *searchable vs. shareable*, the buyer stage it
targets, and the one source-of-truth positioning doc all spokes read first — lives in
`growth-content-core`; read it before planning a campaign or writing an asset cold.

## Cluster map (spoke → role)

**Foundation (read first)**
- `product-marketing-context` — establishes positioning, ICP, voice, proof. Writes `.agents/product-marketing-context.md`; every other spoke reads it. **Run this before anything else on a new project.**

**Plan (what to make)**
- `content-strategy` — pillars, topic clusters, keyword-by-buyer-stage, the editorial calendar
- `marketing-ideas` — the 139-idea bank when the user is stuck or wants channel inspiration
- `marketing-psychology` — mental models and behavioral principles that inform every other choice

**Write (the asset itself)**
- `content-research-writer` — long-form: blog posts, articles, newsletters, thought leadership, with research + citations
- `copywriting` — conversion copy for pages: homepage, landing, pricing, feature, about
- `copy-editing` — the seven-sweep polish pass on existing copy (run *after* a draft)

**Convert (turn attention into leads/replies)**
- `lead-magnets` — gated downloadables: checklists, templates, ebooks, swipe files
- `free-tool-strategy` — engineering-as-marketing: calculators, graders, generators
- `cold-email` — B2B outbound: prospecting emails + multi-touch follow-up sequences
- `email-sequence` — lifecycle/nurture flows: welcome, onboarding, re-engagement, drip
- `ad-creative` — paid ad copy at scale: headlines, descriptions, primary text, iteration from performance data

**Launch (ship it)**
- `launch-strategy` — Product Hunt, GTM, the ORB channel model, the five-phase rollout

## Routing rules by intent

| The user says… | Route to |
|---|---|
| "What should I write about?" / pillars / calendar | `content-strategy` |
| "I'm stuck, give me growth ideas" | `marketing-ideas` |
| "Why do people buy / persuasion / bias" | `marketing-psychology` |
| "Write a blog post / article / newsletter" | `content-research-writer` |
| "Write/rewrite my landing/homepage/pricing copy" | `copywriting` |
| "Edit / tighten / polish this copy" | `copy-editing` |
| "Lead magnet / freebie / gated PDF" | `lead-magnets` |
| "Build a free calculator/grader/tool for leads" | `free-tool-strategy` |
| "Cold outreach / prospecting / nobody replies" | `cold-email` |
| "Drip / nurture / welcome / onboarding emails" | `email-sequence` |
| "Ad copy / RSA headlines / Meta primary text" | `ad-creative` |
| "We're about to launch / Product Hunt / GTM" | `launch-strategy` |
| Positioning / ICP / "set up context" | `product-marketing-context` |

**Disambiguation:**
- New page text → `copywriting`; improving existing text → `copy-editing`; emails the page links to → `email-sequence`.
- Cold (no relationship) → `cold-email`; warm/lifecycle (already a contact) → `email-sequence`.
- Downloadable content (ebook, checklist) → `lead-magnets`; interactive software (calculator) → `free-tool-strategy`.
- "Marketing ideas" is the *starting point* when intent is vague; once a channel is chosen, hand to that channel's spoke.

## Standard Operating Flow

1. **Check the foundation.** If `.agents/product-marketing-context.md` doesn't exist, run `product-marketing-context` first (or note its absence). Every spoke writes better with it.
2. **Locate the task** on funnel stage (plan → write → convert → launch) and asset type.
3. **Pull the core decision** from `growth-content-core` — every asset must be *searchable, shareable, or both*, and aimed at one buyer stage. State which before producing.
4. **Delegate** to the spoke(s). Multi-step asks fan out in pipeline order — e.g. "launch our new feature" → `content-strategy` (angle) → `copywriting` (landing page) → `email-sequence` (onboarding) → `launch-strategy` (rollout).
5. **Return:** chosen spoke(s), the searchable/shareable call, the target buyer stage, and the next action.

## Guardrails

See `growth-content-core`. In short: **never invent proof** — fabricated stats, testimonials, or
customer logos erode trust and create legal exposure; pull from `product-marketing-context.md` or
ask. **One asset, one job, one CTA, one buyer stage** — don't make a page or email do everything.
**Customer language over company language** — mirror verbatim voice-of-customer, not buzzwords
("leverage," "synergy," "best-in-class" are banned). **Draft, then `copy-editing`** — don't ship
the first pass. Use urgency/scarcity only when genuine.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as
skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke named
above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md`
inside the skill-clusters repo).
