<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=180&text=growth-seo&fontSize=42&fontAlignY=38&desc=Route%20SEO%20tasks%20to%20search%20specialists&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-17-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-antigravity-ec4899?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for SEO and search-growth work: it locates a task on the **funnel stage × concern** map and delegates to one of 8 search specialists — intent research, content briefs, site architecture, schema, programmatic pages, technical audits, AI-search (AEO/GEO), and Google's official guidance. The shared search-intent model, the one-query-per-page contract, and the E-E-A-T quality bar every task turns on live in `growth-seo-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([growth-seo-orchestrator]):::hub --> c([growth-seo-core]):::hub
  o --> s1([google-official-seo-guide])
  o --> s2([searchintentautomation])
  o --> s3([seo-content-brief])
  o --> s4([site-architecture])
  o --> s5([schema-markup])
  o --> s6([programmatic-seo])
  o --> s7([seo-audit])
  o --> s8([ai-seo])
  o --> s9([seo-page])
  o --> s10([seo-technical])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 7 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `growth-seo-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `growth-seo-core` | 📐 hub · shared reference | ✅ enumerated |
| `google-official-seo-guide` | spoke | ⤵ on-demand |
| `searchintentautomation` | spoke | ⤵ on-demand |
| `seo-content-brief` | spoke | ⤵ on-demand |
| `site-architecture` | spoke | ⤵ on-demand |
| `schema-markup` | spoke | ⤵ on-demand |
| `programmatic-seo` | spoke | ⤵ on-demand |
| `seo-audit` | spoke | ⤵ on-demand |
| `ai-seo` | spoke | ⤵ on-demand |
| `seo-page` | spoke | ⤵ on-demand |
| `seo-technical` | spoke | ⤵ on-demand |
| `seo-content` | spoke | ⤵ on-demand |
| `seo-images` | spoke | ⤵ on-demand |
| `seo-competitor-pages` | spoke | ⤵ on-demand |
| `seo-sitemap` | spoke | ⤵ on-demand |
| `seo-hreflang` | spoke | ⤵ on-demand |
| `seo-plan` | spoke | ⤵ on-demand |
| `seo-dataforseo` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@growth-seo-orchestrator -g -y
```

## Attribution

Primary source: **antigravity-awesome-skills** (MIT) — the granular execution spokes (`seo-page`, `seo-technical`, `seo-content`, `seo-images`, `seo-competitor-pages`, `seo-sitemap`, `seo-hreflang`, `seo-plan`, `seo-dataforseo`); see [NOTICE](../../NOTICE). + mixed: the 8 primary funnel spokes are authored for skill-clusters (MIT).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
