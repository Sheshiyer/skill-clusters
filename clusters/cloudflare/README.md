<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,16,30&height=180&text=cloudflare&fontSize=42&fontAlignY=38&desc=route%20a%20Cloudflare%20edge%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-9-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry point for Cloudflare edge work: it locates a task on the **compute × primitive** map — Workers/Pages compute, the wrangler CLI and binding/config model, storage (KV, R2, D1), Durable Objects, the Agents and Sandbox SDKs, transactional email, and deploy/auth debugging — and delegates to the right specialist spoke. The cross-cutting model every Cloudflare app shares — compute reaching primitives **only through bindings** declared in `wrangler.jsonc` under a pinned `compatibility_date` — lives in `cloudflare-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([cloudflare-orchestrator]):::hub --> c([cloudflare-core]):::hub
  o --> s1([cloudflare])
  o --> s2([wrangler])
  o --> s3([workers-best-practices])
  o --> s4([durable-objects])
  o --> s5([agents-sdk])
  o --> s6([sandbox-sdk])
  o --> s7([cloudflare-email-service])
  o --> s8([cloudflare-manager])
  o --> s9([r2-notebooklm-artifact-portal])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `cloudflare-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `cloudflare-core` | 📐 hub · shared reference | ✅ enumerated |
| `cloudflare` | spoke | ⤵ on-demand |
| `wrangler` | spoke | ⤵ on-demand |
| `workers-best-practices` | spoke | ⤵ on-demand |
| `durable-objects` | spoke | ⤵ on-demand |
| `agents-sdk` | spoke | ⤵ on-demand |
| `sandbox-sdk` | spoke | ⤵ on-demand |
| `cloudflare-email-service` | spoke | ⤵ on-demand |
| `cloudflare-manager` | spoke | ⤵ on-demand |
| `r2-notebooklm-artifact-portal` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@cloudflare-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT), curated from the community library against Cloudflare's official docs. See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
