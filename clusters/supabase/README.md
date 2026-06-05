<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Supabase&fontSize=52&fontAlignY=38&desc=Three%20specialists%2C%20one%20router%20%E2%80%94%20build%20%E2%86%92%20secure%20%E2%86%92%20tune&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-5-3ECF8E?style=flat)](../../skills.sh.json)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%C2%B7%20RLS-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Building on, securing, or tuning Supabase?** The orchestrator places your task on the
**concern × surface** map and routes; `supabase-core` holds the authorization model they all
share — **Row-Level Security is the one boundary every Supabase product enforces.**

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

5 skills: `supabase-orchestrator` (router) + `supabase-core` (shared model) + 3 specialists.
Supabase exposes your Postgres tables directly, so authorization can't live in an app server —
it lives in the database as RLS. The orchestrator knows which specialist to reach for, and the
core keeps the interlocking security concepts (RLS policies, keys/roles, auth claims, the
schema-change workflow) consistent across all three.

```mermaid
graph TD
    O["supabase-orchestrator<br/>(hub · concern × surface router)"]
    O --> DEV["supabase-developer<br/>(build a feature end to end)"]
    O --> API["supabase<br/>(current API · security · CLI/MCP)"]
    O --> PERF["supabase-postgres-best-practices<br/>(query · index · pooling)"]
    DEV -. references .-> C["supabase-core<br/>(RLS boundary · keys/roles · auth claims<br/>· products map · schema-change workflow)"]
    API -. references .-> C
    PERF -. references .-> C

    style O fill:#1d7a55,color:#fff
    style C fill:#0f4d36,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `supabase-orchestrator`, `supabase-core` |
| **Build a feature end to end** | `supabase-developer` — Auth, Storage, Realtime, Edge Functions, RLS schema design, client SDK wiring (Next.js / React / Vue), phase-by-phase implementation |
| **Current API · security · CLI/MCP** | `supabase` — live-doc-verified product guidance, the Supabase-specific security checklist, `getSession`/`getUser`/`getClaims` + `@supabase/ssr`, CLI & MCP-server workflow, advisors → migration |
| **Database performance** | `supabase-postgres-best-practices` — query optimization, missing/partial indexes, query-plan review, connection pooling & scaling, concurrency/locking, monitoring |

## The model that ties it together

Supabase serves your tables directly, so **authorization lives in Postgres as Row-Level Security**:

```
Request ──carries──> Role + JWT claims ──checked by──> RLS Policy(ies) ──on──> Table/Storage object
```

Enable RLS on every table in an exposed schema; write policies that match the real access model;
`UPDATE` needs a `SELECT` policy; use `app_metadata` (never user-editable `user_metadata`) for
auth decisions; never ship the `service_role` key to a public client. Full model in
[`supabase-core`](../../skills/supabase-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@supabase-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@supabase-developer -g -y        # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
