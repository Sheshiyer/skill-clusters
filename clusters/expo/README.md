<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,27&height=180&text=expo&fontSize=42&fontAlignY=38&desc=Route%20Expo%20tasks%20across%20the%20app%20lifecycle&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-9-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes an Expo task to the right spoke across the app lifecycle — dev environment (dev client, NativeWind), Expo Router app-building, in-app API routes, native modules, EAS build/submit/update, and SDK upgrades. The shared platform model — EAS, app config + config plugins, the Expo Go vs dev-client vs prebuild/CNG spectrum, and SDK version policy — lives in `expo-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([expo-orchestrator]):::hub --> c([expo-core]):::hub
  o --> s1([expo-dev-client])
  o --> s2([expo-tailwind-setup])
  o --> s3([building-native-ui])
  o --> s4([expo-api-routes])
  o --> s5([expo-module])
  o --> s6([expo-cicd-workflows])
  o --> s7([expo-deployment])
  o --> s8([upgrading-expo])
  o --> s9([native-data-fetching])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `expo-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `expo-core` | 📐 hub · shared reference | ✅ enumerated |
| `expo-dev-client` | spoke | ⤵ on-demand |
| `expo-tailwind-setup` | spoke | ⤵ on-demand |
| `building-native-ui` | spoke | ⤵ on-demand |
| `expo-api-routes` | spoke | ⤵ on-demand |
| `expo-module` | spoke | ⤵ on-demand |
| `expo-cicd-workflows` | spoke | ⤵ on-demand |
| `expo-deployment` | spoke | ⤵ on-demand |
| `upgrading-expo` | spoke | ⤵ on-demand |
| `native-data-fetching` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@expo-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
