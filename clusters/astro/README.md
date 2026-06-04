<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=18,26,30&height=220&text=Astro&fontSize=56&fontAlignY=38&desc=Static-first%20sites%20%E2%80%94%20islands%2C%20content%2C%20SSR%2C%20publishing&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-4-ff5d01?style=flat)](../../skills.sh.json)
[![Astro](https://img.shields.io/badge/Astro-islands-BC52EE?style=flat&logo=astro&logoColor=white)](https://astro.build)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for Astro — the framework, not the animation layer.**
The orchestrator picks the rendering strategy and routes; `astro-core` holds the static/SSR/hybrid
decision, content model, and hydration rules. For motion on an Astro page, see **[creative-frontend](../creative-frontend)**.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=18,26,30&height=2" width="100%" />

## What it is

`astro-orchestrator` + `astro-core` + the deep `astro-framework` (shared with creative-frontend)
+ `astro-wiki-publisher`. The cluster's value is the **rendering-mode decision** and content
strategy up front, then delegating implementation to the comprehensive framework skill.

```mermaid
graph TD
    O["astro-orchestrator<br/>(hub · mode + route)"]
    O --> F["astro-framework<br/>(components · islands · content · SSR · actions)"]
    O --> P["astro-wiki-publisher<br/>(docs / wiki / press-kit)"]
    O -. "animation / video" .-> CF["creative-frontend cluster →"]
    F -. references .-> C["astro-core<br/>(static/SSR/hybrid · server islands<br/>· Content Layer · astro:env · actions)"]
    P -. references .-> C

    style O fill:#c2410c,color:#fff
    style C fill:#276749,color:#fff
    style CF fill:#5b21b6,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `astro-orchestrator` | Router — rendering mode → spoke |
| `astro-core` | Static/SSR/hybrid decision, Content Layer, hydration, `astro:env`/actions, adapters |
| `astro-framework` | *(shared)* deep implementation: islands, content, SSR, actions, i18n, view transitions |
| `astro-wiki-publisher` | Publish/harden docs/wiki/press-kit sites |

## The decision that routes everything

| Content | Mode |
|---|---|
| Known at build time | **Static (SSG)** — default |
| Per-request (auth, personalization) | **On-demand SSR** (`prerender = false`) |
| Static page, a few dynamic fragments | **Server islands** (`server:defer`) |

Ship static by default; full model in [`astro-core`](../../skills/astro-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@astro-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
