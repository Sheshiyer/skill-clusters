---
name: seo-content-brief
description: Use when you need a structured search-intent brief from a topic, query cluster, offer, or URL — turning search demand into a brief downstream content and distribution agents can act on. USE WHEN the user asks for a content brief, search-intent brief, editorial plan, or packet-oriented content plan before writing.
metadata:
  version: 1.0.0
  mirrors: inference-sh/agent-skills@seo-content-brief
cluster: growth-seo
version: 1.0.0
---

# SEO Content Brief

Use this skill to turn search demand into a brief that downstream content and distribution agents can actually use.

## Upstream Inputs

- `searchintentautomation` — keyword + question maps that seed the brief
- `seo-audit` — gaps and opportunities from an existing site
- web search / SERP evidence

## Required Sections

1. Core query or topic
2. Search intent
3. Target audience and stage
4. Question cluster
5. Opportunity angle
6. Competitive observations
7. Source/evidence links
8. Recommended format
9. Recommended downstream lane:
   - blog
   - X-first repurpose
   - manual Reddit/Substack expansion

## Output Location

Write each brief into your content pipeline's intake folder, e.g.:

`<content-engine>/_processing/content-briefs/<slug>.md`

When the source is already a published post and the goal is distribution, hand the
slug to your distribution-packet step (the brief feeds, but does not perform, publishing).

## Guardrails

- This skill shapes briefs; it does not publish.
- Use current evidence, not stale assumptions about ranking or audience demand.
- Keep the brief compatible with downstream Content Engine and packet workflows.
