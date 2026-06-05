---
name: competitor-teardown
description: Use when you need a structured comparison of adjacent products, creators, accounts, brands, or messaging ecosystems. USE WHEN the user wants a competitor teardown, market scan, or research-driven breakdown of how a rival positions, messages, and behaves across channels.
metadata:
  version: 1.0.0
cluster: growth-sales-cro
version: 1.0.0
---

# Competitor Teardown

Use this skill to turn market scanning into a structured teardown instead of ad hoc notes.

## Related Skills and Inputs

- `competitor-alternatives` — direct alternative / comparison pages
- `content-strategy` — turning findings into a content angle
- web search / social reading tools — current evidence

## Output Shape

Every teardown should cover:

1. Target and category
2. Audience and positioning
3. Messaging hooks
4. Format/channel behavior
5. Strengths
6. Weaknesses or blind spots
7. Opportunity for your product
8. Evidence links

## Workflow

1. Use web search or social reading tools to gather current evidence.
2. Use `competitor-alternatives` when the teardown overlaps with direct alternative/comparison framing.
3. Normalize findings into the output shape above.
4. If the teardown changes strategy, routing, or packaging decisions, hand the actionable finding off to your task/issue tracker with a clear title (`COMPETITOR_TEARDOWN: <target>`), a summary of the evidence, and a recommended response.

## Guardrails

- This skill is for analysis, not attack content.
- Do not fabricate feature comparisons or messaging claims.
- Cite current evidence for any conclusion that could affect strategy or publishing.
