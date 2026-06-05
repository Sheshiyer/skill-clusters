<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8&height=180&text=mobile-flutter&fontSize=42&fontAlignY=38&desc=Route%20Flutter%20Dart%20Android%20KMP%20tasks&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-3-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for Flutter/Dart (and Android/KMP) work: it locates a task on the layer × phase map — UI / state / data / build, write → review — and delegates to the right specialist spoke. The cross-cutting decision every app turns on (which state-management solution, and the immutable-state contract it implies) plus shared conventions live in `mobile-flutter-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([mobile-flutter-orchestrator]):::hub --> c([mobile-flutter-core]):::hub
  o --> s1([dart-flutter-patterns])
  o --> s2([flutter-dart-code-review])
  o --> s3([android-clean-architecture])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `mobile-flutter-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `mobile-flutter-core` | 📐 hub · shared reference | ✅ enumerated |
| `dart-flutter-patterns` | spoke | ⤵ on-demand |
| `flutter-dart-code-review` | spoke | ⤵ on-demand |
| `android-clean-architecture` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate mobile-flutter --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@mobile-flutter-orchestrator -g -y
```

## Attribution

Spoke content wholly or substantially extracted from [ECC](https://github.com/affaan-m/ECC) (MIT). See [../../NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
