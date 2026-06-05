<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,27&height=180&text=raycast&fontSize=42&fontAlignY=38&desc=Route%20a%20Raycast%20task%20to%20the%20right%20spoke&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-4-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Separates the four distinct jobs people mean by "Raycast" — build an extension/command, build an AI extension (tools the Raycast AI calls), publish to the Store, or design a Raycast-aesthetic UI in your own app — and routes accordingly. The shared extension model (command types, the `package.json` manifest, `@raycast/api`, data, build/publish) lives in `raycast-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([raycast-orchestrator]):::hub --> c([raycast-core]):::hub
  o --> s1([raycast-extension])
  o --> s2([raycast-ai-extensions])
  o --> s3([raycast-store-publishing])
  o --> s4([raycast-ui-skills])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
| --- | --- | --- |
| `raycast-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `raycast-core` | 📐 hub · shared reference | ✅ enumerated |
| `raycast-extension` | spoke | ⤵ on-demand |
| `raycast-ai-extensions` | spoke | ⤵ on-demand |
| `raycast-store-publishing` | spoke | ⤵ on-demand |
| `raycast-ui-skills` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@raycast-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT) + mixed — `raycast-ui-skills` is community-sourced (MIT, from raycast.com). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
