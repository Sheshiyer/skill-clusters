<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=Databases%20%26%20Data&fontSize=48&fontAlignY=38&desc=7%20data-layer%20specialists%2C%20one%20router%20%E2%80%94%20pick%20%E2%86%92%20model%20%E2%86%92%20optimize%20%E2%86%92%20migrate%20%E2%86%92%20move&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-9-f59e0b?style=flat)](../../skills.sh.json)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![ClickHouse](https://img.shields.io/badge/ClickHouse-OLAP-FFCC01?style=flat&logo=clickhouse&logoColor=black)](https://clickhouse.com)
[![Redis](https://img.shields.io/badge/Redis-cache%2Flocks-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**7 data-layer specialists behind a single router.**
Designing, querying, optimizing, migrating, or moving data? The orchestrator places your
task on the **engine × concern** map and routes; `databases-data-core` holds the
store-selection model and conventions they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

9 skills: `databases-data-orchestrator` (router) + `databases-data-core` (shared model) +
7 specialists. The cluster's job is to make the data layer *navigable* — the orchestrator
knows which store and concern your task belongs to, and the core keeps the interlocking
decisions (store selection, index choice, ID strategy, pooling, expand/contract
migrations, idempotent writes) consistent across every spoke.

```mermaid
graph TD
    O["databases-data-orchestrator<br/>(hub · engine × concern router)"]
    O --> PG["postgres-patterns"]
    O --> MY["mysql-patterns"]
    O --> PR["prisma-patterns"]
    O --> CH["clickhouse-io"]
    O --> RD["redis-patterns"]
    O --> MG["database-migrations"]
    O --> TP["data-throughput-accelerator"]

    PG -. references .-> C["databases-data-core<br/>(store selection · indexes · IDs<br/>· pooling · expand/contract · idempotent writes)"]
    MY -. references .-> C
    PR -. references .-> C
    CH -. references .-> C
    RD -. references .-> C
    MG -. references .-> C
    TP -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `databases-data-orchestrator`, `databases-data-core` |
| **Relational (OLTP)** | `postgres-patterns`, `mysql-patterns`, `prisma-patterns` |
| **Analytics (OLAP)** | `clickhouse-io` |
| **In-memory (cache · locks · queues)** | `redis-patterns` |
| **Schema change** | `database-migrations` |
| **Move data fast** | `data-throughput-accelerator` |

## The model that ties it together

Match the **store to the access pattern** before writing any schema:

```
Workload ──is──> { OLTP rows · OLAP scans · in-memory · ORM-managed } ──picks──> Store
```

Never run analytics off your OLTP primary, Redis is never the system of record, and an ORM
is a convenience *over* a relational engine — you still own the index and pool decisions.
Full model in [`databases-data-core`](../../skills/databases-data-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@databases-data-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@postgres-patterns -g -y             # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
