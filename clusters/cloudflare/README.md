<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Cloudflare&fontSize=52&fontAlignY=38&desc=9%20edge%20specialists%2C%20one%20router%20%E2%80%94%20compute%20%E2%86%92%20bind%20%E2%86%92%20store%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-11-f59e0b?style=flat)](../../skills.sh.json)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**The edge cluster — 9 Cloudflare specialists behind a single router.**
Building, configuring, or shipping on Cloudflare's edge? The orchestrator places your task on the
**compute × primitive** map and routes; `cloudflare-core` holds the binding + config model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

11 skills: `cloudflare-orchestrator` (router) + `cloudflare-core` (shared model) + 9 existing
specialists. The cluster's job is to make a broad, fast-moving platform *navigable* — the
orchestrator knows which spoke to reach for, and the core keeps the interlocking concepts
(Workers/Pages compute, bindings, `compatibility_date`, the KV/R2/D1/DO storage choice) consistent.

```mermaid
graph TD
    O["cloudflare-orchestrator<br/>(hub · compute × primitive router)"]
    O --> DEP["Deploy &<br/>operate"]
    O --> CLI["wrangler CLI<br/>& config"]
    O --> CODE["Write & review<br/>Worker code"]
    O --> STATE["Stateful<br/>(Durable Objects)"]
    O --> SDK["AI agents &<br/>sandboxes"]
    O --> EDGE["Email &<br/>R2 artifacts"]
    CLI -. references .-> C["cloudflare-core<br/>(Worker + bindings · wrangler.jsonc<br/>· compatibility_date · KV/R2/D1/DO matrix)"]
    STATE -. references .-> C
    SDK -. references .-> C

    style O fill:#c2410c,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `cloudflare-orchestrator`, `cloudflare-core` |
| **Deploy & operate** | `cloudflare`, `cloudflare-manager` |
| **CLI & config** | `wrangler` |
| **Write & review code** | `workers-best-practices` |
| **Stateful coordination** | `durable-objects` |
| **AI agents & sandboxes** | `agents-sdk`, `sandbox-sdk` |
| **Email & R2 artifacts** | `cloudflare-email-service`, `r2-notebooklm-artifact-portal` |

## The model that ties it together

Everything is **compute at the edge reaching primitives only through bindings**:

```
Request ──> Worker / Pages Function ──binding──> KV · R2 · D1 · Durable Object · Queue · AI · send_email
                                       (declared in wrangler.jsonc, pinned by compatibility_date)
```

Declare every dependency as a binding; pick the right primitive (KV = read-heavy cache,
R2 = objects, D1 = relational, Durable Object = strongly-consistent per-entity state); pin
`compatibility_date` and `wrangler types` after changes. Full model in
[`cloudflare-core`](../../skills/cloudflare-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@cloudflare-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@durable-objects -g -y           # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
