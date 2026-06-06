# je-ne-sais-quoi — productionizing the NIM keys

How the taste engine consumes NVIDIA NIM today, and the path to Cloudflare KV + a Worker for prod.

## The key pool (don't overload one account)

`taste/scripts/lib/nim.mjs` uses a **pool of NVIDIA keys**, round-robin per call with failover on
`429`/`5xx`, so no single account gets rate-limited. Both keys hit the same endpoint
(`integrate.api.nvidia.com/v1`) and share the same 120 models — they're two NVIDIA accounts, so
alternating calls genuinely halves the per-account load.

| Var | Role | Source |
|---|---|---|
| `NVIDIA_NIM_API_KEY` | **primary** lane | repo `.env` (new org/account) |
| `NVIDIA_API_KEY` | secondary lane | `~/.claude/.env` (original account) |
| `NIM_KEYS` | *(optional)* comma-separated env-var **names** to define the pool + order explicitly | — |
| `NIM_BASE_URL` | endpoint override (default `integrate.api.nvidia.com/v1`) | — |
| `NIM_VLM_MODEL` · `NIM_EMBED_MODEL` · `NIM_CLIP_MODEL` | model overrides | — |
| `NIM_VLM_FALLBACK` | VLM retried on this model if the primary errors (default `llama-3.2-11b-vision`) | — |

Keys are loaded **in-process** by `lib/load-env.mjs` (repo `.env` first, then `~/.claude/.env` …) —
never shell-sourced. Already-set env vars always win.

> ⚠️ **`NVIDIA_NIM_API_URL=https://api.nvidia.com/nim/v1` in `.env` is not a real endpoint** (fetch
> fails). The client ignores it and uses `integrate.api.nvidia.com/v1`. Fix or delete that line.

> ℹ️ **No re-embedding needed** when switching keys — vectors come from `nv-embedqa-e5-v5`, which both
> accounts share, so existing `taste-corpus.jsonl` embeddings stay valid. The key only affects *who*
> serves the next call, not the vector space.

> ℹ️ **inference.sh** (`INFERENCE_SH_API_KEY`) is a *different* provider with a non-OpenAI API (404 on
> `/models`). It's loaded but **not wired** as a lane yet — adding it needs its own adapter (endpoint +
> request shape). The two NVIDIA accounts already satisfy "two keys, don't overload one."

## Local override (force the pool / a model)

```bash
NIM_KEYS="NVIDIA_NIM_API_KEY,NVIDIA_API_KEY" \
NIM_VLM_MODEL="meta/llama-3.2-11b-vision-instruct" \   # smaller/faster if the 90B is slow
node taste/scripts/enrich.mjs
```

## → Cloudflare KV + Worker (production)

The client reads keys from `process.env`, so production is just "make the Worker set those env vars
from KV." Pattern (matches the existing `EXPLEE_SECRETS` namespace usage):

**1. Put the keys in KV (names only shown; values never logged):**
```bash
wrangler kv key put --binding=TASTE_SECRETS nvidia_nim_primary   "$NEW_KEY"  --remote
wrangler kv key put --binding=TASTE_SECRETS nvidia_nim_secondary "$OLD_KEY"  --remote
```

**2. A Worker resolves them at request time and calls NIM** (the same pool/round-robin logic):
```js
export default {
  async fetch(req, env) {
    const POOL = [await env.TASTE_SECRETS.get('nvidia_nim_primary'),
                  await env.TASTE_SECRETS.get('nvidia_nim_secondary')].filter(Boolean);
    // round-robin + failover over POOL → fetch('https://integrate.api.nvidia.com/v1/…')
  }
}
```

**3. Or keep the Node scripts** and have the Worker/CI inject the KV values as env before running —
`nim.mjs` needs no change, since it already reads `NVIDIA_NIM_API_KEY` / `NVIDIA_API_KEY` / `NIM_KEYS`
from the environment.

The contract is stable: **whatever sets `NVIDIA_NIM_API_KEY` (+ optional pool) into the environment —
`.env` locally, KV-via-Worker in prod — the taste engine just works.**
