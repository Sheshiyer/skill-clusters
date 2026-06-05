# `taste/` — je-ne-sais-quoi (the right brain)

The aesthetic-intelligence wing that pairs with the skill-clusters capability engine. The left brain
(`skill-clusters`) decides *what* technique; this right brain decides *how it should look and feel* —
on-brand, learned from a visually-enriched corpus of [Codrops](https://tympanus.net/codrops/)
references, embedded via NVIDIA NIM. Full design: [`../docs/plans/2026-06-06-je-ne-sais-quoi-taste-engine-design.md`](../docs/plans/2026-06-06-je-ne-sais-quoi-taste-engine-design.md).

## Pipeline

```
crawl-codrops.mjs   → corpus rows + preview images        (no key needed)
enrich.mjs          → taste_schema per row   (NIM VLM)     ← NIM-gated
embed.mjs (P2)      → multi-modal vectors    (NIM embed)   ← NIM-gated
                    → taste index → taste-resolve.mjs → taste brief → clusters
taste-feedback.mjs (P5) → usage/ratings → prototype update → triplets → fine-tune + write-back
```

## Status

- **✅ P0 — corpus tracer.** `crawl-codrops.mjs` pulls recent Codrops posts (RSS, paginated) → 20
  structured rows (`url, title, tags, date, excerpt, demo_url, code_url, screenshot, taste_schema,
  embedding, source`) + downloaded preview images. `lib/nim.mjs` is the swappable NIM client (VLM +
  text + NV-CLIP), and `enrich.mjs` is NIM-ready — it gates gracefully when no key is set.
- **Next:** set the key (below) → `enrich.mjs` fills `taste_schema` → P2 embed + index.

## Setup — NVIDIA NIM key

Hosted NIM (build.nvidia.com). Set one of `NVIDIA_API_KEY` / `NIM_API_KEY`:

```bash
export NVIDIA_API_KEY=nvapi-...            # or put it in a .env you load
node taste/scripts/enrich.mjs             # fills taste_schema via the VLM
```

Model overrides (swap in one line): `NIM_VLM_MODEL` (default `meta/llama-3.2-90b-vision-instruct`),
`NIM_EMBED_MODEL` (`nvidia/nv-embedqa-e5-v5`), `NIM_CLIP_MODEL` (`nvidia/nvclip`), `NIM_BASE_URL`.

## Layout

```
taste/
├── corpus/  taste-corpus.jsonl + shots/   # runtime data (git-ignored — see below)
├── brands/  <brand>.json                  # prototype vectors + rules (P3)
├── index/   the vector taste index        # (P2)
├── eval/    triplets.jsonl                # ground-truth (P5)
├── feedback/ taste-log.jsonl             # the loop (P5)
└── scripts/ crawl-codrops · enrich · lib/nim · (embed · taste-resolve · taste-feedback)
```

## Attribution & use

References are sourced from **Codrops** (tympanus.net/codrops) with credit retained per row. The
crawler is polite (rate-limited, identified, links-only for source code). Downloaded **preview images
are not redistributed** — they're git-ignored and kept local for embedding; the corpus is regenerable
by re-running the crawler. Personal research/training use.
