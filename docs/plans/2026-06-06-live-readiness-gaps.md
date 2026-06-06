# Live-readiness — architectural gaps, edge cases & fallbacks (pre-run review)

**Date:** 2026-06-06 · adversarial review of the frozen tapestry before the fully-live HDILINT slice.

## Resolutions (decided 2026-06-06, one-by-one)

| Gap | Decision |
|---|---|
| **G1** model router | **Best-of-breed per task** — strongest model per content type (creative→Claude, structured→NIM, image→gpt-image-2, video→arcplume, embed/vision→NIM); add `chat()` + a router with per-task fallbacks. |
| **G2** idempotency | **Centralized KV idempotency ledger** at the gate/execute boundary — key = content hash, check-before-fire, record-after. |
| **G3** sending | **explee owns deliverability** (sends via its warmed domains). We build the **Composio reply loop**: connect the founder inbox (Gmail/Zoho) → explee conversations + replies retrievable → demand-signal to north-star + founder-gated response drafts. |
| **G4** provider resilience | **Hybrid** — keep gpt-image-2/arcplume primary; **API-key fallbacks auto-engage** on session failure; NIM→backup LLM. |
| **G5** budget governor | **Per-venture budget + rate governor in the router** — soft-warn (~80%) → hard-pause (100%) + Hermes alert. |
| **G6** noesis | **Accept federated memories for slice-1** (taste cosine + brandmint design-memory + snow-gloves knowledge separate); noesis = explicit v2. |
| **G7** brand-spec | **Define the full canonical `brand-spec.json` now**, formalized from brandmint's existing HDILINT output (identity · positioning · voice/visual tokens · persona · taste-seed · asset refs). |
| **G8–G15** mediums | **Handle inline during the build** (this doc = the checklist); **fold the 3 live-gating ones into the slice plan**: rails (domain/hosting), build-entry (idea→spec→tasks via spec-kit), approval-deadline policy (safe default if the founder is slow). |


> The rule: a *fully-live* run touches real money, real inboxes, real domains. Every gap below is a place
> the autonomous loop could do something irreversible, expensive, or off-brand without a safety net.

## CRITICAL (must close before any live outbound/spend)

### G1 — No generative-text lane / no model router  ← *your example, and the #1 gap*
We configured **embeddings** (`nv-embedqa`) and **vision** (`llama-vision`) — but **text generation is unbuilt**.
`nim.mjs` has `embedText` + `vlmAnnotate`, **no `generate()`/`chat()`**. Yet the live run generates copy,
brand voice, landing text, outreach emails, ad creative — all *unrouted*. And it's inherently **multi-model**:
brandmint already proves this (gpt-image-2 for images, arcplume for video, NIM for embeddings).
- **Config:** a **model router** — `task → {provider, model, fallback}`: `creative-text → NIM llama-3.3-70b | Claude`, `structured-json → a strict model`, `code → Claude/Codex`, `image → gpt-image-2`, `video → arcplume`, `embed → NIM`, `vision → NIM`. Add `chat()` to `nim.mjs`; the router lives next to it; per-task fallback chains.

### G2 — No idempotency on irreversible/external actions
The loop **retries** and **self-heals** (G12 frozen). A retry of an *outbound* step could **double-send
outreach** or **double-deploy**. We already saw a killed job re-run — fine for embeddings, **catastrophic for
real emails**.
- **Config:** every external/irreversible action carries an **idempotency key** + a dedupe store (KV); the
  action no-ops if the key was already fired. *Non-negotiable before live sending.*

### G3 — Sending/deliverability + compliance not configured
Live cold outreach from an **unwarmed domain** = spam folder / blacklist. The HDILINT GTM folder has a
*deliverability guide* but the **sending infra isn't stood up**: dedicated domain, **SPF/DKIM/DMARC**, warmup,
bounce/complaint monitoring, **unsubscribe + CAN-SPAM/GDPR** compliance (you're emailing EU-likely brands).
- **Config:** sending domain + auth records + warmup + suppression list + compliance footer; deliverability
  monitor wired to the analytics organ.

## HIGH (close before scaling the slice)

### G4 — No provider-level fallback; fragile session-based providers
Key-failover + model-fallback exist (built). But if **NIM is fully down**, there's no cross-provider fallback.
Worse: **gpt-image-2 (ChatGPT session)** and **arcplume (Grok/X session)** are **browser-session**, not API-key
— they **expire** and need re-auth → **not autonomous-safe**.
- **Config:** a provider-fallback chain (NIM → OpenAI/Anthropic/inference.sh per task); replace or
  session-keep the visual-gen providers with API-key equivalents (or a session-refresh daemon + alert).

### G5 — Budget/rate governor on AI calls (cost runaway)
The 4 hard gates cover *committing money* — but **AI-API spend itself is ungated**. An autonomous loop can
burn NIM/image/video credits fast.
- **Config:** per-venture spend cap + call-rate limit on the model router; **pause + alert** at threshold.

### G6 — noesis isn't built (the shared memory the slice assumes)
The tapestry assumes one cortex; it's **design-only** (Phase A deferred). For slice-1 the organs run on
**separate** memories (taste local cosine, brandmint design-memory, snow-gloves knowledge).
- **Decision:** acceptable for slice-1 (federated memories) **if explicitly accepted**; otherwise build noesis
  Phase A first. Don't let it be a silent assumption.

### G7 — The canonical brand-spec schema is undefined
Frozen as the handoff (decision 7) but **no schema exists**. Without it the brandmint→taste→conductor seam is
hand-wavy.
- **Config:** define `brand-spec.json` (positioning · voice/visual tokens · persona · taste-seed · asset refs)
  — the contract every downstream organ reads.

## MEDIUM (close during the build)

| # | Gap | Fallback / config |
|---|---|---|
| G8 | **snow-gloves↔conductor dispatch contract** undefined | spec the dispatch + status interface (via Paperclip) |
| G9 | **idea→spec→tasks** generation not automated | wire spec-kit `/specify→/plan→/tasks` into the build entry |
| G10 | **Worker is a SPOF** | health-check + direct-key fallback path in prod |
| G11 | **No venture-level durable state/resume** across organs | one checkpoint that spans brand→build→distribute |
| G12 | **Observability/audit doesn't span all organs** | unified trace + cost view (snow-gloves Sentinel + analytics) |
| G13 | **Secrets sprawl** (.env · KV · explee · Hermes · sessions · PostHog) | consolidate into KV/cortex; one secret contract |
| G14 | **Approval-latency stalls time-sensitive actions** | gates carry a deadline + a "safe default if no response" policy |
| G15 | **Domain/DNS/SSL + brand-name→domain availability** | provision rails; check domain availability at naming time |

## What to configure — the pre-live checklist (priority order)

1. **Model router** + `chat()` lane + per-task fallback chains (G1, G4).
2. **Idempotency layer** for all external actions (G2).
3. **Budget/rate governor** on model calls (G5).
4. **Sending infra** + deliverability + compliance (G3).
5. **Live rails**: domain/hosting/DNS/SSL · PostHog project + instrumentation · explee audience · Hermes/Paperclip loop (G15, G12).
6. **brand-spec schema** (G7) + **dispatch + idea→spec→tasks** wiring (G8, G9).
7. **Decide noesis**: build Phase A now, or accept federated memories for slice-1 (G6).
8. **Autonomous-safe visual gen** (G4) + **venture-level state/audit/secrets** (G11–G13).

## The one-line risk
The frozen *design* is sound; the gaps are all at the **boundary where the autonomous system meets the real
world** — generation, money, sending, and the fragile session-providers. Close 1–4 and the live run is *safe*;
close 5–8 and it's *robust*.
