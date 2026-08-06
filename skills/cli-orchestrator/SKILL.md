---
name: cli-orchestrator
description: "Route a task to the right Thoughtseed-internal command-line tool. Covers the operator utilities Thoughtseed builds and maintains itself — Instagram operations via gram-cli, Reddit read/publish via reddit-cli. USE WHEN a task needs one of Thoughtseed's own CLI tools, when asking which internal tool covers a job, or when deciding whether an internal CLI already exists before building something new."
cluster: cli
version: 1.0.0
---

# CLI Orchestrator

The entry skill for **Thoughtseed's own command-line tooling**. This cluster is a *tool-type*
grouping, not a domain one: what its members share is that Thoughtseed wrote and maintains
them, and that they are driven from a terminal. Their subject matter differs.

The shared conventions every member follows — auth and credential handling, dry-run before
mutation, explicit confirmation on anything that publishes — live in `cli-core`. Read it
before running any member that writes.

## Routing map (intent → tool)

- Read, download, or audit Instagram content; verify gram/glam auth; collect publication
  assets → `gram-cli`
- Read subreddit / user / thread content; monitor inbox and mentions; publish posts or
  comments → `reddit-cli`

## Boundary

These tools are **operator utilities**, catalogued in the work-object registry as
`program:operator-utilities` (`programKind: capability`). They exist to operate Thoughtseed —
they are not products, not client deliverables, and not saplings. If a task looks like
product work, it belongs to a Sapling; if it is delivery for an external account, it belongs
to a client Branch. Do not promote a utility into either by using it heavily.

## Before adding a member

An internal CLI joins this cluster when Thoughtseed owns the source and the tool is driven
from a terminal. Two checks first:

1. Does an existing member already cover the job? Extending beats adding.
2. Has a skill superseded it? Some CLIs become redundant once a skill wraps the same
   capability more directly. Record that rather than keeping both silently.

A member that is superseded stays catalogued with the superseding skill named, so the
history of *why* it stopped being used survives.

## Related

- `program:operator-utilities` in `work-object-registry.v1.json` — the portfolio record
- Cambium organ `hands` — the organ this capability reports into
