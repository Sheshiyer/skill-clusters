<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Frontend%20Web&fontSize=52&fontAlignY=38&desc=18%20specialists%2C%20one%20router%20%E2%80%94%20framework%20%C3%97%20concern&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-20-f59e0b?style=flat)](../../skills.sh.json)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16%2B-000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Vue](https://img.shields.io/badge/Vue-3%2FNuxt%204-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**18 frontend-web specialists behind a single router.**
Building, reviewing, or shipping a web UI? The orchestrator places your task on the
**framework × concern** map and routes; `frontend-web-core` holds the rendering model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

20 skills: `frontend-web-orchestrator` (router) + `frontend-web-core` (shared model) + 18
specialists. The cluster's job is to make a broad frontend skill set *navigable* — the
orchestrator knows which framework spoke to reach for, and the core keeps the interlocking
concepts (the rendering model, the SSR/`"use client"` boundary, motion layering, the a11y
baseline) consistent across React, Vue/Nuxt, and Angular.

```mermaid
graph TD
    O["frontend-web-orchestrator<br/>(hub · framework × concern router)"]
    O --> FW["Framework core<br/>(react · nuxt · angular · ui-to-vue)"]
    O --> BUILD["Build & runtime<br/>(vite · turbopack · bun)"]
    O --> MOTION["Motion<br/>(foundations → patterns → advanced)"]
    O --> LOOK["Look & feel<br/>(a11y · design-system · polish · slides)"]
    FW -. references .-> C["frontend-web-core<br/>(rendering model · SSR boundary<br/>· motion layering · a11y baseline)"]
    BUILD -. references .-> C
    MOTION -. references .-> C
    LOOK -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `frontend-web-orchestrator`, `frontend-web-core` |
| **Framework core** | `react-patterns`, `react-performance`, `react-testing`, `nextjs-turbopack`, `nuxt4-patterns`, `angular-developer`, `ui-to-vue` |
| **Build & runtime** | `vite-patterns`, `bun-runtime` |
| **Motion** | `motion-foundations`, `motion-patterns`, `motion-advanced` |
| **Look & feel** | `accessibility`, `frontend-a11y`, `design-system`, `make-interfaces-feel-better`, `frontend-design-direction`, `frontend-slides` |

## The model that ties it together

Decide the **rendering model** first — it fixes the hydration boundary every spoke must respect:

```
Static (SSG) ──► SSR ──► RSC ──► CSR
  most cacheable  ◄──── most interactive ────►
```

Mark stateful and motion code `"use client"`, match server/client initial markup, layer motion
on `motion-foundations`, and keep accessibility (WCAG 2.2 AA + semantic React) as a baseline, not
a follow-up. Full model in
[`frontend-web-core`](../../skills/frontend-web-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@frontend-web-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@react-patterns -g -y                # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
