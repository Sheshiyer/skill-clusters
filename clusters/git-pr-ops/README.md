<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8&height=180&text=git-pr-ops&fontSize=42&fontAlignY=38&desc=route%20a%20GitHub%20PR%20task%20to%20the%20right%20skill&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-6-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a GitHub PR or issue task to the right specialist along the **review → prepare → merge** delivery pipeline, plus the issue-driven and reporting lanes that feed it. The shared contract every spoke obeys — the `.local/` artifact handoff, head-SHA pinning, and the push/merge safety rules — lives in `git-pr-ops-core`, read before preparing or merging a PR.

## Hub-and-spoke

```mermaid
graph LR
  o([git-pr-ops-orchestrator]):::hub --> c([git-pr-ops-core]):::hub
  o --> s1([review-pr])
  o --> s2([prepare-pr])
  o --> s3([merge-pr])
  o --> s4([github])
  o --> s5([gh-issues])
  o --> s6([github-next-wave-orchestrator])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `git-pr-ops-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `git-pr-ops-core` | 📐 hub · shared reference | ✅ enumerated |
| `review-pr` | spoke | ⤵ on-demand |
| `prepare-pr` | spoke | ⤵ on-demand |
| `merge-pr` | spoke | ⤵ on-demand |
| `github` | spoke | ⤵ on-demand |
| `gh-issues` | spoke | ⤵ on-demand |
| `github-next-wave-orchestrator` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@git-pr-ops-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [../../NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
