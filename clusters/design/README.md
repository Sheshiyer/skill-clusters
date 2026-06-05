<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&text=design&fontSize=42&fontAlignY=38&desc=route%20a%20UI%20or%20visual-design%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-9-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry point for design work: it locates a task on the **intent × deliverable** map — product UI, spec, themed artifact, static art, or brand data — and delegates to one of 9 specialist spokes. The cross-cutting model every design shares — **research and constraints before generation**, the decision ledger, and the anti-AI-slop quality gate — lives in `design-core` and is read before any pixels are generated.

## Hub-and-spoke

```mermaid
graph LR
  o([design-orchestrator]):::hub --> c([design-core]):::hub
  o --> s1([refero-design])
  o --> s2([ui-ux-pro-max])
  o --> s3([swiss-design])
  o --> s4([taste-skill])
  o --> s5([stitch-design-taste])
  o --> s6([superdesign])
  o --> s7([theme-factory])
  o --> s8([canvas-design])
  o --> s9([openbrand])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `design-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `design-core` | 📐 hub · shared reference | ✅ enumerated |
| `refero-design` | spoke | ⤵ on-demand |
| `ui-ux-pro-max` | spoke | ⤵ on-demand |
| `swiss-design` | spoke | ⤵ on-demand |
| `taste-skill` | spoke | ⤵ on-demand |
| `stitch-design-taste` | spoke | ⤵ on-demand |
| `superdesign` | spoke | ⤵ on-demand |
| `theme-factory` | spoke | ⤵ on-demand |
| `canvas-design` | spoke | ⤵ on-demand |
| `openbrand` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@design-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT) — the clustering, the orchestrator, and the core are original to this repo. + mixed: several spokes carry their own upstream authorship (e.g. `refero-design` → referodesign, `swiss-design` → zeke, `superdesign`), preserved in each skill's frontmatter and body. See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
