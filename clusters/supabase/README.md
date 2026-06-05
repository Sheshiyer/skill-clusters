<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&text=supabase&fontSize=42&fontAlignY=38&desc=route%20to%20the%20right%20specialist&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-3-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes any Supabase task to one of three specialists by locating it on the **concern × surface** map — full-stack feature build (Auth, Storage, Realtime, Edge Functions, RLS schema), live-doc-verified current-API correctness with the security checklist and CLI/MCP workflow, or Postgres performance and query optimization. The cross-cutting model every Supabase app shares — **authorization lives in Postgres Row-Level Security**, the keys/roles that reach the database, and the schema-change → advisor → migration workflow — lives in `supabase-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([supabase-orchestrator]):::hub --> c([supabase-core]):::hub
  o --> s1([supabase])
  o --> s2([supabase-developer])
  o --> s3([supabase-postgres-best-practices])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `supabase-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `supabase-core` | 📐 hub · shared reference | ✅ enumerated |
| `supabase` | spoke | ⤵ on-demand |
| `supabase-developer` | spoke | ⤵ on-demand |
| `supabase-postgres-best-practices` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@supabase-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). Spoke content adapts upstream Supabase-published guidance (MIT); see [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
