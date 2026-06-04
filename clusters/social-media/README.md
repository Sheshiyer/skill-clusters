<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Social%20Media&fontSize=52&fontAlignY=38&desc=8%20specialists%2C%20one%20router%20%E2%80%94%20create%20%E2%86%92%20adapt%20%E2%86%92%20publish&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-10-f59e0b?style=flat)](../../skills.sh.json)
[![Platforms](https://img.shields.io/badge/platforms-13-1DA1F2?style=flat)](../../skills/social-publisher/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Create the asset, adapt the copy, publish to the right network — behind a single router.**
Making content or shipping it across X and 12 more platforms? The orchestrator places your task
on the **create → adapt → publish** pipeline and routes; `social-media-core` holds the
adapt-don't-duplicate model and draft-before-post contract they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

10 skills: `social-media-orchestrator` (router) + `social-media-core` (shared model) + 8
specialists. The cluster's job is to take a vague "make and post this" and make it *navigable* —
the orchestrator knows which maker, adapter, and publisher to reach for, and the core keeps the
interlocking conventions (adapt-per-platform, draft-before-post, voice reuse, the platform ×
format matrix) consistent so no spoke broadcasts identical copy or posts unreviewed.

```mermaid
graph TD
    O["social-media-orchestrator<br/>(hub · create × adapt × publish router)"]
    O --> CR["Create the asset<br/>(media · explainer · edit · demo)"]
    O --> AD["Adapt the copy<br/>(per platform)"]
    O --> PUB["Publish &<br/>schedule"]
    CR --> M1["fal-ai-media"]
    CR --> M2["manim-video"]
    CR --> M3["video-editing"]
    CR --> M4["ui-demo"]
    CR --> M5["videodb"]
    AD --> A1["crosspost"]
    PUB --> P1["x-api"]
    PUB --> P2["social-publisher"]
    AD -. references .-> C["social-media-core<br/>(adapt ≠ duplicate · draft-before-post<br/>· voice reuse · platform × format matrix)"]
    PUB -. references .-> C
    CR -. references .-> C

    style O fill:#0e7490,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by stage

| Stage | Spokes |
|---|---|
| **Router / model** | `social-media-orchestrator`, `social-media-core` |
| **Create the asset** | `fal-ai-media` (image/video/audio gen), `manim-video` (technical explainers), `video-editing` (cut & structure real footage), `ui-demo` (record product demos), `videodb` (see/understand/clip existing media) |
| **Adapt the copy** | `crosspost` (one idea → native per-platform variants) |
| **Publish & schedule** | `x-api` (direct X/Twitter API), `social-publisher` (13 networks via SocialClaw) |

## The model that ties it together

**Adapt, don't duplicate** — one idea becomes one native version per network:

```
Idea ──> Primary version ──adapt──> per-platform variants   (then: draft → approve → publish)
```

Each variant reads like the same author under a different constraint; publishing is
approval-gated unless the user says "post now"; voice is captured once and reused. Full model in
[`social-media-core`](../../skills/social-media-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@social-media-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@social-publisher -g -y              # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
