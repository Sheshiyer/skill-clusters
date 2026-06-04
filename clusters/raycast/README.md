<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=27,29,12&height=220&text=Raycast&fontSize=54&fontAlignY=38&desc=Extensions%2C%20AI%20tools%2C%20Store%20publishing%20%E2%80%94%20one%20router&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-6-ff6363?style=flat)](../../skills.sh.json)
[![Raycast](https://img.shields.io/badge/Raycast-extensions-FF6363?style=flat&logo=raycast&logoColor=white)](https://developers.raycast.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for Raycast.**
The orchestrator separates the four jobs people mean by "Raycast" — build an extension, make it
AI-callable, publish to the Store, or design a Raycast-looking app — and routes. `raycast-core`
holds the extension model. *(2 authored spokes fill the AI + publishing gaps.)*

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=27,29,12&height=2" width="100%" />

## What it is

`raycast-orchestrator` + `raycast-core` + 4 spokes. The two existing skills were thin (and one,
`raycast-ui-skills`, is actually about *mimicking* Raycast's look — not building extensions), so
this cluster adds a real model plus **authored** `raycast-ai-extensions` and
`raycast-store-publishing` spokes.

```mermaid
graph TD
    O["raycast-orchestrator<br/>(hub · job router)"]
    O --> E["raycast-extension<br/>(build commands)"]
    O --> AI["raycast-ai-extensions<br/>(tools[] for Raycast AI) ✦authored"]
    O --> PUB["raycast-store-publishing<br/>(submit + review) ✦authored"]
    O --> UI["raycast-ui-skills<br/>(Raycast-look UI · aesthetic only)"]
    E -. references .-> C["raycast-core<br/>(command types · manifest · @raycast/api<br/>· data hooks · build/publish)"]
    AI -. references .-> C
    PUB -. references .-> C

    style O fill:#b91c1c,color:#fff
    style C fill:#276749,color:#fff
    style AI fill:#7c2d12,color:#fff
    style PUB fill:#7c2d12,color:#fff
```

## Skills

| Skill | Role | |
|---|---|---|
| `raycast-orchestrator` | Router — job → spoke | |
| `raycast-core` | Command types, manifest, `@raycast/api`, data hooks, build/publish | |
| `raycast-extension` | Build extensions/commands (React + TS) | |
| `raycast-ai-extensions` | `tools[]` the Raycast AI can call | ✦ authored |
| `raycast-store-publishing` | Package + submit + pass review | ✦ authored |
| `raycast-ui-skills` | Raycast aesthetic for your *own* app | |

## Two jobs people conflate

- **Build an extension** that runs *inside* Raycast → `raycast-extension` + `raycast-core`.
- **Design your app** to *look like* Raycast (light mode, Inter, 4px grid) → `raycast-ui-skills`.

Full extension model in [`raycast-core`](../../skills/raycast-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@raycast-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
