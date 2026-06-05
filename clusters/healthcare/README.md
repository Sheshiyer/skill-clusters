<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=10,18,22&height=180&text=healthcare&fontSize=42&fontAlignY=38&desc=Route%20a%20healthcare-software%20task%20to%20the%20right%20specialist&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-5-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a healthcare-software task to the right skill among clinical specialists — PHI/PII privacy & access control, EMR/EHR encounter workflows, the CDSS safety engine (drug interactions, dose, NEWS2), and the patient-safety eval harness that gates deploys. The cross-cutting model every clinical app shares — the three-layer data-protection contract (classify → control access → audit), the patient-safety bias (alerts block, never silently pass), and the CRITICAL-vs-HIGH gate thresholds — lives in `healthcare-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([healthcare-orchestrator]):::hub --> c([healthcare-core]):::hub
  o --> s1([healthcare-phi-compliance])
  o --> s2([healthcare-emr-patterns])
  o --> s3([healthcare-cdss-patterns])
  o --> s4([healthcare-eval-harness])
  o --> s5([claude-ally-health])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `healthcare-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `healthcare-core` | 📐 hub · shared reference | ✅ enumerated |
| `healthcare-phi-compliance` | spoke | ⤵ on-demand |
| `healthcare-emr-patterns` | spoke | ⤵ on-demand |
| `healthcare-cdss-patterns` | spoke | ⤵ on-demand |
| `healthcare-eval-harness` | spoke | ⤵ on-demand |
| `claude-ally-health` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate healthcare --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@healthcare-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT) — the clinical spokes were contributed by Health1 Super Speciality Hospitals (Dr. Keyur Patel) + mixed: `claude-ally-health` is from antigravity-awesome-skills (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
