<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14&height=180&text=tauri&fontSize=42&fontAlignY=38&desc=route%20a%20Tauri%20task%20to%20the%20right%20specialist&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-40-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes any Tauri v2 desktop/mobile task across 40 specialists on the **lifecycle × concern** map — scaffolding, the capability/permission/scope security model, the IPC trust boundary and Rust↔frontend bridge, windows, sidecars, plugins, building, signing, and per-platform distribution. The interlocking model every Tauri app shares lives in `tauri-core`: read it before configuring permissions, wiring IPC, or planning a release.

## Hub-and-spoke

```mermaid
graph LR
  o([tauri-orchestrator]):::hub --> c([tauri-core]):::hub
  o --> s1([setting-up-tauri-projects])
  o --> s2([configuring-tauri-capabilities])
  o --> s3([configuring-tauri-permissions])
  o --> s4([configuring-tauri-scopes])
  o --> s5([understanding-tauri-ipc])
  o --> s6([calling-rust-from-tauri-frontend])
  o --> s7([embedding-tauri-sidecars])
  o --> s8([developing-tauri-plugins])
  o --> s9([signing-tauri-apps])
  o --> s10([distributing-tauri-for-macos])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 30 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `tauri-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `tauri-core` | 📐 hub · shared reference | ✅ enumerated |
| `adding-tauri-splashscreen` | spoke | ⤵ on-demand |
| `adding-tauri-system-tray` | spoke | ⤵ on-demand |
| `building-tauri-with-github-actions` | spoke | ⤵ on-demand |
| `calling-frontend-from-tauri-rust` | spoke | ⤵ on-demand |
| `calling-rust-from-tauri-frontend` | spoke | ⤵ on-demand |
| `configuring-tauri-apps` | spoke | ⤵ on-demand |
| `configuring-tauri-capabilities` | spoke | ⤵ on-demand |
| `configuring-tauri-csp` | spoke | ⤵ on-demand |
| `configuring-tauri-http-headers` | spoke | ⤵ on-demand |
| `configuring-tauri-permissions` | spoke | ⤵ on-demand |
| `configuring-tauri-scopes` | spoke | ⤵ on-demand |
| `customizing-tauri-windows` | spoke | ⤵ on-demand |
| `debugging-tauri-apps` | spoke | ⤵ on-demand |
| `developing-tauri-plugins` | spoke | ⤵ on-demand |
| `distributing-tauri-for-android` | spoke | ⤵ on-demand |
| `distributing-tauri-for-ios` | spoke | ⤵ on-demand |
| `distributing-tauri-for-macos` | spoke | ⤵ on-demand |
| `distributing-tauri-for-windows` | spoke | ⤵ on-demand |
| `embedding-tauri-sidecars` | spoke | ⤵ on-demand |
| `integrating-tauri-js-frontends` | spoke | ⤵ on-demand |
| `integrating-tauri-rust-frontends` | spoke | ⤵ on-demand |
| `listening-to-tauri-events` | spoke | ⤵ on-demand |
| `managing-tauri-app-resources` | spoke | ⤵ on-demand |
| `managing-tauri-plugin-permissions` | spoke | ⤵ on-demand |
| `migrating-tauri-apps` | spoke | ⤵ on-demand |
| `optimizing-tauri-binary-size` | spoke | ⤵ on-demand |
| `packaging-tauri-for-linux` | spoke | ⤵ on-demand |
| `running-nodejs-sidecar-in-tauri` | spoke | ⤵ on-demand |
| `setting-up-tauri-projects` | spoke | ⤵ on-demand |
| `signing-tauri-apps` | spoke | ⤵ on-demand |
| `tauri-v2` | spoke | ⤵ on-demand |
| `testing-tauri-apps` | spoke | ⤵ on-demand |
| `understanding-tauri-architecture` | spoke | ⤵ on-demand |
| `understanding-tauri-ecosystem-security` | spoke | ⤵ on-demand |
| `understanding-tauri-ipc` | spoke | ⤵ on-demand |
| `understanding-tauri-lifecycle-security` | spoke | ⤵ on-demand |
| `understanding-tauri-process-model` | spoke | ⤵ on-demand |
| `understanding-tauri-runtime-authority` | spoke | ⤵ on-demand |
| `updating-tauri-dependencies` | spoke | ⤵ on-demand |
| `using-crabnebula-cloud-with-tauri` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@tauri-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
