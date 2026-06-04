<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Native%20iOS&fontSize=52&fontAlignY=38&desc=7%20Swift%20specialists%2C%20one%20router%20%E2%80%94%20concurrency%20%E2%86%92%20architecture%20%E2%86%92%20AI%20%E2%86%92%20design&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-9-f59e0b?style=flat)](../../skills.sh.json)
[![Swift](https://img.shields.io/badge/Swift-6.2-F05138?style=flat&logo=swift&logoColor=white)](https://swift.org)
[![iOS](https://img.shields.io/badge/iOS-26-000000?style=flat&logo=apple&logoColor=white)](https://developer.apple.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Native Apple-platform development behind a single router.**
Building, modernizing, or shipping a Swift / SwiftUI app? The orchestrator places your task on the
**layer × concern** map and routes; `native-ios-core` holds the iOS 26 / Swift 6.2 baseline they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

9 skills: `native-ios-orchestrator` (router) + `native-ios-core` (shared model) + 7 Swift
specialists. The cluster's job is to make the new Apple stack *navigable* — the orchestrator knows
which spoke to reach for, and the core keeps the interlocking facts (the iOS 26 / Swift 6.2 / Xcode
26 baseline, availability gating, and the actor-isolation data-race model) consistent so no spoke
contradicts another.

```mermaid
graph TD
    O["native-ios-orchestrator<br/>(hub · layer × concern router)"]
    O --> LANG["swift-concurrency-6-2<br/>(language model)"]
    O --> UI["swiftui-patterns<br/>(UI architecture)"]
    O --> STORE["swift-actor-persistence<br/>(storage)"]
    O --> TEST["swift-protocol-di-testing<br/>(testability seam)"]
    O --> AI["foundation-models-on-device<br/>(on-device AI)"]
    O --> GLASS["liquid-glass-design<br/>(design system)"]
    O --> ICON["ios-icon-gen<br/>(asset pipeline)"]
    LANG -. references .-> C["native-ios-core<br/>(iOS 26 / Swift 6.2 baseline<br/>· availability gating · data-race safety)"]
    UI -. references .-> C
    STORE -. references .-> C
    TEST -. references .-> C
    AI -. references .-> C
    GLASS -. references .-> C
    ICON -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `native-ios-orchestrator`, `native-ios-core` |
| **Language & concurrency** | `swift-concurrency-6-2` |
| **UI architecture** | `swiftui-patterns` |
| **Storage** | `swift-actor-persistence` |
| **Testability** | `swift-protocol-di-testing` |
| **On-device AI** | `foundation-models-on-device` |
| **Design system** | `liquid-glass-design` |
| **Assets** | `ios-icon-gen` |

## The model that ties it together

Everything targets **one toolchain line**:

```
Xcode 26 ──compiles──> Swift 6.2 ──targets──> iOS 26 / macOS 26 (with graceful fallback)
```

The flagship frameworks (Approachable Concurrency, Liquid Glass, on-device FoundationModels) only
exist on this line — so the first question is always *"what's the deployment target, and is this API
available there?"* Gate every iOS 26-only API (`if #available`, `SystemLanguageModel.availability`)
with a real fallback; keep concurrency isolated-by-default. Full model in
[`native-ios-core`](../../skills/native-ios-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@native-ios-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@liquid-glass-design -g -y          # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
