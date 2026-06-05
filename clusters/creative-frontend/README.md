<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=10,18,22&height=180&text=creative-frontend&fontSize=42&fontAlignY=38&desc=in-browser%20animation%20or%20rendered%20video&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-8-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry point for animated / motion / video frontend work. It answers the one question that determines everything downstream — **live interactive effect, or rendered video file?** — then routes to the right spoke: in-browser animation (GSAP ScrollTrigger, Anime.js, web-motion-library) over an Astro substrate, or render-time programmatic video (Remotion). Shared rules — decision matrix, reduced-motion baseline, GPU/performance budget, Astro hydration boundaries — live in `creative-frontend-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([creative-frontend-orchestrator]):::hub --> c([creative-frontend-core]):::hub
  o --> s1([astro-gsap-scrolltrigger])
  o --> s2([animejs])
  o --> s3([web-motion-library])
  o --> s4([remotion])
  o --> s5([remotion-best-practices])
  o --> s6([remotion-video-toolkit])
  o --> s7([artifacts-builder])
  o --> s8([web-perf])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `creative-frontend-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `creative-frontend-core` | 📐 hub · shared reference | ✅ enumerated |
| `astro-gsap-scrolltrigger` | spoke | ⤵ on-demand |
| `animejs` | spoke | ⤵ on-demand |
| `web-motion-library` | spoke | ⤵ on-demand |
| `remotion` | spoke | ⤵ on-demand |
| `remotion-best-practices` | spoke | ⤵ on-demand |
| `remotion-video-toolkit` | spoke | ⤵ on-demand |
| `artifacts-builder` | spoke | ⤵ on-demand |
| `web-perf` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@creative-frontend-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [../../NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
