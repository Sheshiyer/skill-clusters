<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=Tauri&fontSize=56&fontAlignY=38&desc=40%20specialists%2C%20one%20router%20%E2%80%94%20scaffold%20%E2%86%92%20secure%20%E2%86%92%20bridge%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-42-f59e0b?style=flat)](../../skills.sh.json)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?style=flat&logo=tauri&logoColor=white)](https://tauri.app)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**The flagship cluster — 40 Tauri v2 specialists behind a single router.**
Building, securing, bridging, or shipping a Tauri app? The orchestrator places your task on
the **lifecycle × concern** map and routes; `tauri-core` holds the security model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

42 skills: `tauri-orchestrator` (router) + `tauri-core` (shared model) + 40 existing
specialists. The cluster's job is to make a huge, deep skill set *navigable* — the
orchestrator knows which of the 40 to reach for, and the core keeps the interlocking
security concepts (capabilities → permissions → scopes, IPC, CSP, process model) consistent.

```mermaid
graph TD
    O["tauri-orchestrator<br/>(hub · lifecycle × concern router)"]
    O --> S["Scaffold &<br/>understand"]
    O --> CFG["Configure<br/>(+ security surface)"]
    O --> IPC["IPC & Rust↔JS<br/>bridge"]
    O --> EXT["Extend<br/>(sidecars · plugins)"]
    O --> SHIP["Build · sign ·<br/>distribute"]
    O --> OPS["Debug · test ·<br/>migrate"]
    CFG -. references .-> C["tauri-core<br/>(capabilities → permissions → scopes<br/>· IPC boundary · CSP · process model)"]
    IPC -. references .-> C
    SHIP -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `tauri-orchestrator`, `tauri-core` |
| **Scaffold & understand** | `setting-up-tauri-projects`, `tauri-v2`, `understanding-tauri-architecture`, `understanding-tauri-process-model`, `understanding-tauri-runtime-authority`, `understanding-tauri-lifecycle-security`, `understanding-tauri-ecosystem-security` |
| **Configure** | `configuring-tauri-apps`, `configuring-tauri-capabilities`, `configuring-tauri-permissions`, `configuring-tauri-scopes`, `configuring-tauri-csp`, `configuring-tauri-http-headers`, `customizing-tauri-windows`, `adding-tauri-splashscreen`, `adding-tauri-system-tray`, `managing-tauri-app-resources` |
| **IPC & bridge** | `understanding-tauri-ipc`, `calling-rust-from-tauri-frontend`, `calling-frontend-from-tauri-rust`, `listening-to-tauri-events`, `integrating-tauri-js-frontends`, `integrating-tauri-rust-frontends` |
| **Extend** | `embedding-tauri-sidecars`, `running-nodejs-sidecar-in-tauri`, `developing-tauri-plugins`, `managing-tauri-plugin-permissions` |
| **Build · sign · ship** | `optimizing-tauri-binary-size`, `building-tauri-with-github-actions`, `signing-tauri-apps`, `distributing-tauri-for-macos`, `distributing-tauri-for-windows`, `packaging-tauri-for-linux`, `distributing-tauri-for-ios`, `distributing-tauri-for-android`, `using-crabnebula-cloud-with-tauri` |
| **Operate** | `debugging-tauri-apps`, `testing-tauri-apps`, `updating-tauri-dependencies`, `migrating-tauri-apps` |

## The model that ties it together

Access is **default-deny**:

```
Window ──has──> Capability ──includes──> Permission(s) ──constrained by──> Scope(s)
```

Grant the narrowest capability that works; the frontend is untrusted, Rust is the trusted core,
and everything crosses one IPC boundary. Full model in
[`tauri-core`](../../skills/tauri-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@tauri-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@distributing-tauri-for-macos -g -y  # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
