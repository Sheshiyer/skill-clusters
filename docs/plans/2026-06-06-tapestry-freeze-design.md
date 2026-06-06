# The Tapestry — frozen design (the autonomous on-brand venture operator)

**Date:** 2026-06-06 · **Status:** design frozen (15 decisions locked) · **Pilot:** HDILINT (Virtual Try-On Plugin)

> A founder describes a venture; the system brands it, builds it on-brand, takes it to market, and runs
> it — risk-tiered autonomous, founder at the tiller. This doc freezes the design so execution doesn't drift.

## The organism — 7 organs + 1 cortex

```mermaid
graph TD
  HERMES["🗣️ Hermes — founder's point of contact"] <--> PC["📎 Paperclip — digest + approvals queue"]
  PC <--> SG["👔 snow-gloves — C-suite / portfolio (dispatches per-venture)"]
  SG --> COND["🧠 conductor — per-venture execution"]
  BM["🧬 brandmint — brand spec"] --> COND
  BM --> NO
  COND <--> NO["🧩 noesis — shared 1024-dim cortex (taste · brand · knowledge)"]
  COND --> CL["🛠️ skill-clusters — build·maintain·market·ops"]
  CL --> EX["📡 explee + growth clusters — distribution (outbound + inbound)"]
  EX --> AN["📊 analytics — PostHog sensory organ"]
  AN -.north-star signal.-> SG
  classDef k fill:#8b5cf6,color:#fff; class SG,BM,NO,COND,CL,EX,AN k;
```

## The 15 frozen decisions

| # | Decision | Frozen |
|---|---|---|
| 1 | First build | **Thin end-to-end vertical slice** (tracer through all organs) |
| 2 | Pilot | A fresh idea via brandmint → **HDILINT** (Virtual Try-On Plugin) |
| 3 | Autonomy | **Risk-tiered** — autonomous internal; hard-gate external/irreversible |
| 4 | Orchestration | **Layered** — snow-gloves (portfolio) dispatches into a per-venture conductor |
| 5 | Runtime | **Local-first** (agent harness); cloud only for noesis. *Multi-tenant SaaS = later lift* |
| 6 | Repos | **Federated** + snow-gloves integrator + noesis shared memory |
| 7 | Brand handoff | A **canonical brand spec** (positioning · voice/visual tokens · persona · taste-seed + assets) seeds noesis + taste + conductor |
| 8 | North-star | **Composite** `w_rev·Revenue + w_dem·Demand + w_qual·Quality` — stage-weighted · product-specific · founder-tunable · self-optimizing |
| 9 | Distribution | **Multi-channel** — explee (outbound) + growth clusters (inbound), mix per venture |
| 10 | Hard gates | **All four** — spend money · outbound to real people · publish/deploy publicly · brand + strategic direction |
| 11 | 6th/7th organ | **Analytics/Measurement** (PostHog) — the sensory organ that feeds the north-star |
| 12 | Failure/drift | **Tiered** — bounded self-heal → pause + diagnose + alert (never silent loop/abandon) |
| 13 | Founder loop | **Hermes** (point of contact) ← **Paperclip** (digest + approvals queue) ← snow-gloves |
| 14 | Slice-1 done | **Fully live** — actually launches (site + real outreach), founder-gated at all four |
| 15 | Seed | **HDILINT** `/01-Projects/thoughtseed/HDILINT/` — brand-config + wiki + GTM assets already exist |

## The pilot — HDILINT

A **Kimi-Agent virtual try-on plugin** for Shopify/Instagram/fashion brands. Already on disk: a brandmint
`brand-config.yaml` + `wiki/` (synthesis output), `generated/` assets, `reference/product-marketing-context.md`,
and a drafted GTM campaign (`Kimi Agent Virtual Try-On Plugin Sales/`: leads for Shopify/Instagram/LinkedIn,
outreach templates, CRM + deliverability guides, war-room plan). So the slice **resumes** an in-flight venture
rather than starting cold — brand + GTM are seeded; the gap is *build the plugin* + *actually go live*.

## The first slice (execution shape, founder-gated)

1. **Brand** — run/confirm brandmint on HDILINT's `brand-config.yaml` → emit the **canonical brand spec** → seed `noesis` (`brand:hdilint`) + the taste prototype. *(gate: brand + strategic direction)*
2. **Build** — conductor resolves "build a virtual try-on plugin + landing page" → creative-frontend/build clusters, taste brief injected → an on-brand artifact. *(gate: deploy/publish)*
3. **Distribute** — explee runs the existing HDILINT GTM (ICP: Shopify/Instagram/LinkedIn brands) → personalized outreach + inbound (growth clusters). *(gate: spend + outbound)*
4. **Measure** — PostHog wired → demand/quality/revenue signal → the composite north-star.
5. **Close** — loop-feedback + taste-feedback + analytics → snow-gloves digest → **Hermes** → founder; Sentinel watches drift.

Every irreversible step **queues to Hermes for approval**; the founder approves, the system proceeds.

## Open inputs to start execution
- HDILINT one-liner + ICP confirmation (mostly in `reference/` + the GTM folder already).
- Live rails: domain/hosting, sending + deliverability, PostHog project, explee audience, the Hermes/Paperclip loop.
- Build target for the plugin (platform: Shopify app? embeddable widget? — confirm at plan time).
