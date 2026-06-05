<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14&height=180&text=astro&fontSize=42&fontAlignY=38&desc=Route%20an%20Astro%20task%20to%20the%20right%20spoke&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-2-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Entry point for **Astro** site work — the framework itself, not the animation layer. The orchestrator picks the rendering strategy (static vs on-demand SSR vs hybrid + server islands) and routes to the right spoke, while `astro-core` holds the shared rendering-mode decision, hydration directives, Content Layer model, `astro:env`/sessions/actions conventions, and SSR adapter selection.

## Hub-and-spoke

```mermaid
graph LR
  o([astro-orchestrator]):::hub --> c([astro-core]):::hub
  o --> s1([astro-framework])
  o --> s2([astro-wiki-publisher])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `astro-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `astro-core` | 📐 hub · shared reference | ✅ enumerated |
| `astro-framework` | spoke | ⤵ on-demand |
| `astro-wiki-publisher` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@astro-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). + mixed — `astro-framework` is a community Astro skill (author: delineas) vendored under MIT. See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
