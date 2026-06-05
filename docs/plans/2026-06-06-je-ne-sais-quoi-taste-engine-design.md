# `je-ne-sais-quoi` — the Taste Engine (right brain for skill-clusters)

**Date:** 2026-06-06 · **Status:** design validated, ready for P0 · **Home:** `skill-clusters/taste/`

> *je ne sais quoi* — the indefinable aesthetic quality. The skill captures exactly that:
> what makes something feel *on-brand and good*, and feeds it to the capability engine.

---

## 1. Vision — two brains, one system

`skill-clusters` is the **left brain**: a request → `resolve-task` → a cluster → *what* technique to use.
`je-ne-sais-quoi` is the **right brain**: it decides *how it should look and feel* — which aesthetic,
matching the brand's DNA + visual tone — by learning from a curated, **visually-enriched** corpus of
design references ([Codrops](https://tympanus.net/codrops/)), embedded via **NVIDIA NIM**, that
**continuously updates** and writes taste back into the clusters.

```mermaid
graph LR
  REQ[request + brand] --> L["🧠 LEFT — skill-clusters<br/>resolve-task → cluster (WHAT)"]
  REQ --> R["🎨 RIGHT — je-ne-sais-quoi<br/>classify → retrieve → conform (HOW)"]
  R -->|taste brief| L
  L --> OUT[cluster builds, on-brand]
  OUT -.usage + rating.-> R
  classDef k fill:#8b5cf6,color:#fff; class L,R k;
```

The unit the right brain hands the left brain is a **taste brief**:
`{aesthetic classification, top-K Codrops exemplars (technique + tags + code link), brand-DNA
conformance directive, steerable axes}` — injected into the cluster's work at the Plan/Execute step.

## 2. Decisions on file (validated)

| # | Decision | Choice |
|---|---|---|
| 1 | Core mechanism | **Full right-brain**: classify → retrieve exemplars → conform to brand-DNA (built in that order) |
| 2 | Embedding | **Embed + index now** (NIM-hosted), **fine-tune later** via the loop |
| 3 | Brand DNA | **One shared taste index** + per-brand **prototype vectors + rules** |
| 4 | NIM access | **Hosted NIM API** (`build.nvidia.com` key) |
| 5 | Sophistication | **Tier B** — multi-modal + VLM-enrich + retrieve→rerank + prototypes + loop + eval; **C-ready** |
| 6 | Corpus scope | **Curated recent subset first** (~few hundred), then scale |
| 7 | Name · first brand | skill = **`je-ne-sais-quoi`** (alias `jnsq`) · first brand = **`tryambakam-noesis`** |

**Why Tier B over naive text-RAG:** taste is *visual* and *relational*. Text-tag cosine retrieval
captures neither. The levers that matter: **multi-modal embeddings** (embed the demo's screenshot, not
just its text), **VLM auto-annotation** (derive the aesthetic vocabulary the tags lack),
**retrieve→re-rank** (separate recall from judgment), **brand prototypes** (a region, not a centroid),
and a **preference loop + eval harness** (so "better" is falsifiable and the fine-tune is *earned*).

## 3. Architecture — four layers (dependency order)

1. **Corpus** — Codrops → respectful crawl + Playwright screenshot + NIM-VLM enrichment → structured rows.
2. **Index** — multi-modal NIM embeddings (visual + text) → one shared **taste index** (local vector store, swappable).
3. **Engine** (`scripts/taste-resolve.mjs`, mirrors `resolve-task.mjs`) — classify → recall → re-rank (brand-biased) → emit the taste brief; reads `skill-index.json` to map aesthetic → cluster/spoke.
4. **Loop** (`scripts/taste-feedback.mjs`, mirrors `loop-feedback.mjs`) — signal → prototype update → triplet harvest → eval → (later) fine-tune + write-back.

## 4. Data model

**Corpus row** (`taste/corpus/taste-corpus.jsonl`):
```jsonc
{
  "url": "...", "title": "...", "tags": ["WebGL","GSAP"], "date": "...",
  "excerpt": "...", "demo_url": "...", "code_url": "...github/zip...",
  "screenshot": "taste/corpus/shots/<id>.webp",
  "taste_schema": {                     // ← VLM-derived aesthetic vocabulary
    "aesthetic_category": "kinetic-editorial",
    "mood": "...", "motion_language": "...", "color_story": "...",
    "type_voice": "...", "density": "...", "composition": "...", "era": "..."
  },
  "source": "codrops"
}
```

**Brand profile** (`taste/brands/tryambakam-noesis.json`):
```jsonc
{
  "prototypes": ["<vec from aleph1319>", "<vec from somatic-canticles>", ...],  // on-brand exemplar vectors
  "rules": { "palette": [...], "motion": "...", "type": "...", "tone": "esoteric/somatic" },
  "sources": ["brand-docs-final/", "aleph1319xwebsite", "...4 sites"]
}
```

## 5. First brand — `tryambakam-noesis` bootstrap (real ground truth)

Not a cold start. Bootstrapped from existing assets under `01-Projects/tryambakam-noesis/`:

- **Rules** ← `brand-docs-final/` (Brand Visual Identity · product.md · tarot-blueprint.md · launch-beta-branding).
- **Prototype vectors** ← screenshot the 4 live, on-brand, **Codrops-skinned** sites:
  - `aleph1319xwebsite` — R3F + Three + postprocessing + GSAP (WebGL experiential)
  - `witness-agents-intro-web` — model-viewer + GSAP + **Lenis** (3D + smooth-scroll)
  - `synchronocities-blog` — Astro + Three + GSAP (editorial + motion)
  - `Somatic-Canticles-Webapp` — Next + Framer Motion (UI motion)
- **Free ground-truth triplets** — because these are Codrops-derived, the techniques they use map back
  to the Codrops demos they're skinned from → seed `(anchor, on-brand+, off-brand−)` for the eval harness.
- **Testing/upgrading baseline** — the engine's first quality test: does it retrieve Codrops references
  that match (or improve) these existing sites?

## 6. The loop (right brain teaches left)

signal capture → online prototype update (good pulls toward used exemplars; rejects push away) → triplet
harvest → eval (held-out ranking accuracy) → **graduation** (contrastive/DPO fine-tune of the NIM
embedder once triplets accrue) → **write-back distillation** (distill stable brand-taste rules into the
cluster `*-core` SKILL.md guardrails — *gated behind review, never silent*).

## 7. Phasing (tracer-first, like the conductor build)

| Phase | Deliverable | Gate |
|---|---|---|
| **P0** corpus tracer | crawl + screenshot + VLM-enrich **~20 demos** → `taste-corpus.jsonl` | the row shape is right |
| **P1** scale corpus | the curated few-hundred subset | enrichment consistent |
| **P2** index + recall | multi-modal NIM embed → taste index → first brief (classify + recall) | a brief returns sane exemplars |
| **P3** rerank + brand | retrieve→rerank + `tryambakam-noesis` prototype from the 5 assets | brief is on-brand on the 4 sites |
| **P4** bridge | `taste-resolve.mjs` wired into conductor Plan/Execute; eval harness online | clusters receive the brief |
| **P5** the loop | feedback → prototype update → triplet harvest → (later) fine-tune + write-back | ranking accuracy improves |

## 8. Where it lives + naming

- Wing: `skill-clusters/taste/` — `corpus/ · brands/ · index/ · eval/ · feedback/ · scripts/`.
- Agent-facing skill: **`skills/je-ne-sais-quoi/SKILL.md`** (alias `jnsq`) — distinct from the existing
  `design-taste-frontend`. Documents when/how the conductor invokes the taste engine.
- Bridge: `scripts/taste-resolve.mjs` beside `resolve-task.mjs`; feedback `scripts/taste-feedback.mjs`.

## 9. Open risks / to confirm at build time

- **NIM multimodal model choice** — pick the hosted NIM embedding model that supports image+text (e.g.
  NV-CLIP / a multimodal embed endpoint); confirm the API shape + the VLM for enrichment. Define a
  swappable `embedder` interface so the model is one config line.
- **Codrops ToS** — crawl politely (rate-limit, cache, identify, attribution retained; personal use).
  Screenshots of *animated/WebGL* demos: capture a representative frame after load + settle delay.
- **Vector store** — start local (LanceDB / sqlite-vec); the index is regenerable, so swapping is cheap.
- **Write-back safety** — `*-core` edits are review-gated and health-checked, never auto-committed.
