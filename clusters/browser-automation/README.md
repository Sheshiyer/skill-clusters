<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=Browser%20Automation&fontSize=48&fontAlignY=38&desc=Pick%20the%20surface%20%E2%86%92%20recon%20%E2%86%92%20act%20%E2%86%92%20prove%20it%20works&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-6-f59e0b?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-active-22c55e?style=flat)](../../README.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Drive any UI — web or native — behind a single router.**
Automating, scraping, screenshotting, or verifying a page or desktop app? The orchestrator places
your task on the **surface × session-model** map and routes; `browser-automation-core` holds the
shared model — the two surfaces, the session lifecycle, and the debug-first evidence rule.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

6 skills: `browser-automation-orchestrator` (router) + `browser-automation-core` (shared model) + 4
specialist drivers. The cluster's job is to make UI automation **navigable** — the orchestrator knows
whether your task lives on the **web/DOM** surface or the **native OS** surface, and which session
model fits, while the core keeps the interlocking conventions (recon-then-act, headless-by-default,
evidence-before-claims) consistent across every driver.

```mermaid
graph TD
    O["browser-automation-orchestrator<br/>(hub · surface × session-model router)"]
    O --> WEB["Web / DOM surface"]
    O --> NAT["Native macOS surface"]
    O --> HAR["Harness / supervision"]
    WEB --> B["browser<br/>(debug-first headless Chromium)"]
    WEB --> W["webapp-testing<br/>(Playwright · local dev server)"]
    NAT --> P["peekaboo<br/>(macOS UI capture & control)"]
    HAR --> T["tmux<br/>(interactive TTY · parallel sessions)"]
    B -. references .-> C["browser-automation-core<br/>(surface model · session lifecycle<br/>· recon-then-act · evidence rule)"]
    W -. references .-> C
    P -. references .-> C
    T -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by surface

| Surface | Spokes |
|---|---|
| **Router / model** | `browser-automation-orchestrator`, `browser-automation-core` |
| **Web / DOM (Chromium)** | `browser`, `webapp-testing` |
| **Native macOS UI** | `peekaboo` |
| **Harness / supervision** | `tmux` |

## The model that ties it together

Start with one question — **what surface are you driving?**

```
target ──→  web page in a browser   → DOM selectors / ARIA refs → browser · webapp-testing
            native macOS app's UI    → OS accessibility elements → peekaboo
```

Then pick a session model (one-shot · persistent · server-backed · supervised-TTY), **recon before
you act** (snapshot the live state, discover real selectors), and **never claim "it works"** without
a seen screenshot plus a clean console/network read. Full model in
[`browser-automation-core`](../../skills/browser-automation-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@browser-automation-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@browser -g -y                           # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
