<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,16,30&height=180&text=react-native&fontSize=42&fontAlignY=38&desc=Route%20a%20React%20Native%20craft%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-3-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a React Native UI and interaction craft task to the right spoke — styling/navigation/Reanimated animation, touch/gesture/haptics, full screen/app visual design, or integrated product-flow UI/UX audits — independent of how the app is built or shipped. The runtime model (New Architecture, Reanimated, navigation, performance) lives in `react-native-core`; toolchain/build/ship hands off to the expo cluster.

## Hub-and-spoke

```mermaid
graph LR
  o([react-native-orchestrator]):::hub --> c([react-native-core]):::hub
  o --> s1([react-native-design])
  o --> s2([mobile-touch])
  o --> s3([sleek-design-mobile-apps])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
| --- | --- | --- |
| `react-native-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `react-native-core` | 📐 hub · shared reference | ✅ enumerated |
| `react-native-design` | spoke | ⤵ on-demand |
| `mobile-touch` | spoke | ⤵ on-demand |
| `sleek-design-mobile-apps` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@react-native-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
