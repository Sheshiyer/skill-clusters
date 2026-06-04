<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=4,8,12&height=220&text=Electron&fontSize=52&fontAlignY=38&desc=Desktop%20apps%20%E2%80%94%20process%20model%2C%20security%2C%20packaging%2C%20updates&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-6-47848F?style=flat)](../../skills.sh.json)
[![Electron](https://img.shields.io/badge/Electron-Chromium%2BNode-47848F?style=flat&logo=electron&logoColor=white)](https://electronjs.org)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for Electron desktop apps (Chromium + Node.js).**
The orchestrator routes by process × concern; `electron-core` holds the one decision everything
turns on — the **main/renderer split and the context-isolation security boundary**. For a
smaller Rust/web alternative, see the **[tauri](../tauri)** cluster.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=4,8,12&height=2" width="100%" />

## What it is

Authored from scratch (ECC shipped no Electron suite) to the same house pattern. Six skills
around one router. Because an Electron app ships a full browser + Node to end users, the
**security checklist is non-optional** — it's the spine of the cluster.

```mermaid
graph TD
    O["electron-orchestrator<br/>(hub · process × concern)"]
    O --> IPC["electron-main-renderer-ipc<br/>(contextBridge · invoke/handle)"]
    O --> SEC["electron-security<br/>(isolation · sandbox · CSP)"]
    O --> PKG["electron-builder-packaging<br/>(installers · sign · notarize)"]
    O --> UPD["electron-auto-update<br/>(signed feeds · rollout)"]
    IPC -. references .-> C["electron-core<br/>(main/renderer/preload<br/>· security boundary · ABI)"]
    SEC -. references .-> C
    PKG -. references .-> C
    UPD -. references .-> C
    O -. "smaller alternative" .-> TAURI["tauri cluster →"]

    style O fill:#0f766e,color:#fff
    style C fill:#276749,color:#fff
    style TAURI fill:#b45309,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `electron-orchestrator` | Router — process/concern → spoke |
| `electron-core` | Main/renderer/preload model, security boundary, ABI, Electron-vs-Tauri |
| `electron-main-renderer-ipc` | Safe IPC via preload `contextBridge` |
| `electron-security` | The hardening checklist |
| `electron-builder-packaging` | Installers, signing, notarization |
| `electron-auto-update` | Signed update feeds, staged rollout |

## The decision everything turns on

The **renderer is untrusted**; the **main process holds Node/OS power**. Every window:
`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — expose only a minimal typed
`contextBridge` API. Full model in [`electron-core`](../../skills/electron-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@electron-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
