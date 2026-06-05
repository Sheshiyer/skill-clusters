<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,27&height=180&text=browser-automation&fontSize=42&fontAlignY=38&desc=route%20a%20browser%2FUI%20automation%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-4-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a browser / UI automation task to the right driver by placing it on a **surface × session-model** map — the web/DOM layer vs the native macOS UI layer, one-shot vs persistent vs supervised-TTY. Spokes cover debug-first headless Chromium, local-webapp Playwright testing, native macOS UI capture and control, and an interactive-TTY harness that supervises them.

## Hub-and-spoke

```mermaid
graph LR
  o([browser-automation-orchestrator]):::hub --> c([browser-automation-core]):::hub
  o --> s1([browser])
  o --> s2([webapp-testing])
  o --> s3([peekaboo])
  o --> s4([tmux])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `browser-automation-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `browser-automation-core` | 📐 hub · shared reference | ✅ enumerated |
| `browser` | spoke | ⤵ on-demand |
| `webapp-testing` | spoke | ⤵ on-demand |
| `peekaboo` | spoke | ⤵ on-demand |
| `tmux` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@browser-automation-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
