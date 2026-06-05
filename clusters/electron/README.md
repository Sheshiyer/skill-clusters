<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,2,7&height=180&text=electron&fontSize=42&fontAlignY=38&desc=route%20an%20Electron%20desktop-app%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-4-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes any Electron desktop-app task (Chromium renderers + Node.js main) onto the process × concern map — IPC, the context-isolation security boundary, packaging/signing/notarization, auto-update, or native modules. Every rule turns on one fact: the renderer runs web content and is untrusted; the main process holds Node/OS power.

## Hub-and-spoke

```mermaid
graph LR
  o([electron-orchestrator]):::hub --> c([electron-core]):::hub
  o --> s1([electron-main-renderer-ipc])
  o --> s2([electron-security])
  o --> s3([electron-builder-packaging])
  o --> s4([electron-auto-update])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `electron-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `electron-core` | 📐 hub · shared reference | ✅ enumerated |
| `electron-main-renderer-ipc` | spoke | ⤵ on-demand |
| `electron-security` | spoke | ⤵ on-demand |
| `electron-builder-packaging` | spoke | ⤵ on-demand |
| `electron-auto-update` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@electron-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
