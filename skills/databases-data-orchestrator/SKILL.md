---
name: databases-data-orchestrator
description: "Route a database/data task to the right skill among the data-layer specialists — PostgreSQL, MySQL/MariaDB, the Prisma ORM, Redis, ClickHouse analytics, cross-engine migrations, and high-throughput ingestion/ETL. USE WHEN a user is designing, querying, optimizing, migrating, or moving data but hasn't named the specific engine or concern."
cluster: databases-data
version: 1.0.0
---

# Databases & Data Orchestrator

The single entry skill for data-layer work. It locates the task on the **engine ×
concern** map and delegates to one of the specialist spokes. The cross-cutting
decision every data task starts from — *which store fits this workload* (OLTP vs OLAP
vs cache vs ORM-managed) — plus the conventions every spoke shares (index choice, ID
strategy, pooling, migration safety, idempotent writes) lives in `databases-data-core`;
read it before picking a store or planning a schema change.

## Routing map (intent → spoke)

**Pick & design a relational store (OLTP)**
- PostgreSQL schema, indexes, RLS, pooling, query tuning → `postgres-patterns`
- MySQL / MariaDB schema, replication, deadlocks, connection pools → `mysql-patterns`
- TypeScript backend going through an ORM → `prisma-patterns` *(traps: `updateMany` returns count, `migrate dev` resets the DB, serverless pool exhaustion)*

**Analytics & time-series (OLAP)**
- Column-store schema, MergeTree, materialized views, batch ingest → `clickhouse-io`

**Cache, locks, queues, rate limits (in-memory)**
- Caching, distributed locks, rate limiting, pub/sub, streams → `redis-patterns`

**Change the schema safely**
- Zero-downtime DDL, backfills, rollbacks, expand/contract across PG/MySQL/ORMs → `database-migrations` *(model in `databases-data-core`)*

**Move data fast & correctly**
- Large ingestion, backfill, export, ETL, warehouse load, manifest catch-up → `data-throughput-accelerator`

## Routing rules by intent

- **"Which database should I use?"** → start in `databases-data-core` §1 (the OLTP/OLAP/cache/ORM decision), then the matching engine spoke.
- **"My query is slow."** → the engine spoke (`postgres-patterns`, `mysql-patterns`, `clickhouse-io`); if it's an ORM-generated query, `prisma-patterns` first (N+1, `relationJoins` row explosion).
- **"I need to alter a production table / add a column / index."** → `database-migrations` for the rollout sequence, with the engine spoke for the exact DDL.
- **"I need caching / a lock / a rate limiter / a queue."** → `redis-patterns` (and check whether a `SKIP LOCKED` SQL queue in the engine spoke fits better).
- **"This backfill/ETL is too slow."** → `data-throughput-accelerator`; pair with the target engine spoke for native-load specifics.
- **Polyglot ask** (e.g. "Postgres for app data + ClickHouse for analytics + Redis cache") → fan out to each engine spoke; route the cutover through `database-migrations`.

## Standard flow

1. Locate the task: which **store** (relational / analytical / in-memory / ORM-managed) and which **concern** (model → query → optimize → migrate → move).
2. If it touches **store selection, schema/index design, or any schema change**, pull the model from `databases-data-core` first — these decisions interlock and a wrong store choice is expensive to undo.
3. Delegate to the spoke(s). Multi-step asks fan out in lifecycle order (e.g. "ship a new column" → `database-migrations` plan → engine spoke DDL → backfill via `data-throughput-accelerator`).
4. Return: chosen spoke(s), the store/schema decision implied, the migration or correctness gate required, and the next action.

## Sibling clusters (hand off, don't absorb)

This cluster owns engine/query/migration **internals**. Hand off when the task is about
the layer above the database:

- **App-layer repository pattern, transaction/unit-of-work boundaries, service-layer data access** → `backend-architecture`.
- **ORM work lives with its framework:** Eloquent → `php-laravel`; JPA/Hibernate → `jvm`. Prisma stays here (`prisma-patterns`) as the data-layer ORM this cluster owns.

## Guardrails

See `databases-data-core`. In short: **match the store to the access pattern** — don't
force OLAP scans onto an OLTP row store or run analytics off your primary. Treat every
production schema change as a migration (forward-only, expand/contract, no `NOT NULL`
without a default, build indexes concurrently). Validate inputs at the application
boundary; never trust client-supplied SQL fragments. Size connection pools deliberately
(serverless = external pooler + low per-instance limit). Make bulk writes idempotent and
prove correctness with manifests/counts before calling a data job done.
