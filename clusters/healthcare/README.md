<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=220&text=Healthcare&fontSize=52&fontAlignY=38&desc=Four%20clinical%20specialists%2C%20one%20router%20%E2%80%94%20protect%20%E2%86%92%20build%20%E2%86%92%20decide%20%E2%86%92%20gate&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-6-2ea043?style=flat)](../../skills.sh.json)
[![Patient safety](https://img.shields.io/badge/patient%20safety-non--negotiable-d1242b?style=flat)](../../skills/healthcare-eval-harness/SKILL.md)
[![PHI](https://img.shields.io/badge/PHI-default--deny-8957e5?style=flat)](../../skills/healthcare-phi-compliance/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Four clinical specialists behind a single router.**
Building, reviewing, or shipping a healthcare app? The orchestrator places your task on the
**lifecycle × concern** map and routes; `healthcare-core` holds the data-protection contract and
the patient-safety rules they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=2,12,20&height=2" width="100%" />

## What it is

6 skills: `healthcare-orchestrator` (router) + `healthcare-core` (shared model) + 4 clinical
specialists. The cluster's job is to make a patient-safety-critical domain *navigable* — the
orchestrator knows which specialist to reach for, and the core keeps the interlocking concepts
(classify → access-control → audit, the alert-severity matrix, the CRITICAL-vs-HIGH deploy gate)
consistent so no spoke contradicts another.

```mermaid
graph TD
    O["healthcare-orchestrator<br/>(hub · lifecycle × concern router)"]
    O --> PHI["healthcare-phi-compliance<br/>(privacy · RLS · audit)"]
    O --> EMR["healthcare-emr-patterns<br/>(encounter workflow · UI)"]
    O --> CDSS["healthcare-cdss-patterns<br/>(drug · dose · NEWS2)"]
    O --> EVAL["healthcare-eval-harness<br/>(patient-safety deploy gate)"]
    PHI -. references .-> C["healthcare-core<br/>(classify → access → audit<br/>· alert-severity matrix · gate thresholds)"]
    EMR -. references .-> C
    CDSS -. references .-> C
    EVAL -. references .-> C

    style O fill:#1f6feb,color:#fff
    style C fill:#2ea043,color:#fff
```

## Skills

| Concern | Spokes |
|---|---|
| **Router / model** | `healthcare-orchestrator`, `healthcare-core` |
| **Protect data (privacy)** | `healthcare-phi-compliance` |
| **Build the app (EMR/EHR)** | `healthcare-emr-patterns` |
| **Decision support (safety logic)** | `healthcare-cdss-patterns` |
| **Gate the deploy** | `healthcare-eval-harness` |

## The model that ties it together

Every healthcare app turns on one three-layer contract, protected **by default**:

```
Classify (what is sensitive) ──> Access-control (who may see it) ──> Audit (who did see it)
```

Grant the narrowest access that works; PHI never lands in logs, URLs, browser storage, or LLM
prompts; a critical clinical alert **blocks** the action (never a dismissable toast); and a single
CRITICAL eval failure blocks the deploy. Full model in
[`healthcare-core`](../../skills/healthcare-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@healthcare-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@healthcare-phi-compliance -g -y   # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
