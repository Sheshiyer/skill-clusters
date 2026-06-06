# Unified Cortex — one nervous system for the whole organism

**Date:** 2026-06-06 · **Status:** design (the unification map) · **Scope:** cross-repo (taste · brandmint · snow-gloves)

> Three systems independently built the *same* memory: NVIDIA NIM `nv-embedqa-e5-v5` (**1024-dim**)
> embeddings behind a Cloudflare Worker. This unifies them into **one Worker + one tenant-scoped
> vector store** — so every organ reads and writes the same memory.

## 1. The three that are secretly one

| Today | Worker | Index | Purpose |
|---|---|---|---|
| **je-ne-sais-quoi** (taste) | `taste-nim` (live) | `taste-corpus.jsonl` (200 Codrops, local cosine) + brand prototypes | aesthetic retrieval |
| **brandmint** (design-memory) | `DESIGN_MEMORY_WORKER_URL` | brand assets ↔ prose | asset/brand relevance |
| **snow-gloves-os** (Knowledge Engine) | tenant Workers | per-tenant vector indices | org-knowledge RAG |

All three: **same model, same 1024-dim space, same Worker shape.** They differ only in *what they hold*
and *who they're scoped to* — which means they're not three systems, they're three **collections** in one.

## 2. The unified substrate — `cortex`

**One Worker** (generalize the live `taste-nim`) + **one Cloudflare Vectorize store** + the existing NIM
key pool. Everything is addressed by **`(tenant, collection)`**:

```
cortex Worker  (Cloudflare)
├── keys: NVIDIA pool + proxy_token   (KV: TASTE_SECRETS → rename SECRETS)
├── embed/vlm: NIM nv-embedqa (1024-dim) + llama-vision   ← already built
└── vector store: Cloudflare Vectorize (1024-dim, metadata-filtered)
     partitioned by  { tenant, collection }
```

**Collections** (the kind of memory):
- `taste` — **global**, tenant-agnostic (Codrops aesthetics; shared by every venture).
- `brand:<tenant>` — per-venture brand DNA + assets (brandmint design-memory + je-ne-sais-quoi brand prototype).
- `knowledge:<tenant>` — per-venture org knowledge (snow-gloves connectors data).

Because all live in **one 1024-dim space**, cross-collection queries become possible (e.g. *"Codrops
aesthetics that match this tenant's brand assets and its knowledge-base tone"*) — impossible while split.

## 3. The unified API (the Worker)

| Route | Body | Does |
|---|---|---|
| `POST /embed` | `{texts[]}` or `{image}` | NIM embed → 1024-dim vectors *(exists)* |
| `POST /vlm` | NVIDIA chat payload | vision annotation *(exists)* |
| `POST /upsert` | `{tenant, collection, id, text\|vector, metadata}` | embed (if text) + write to Vectorize |
| `POST /query` | `{tenant, collection, text, k, filter}` | embed query + Vectorize ANN + return matches |

Auth-gated (proxy token); the Worker **enforces tenant scoping** so one venture can never read another's
`brand:` / `knowledge:` (snow-gloves' isolation requirement) — while `taste` is readable by all.

## 4. Re-pointing the three consumers (no logic rewrite — just an endpoint + a collection)

- **`taste-resolve.mjs`** → `POST /query {collection:"taste", text:request}` biased by `brand:<tenant>`
  prototype. (Drop the local cosine + jsonl once the corpus is upserted to `taste`.)
- **brandmint** → set `DESIGN_MEMORY_WORKER_URL` to the cortex; upsert assets/prose to `brand:<tenant>`,
  query the same. Its 7th-wave asset↔prose matching becomes a `/query`.
- **snow-gloves Knowledge Engine** → embed/query against `knowledge:<tenant>` on the cortex instead of a
  per-tenant Worker. Tenant isolation is enforced server-side.

## 5. Why this is the keystone

- **One nervous system** — every organ (brand, taste, clusters, distribution, C-suite) reads/writes one
  memory; the conductor's feedback + snow-gloves' Sentinel govern *one* store, not five.
- **Multi-tenant from day one** — snow-gloves needs it; taste + brandmint inherit it for free.
- **No duplicated infra** — one key pool, one Worker, one vector space, one place to audit.
- **Cross-pollination** — the same-space property lets brand ↔ taste ↔ knowledge inform each other.

## 6. Migration — four independent, reversible phases

| Phase | Step | Reversible? |
|---|---|---|
| **A** | Generalize `taste-nim` → `cortex`: add Vectorize binding + `/upsert` + `/query`; keep `/embed` `/vlm`. | yes (additive) |
| **B** | Upsert the 200-row taste corpus → Vectorize `taste`; switch `taste-resolve` to `/query`. | yes (jsonl kept) |
| **C** | Point brandmint `DESIGN_MEMORY_WORKER_URL` → cortex; collection `brand:<tenant>`. | yes (env swap) |
| **D** | Point snow-gloves Knowledge Engine → cortex; collection `knowledge:<tenant>`. | yes (config) |

Each consumer flips independently; nothing breaks if a phase is paused.

## 7. Decisions to confirm
- **Vector store** = Cloudflare **Vectorize** (native to the Worker, 1024-dim, metadata-filtered for tenancy). Alt: self-host (Qdrant/LanceDB) — heavier, unneeded.
- **Name** = `cortex` (proposed) — the shared nervous system. Alt: `noesis` (your brand) / `memory`.
- **Tenant of `taste`** = global (Codrops is universal aesthetic knowledge); brand/knowledge are per-tenant.
