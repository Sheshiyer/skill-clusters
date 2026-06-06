# Live provisioning checklist — what to stand up before Phases 1–5 go live

**Pilot:** HDILINT / **Fitcheck** (AI virtual try-on for Shopify fashion brands). **Runtime:** local-first; cloud only for the NIM Worker. Each item = *what to get* → *where the secret lands* → *what it unblocks* → *our wiring task*. Secrets go in `.env` / `~/.claude/.env` for the local-first slice (KV via the Worker comes when we productize).

## 1 · Provider API keys — the router's adapters  *(unblocks Phase 2/3 generation · gaps G1/G4)*

**LLM-reasoning lanes are already live — no keys to provision.** creative-text · code · outreach run on **Ollama** (the local daemon proxying `kimi-k2.6:cloud`) as primary, with **NIM** (`llama-3.3-70b`) as the autonomous fallback; structured-json is NIM-primary, Ollama-fallback. Both adapters are wired and tested in `router.mjs`. No Anthropic or fal.ai key is required for the slice.

| Have / Get | Secret (env) | Status | Notes |
|---|---|---|---|
| *(have)* **Ollama** local daemon | `OLLAMA_BASE_URL` (opt), `OLLAMA_MODEL` (opt), `OLLAMA_API_KEY` (opt) | **LIVE** | Primary for text/code/outreach. `kimi-k2.6:cloud` is a reasoning model — adapter defaults `max_tokens:1024` so content isn't starved. |
| *(have)* **NIM** key-pool | `NVIDIA_NIM_API_KEY` / `NVIDIA_API_KEY` | **LIVE** | Text fallback + embed + vision. Via the `taste-nim` Worker in prod. |
| *(have)* gpt-image-2 (ChatGPT) · arcplume (Grok) sessions | — | session-based | Primary image/video. **No fal fallback for now** — if a session expires, that media lane simply fails (acceptable for the slice). |
| *(later)* Anthropic API key | `ANTHROPIC_API_KEY` | deferred | Optional future upgrade if we want Claude as a text primary; the `claude` adapter stub stays until then. |
| *(later)* fal.ai key | `FAL_API_KEY` | deferred | Optional future image/video fallback; the `fal`/`fal-video` stubs stay until then. |

→ Every text content type already has a live primary + fallback on hardware/accounts we hold. Image/video have a live primary (no fallback) for now.

## 2 · Domain + hosting  *(unblocks Phase 5 publish · gap G15)*
- **Check + register a domain** for Fitcheck — verify availability: `getfitcheck.com` / `fitcheck.ai` / `tryfitcheck.com` / `fitcheck.app`. (The brand name is set; the domain must exist before "publish.")
- **Hosting:** Cloudflare Pages (stay on the CF stack) for the landing page; the Shopify widget ships as a Shopify app/embed.
- **DNS/SSL:** Cloudflare (automatic).
- → Our task: a `wrangler pages` project + the deploy step in Phase 2's build.

## 3 · explee / AutoGTM — distribution  *(unblocks Phase 3 outbound · gap G3)*
- **explee account + API key** (deliverability is explee's — it sends via *their* warmed domains). Confirm the key already in `EXPLEE_SECRETS` KV (`ex_access`, `ex_org`).
- **Load HDILINT's GTM** — the leads (Shopify/Instagram/LinkedIn) + outreach templates from `HDILINT/Kimi Agent Virtual Try-On Plugin Sales/` into explee/AutoGTM.
- → Our task: the explee-skills `explee-autogtm` flow, every send wrapped in the **idempotency ledger** (Unit B).

## 4 · Composio — the reply loop  *(unblocks Phase 3 feedback · gap G3)*
- **Composio (compose.io) account + API key** → `COMPOSIO_API_KEY`.
- **Connect the founder inbox** (Gmail or Zoho) via Composio OAuth, so explee conversations + replies are **retrievable by the agent**.
- → Our task: a `taste/scripts/reply-loop.mjs` that pulls replies via Composio → demand-signal to the north-star + drafts for the (gated) response playbook.

## 5 · PostHog — the analytics organ  *(unblocks Phase 4 measurement · gap G11)*
- **PostHog project + project API key** → `POSTHOG_API_KEY` + host.
- → Our task: instrument the landing page (snippet) + the GTM funnel events; the composite north-star reads PostHog (we have the `posthog:*` skills).

## 6 · Hermes + Paperclip — the founder loop  *(unblocks every gate · gap G13)*
- **Hermes agent running** (the founder's point of contact — `~/.hermes/.env` exists; confirm it's live).
- **Paperclip control plane** reachable (the `paperclip` skills + API) — the digest + approvals queue.
- → Our task: snow-gloves dispatch → Paperclip tasks → Hermes notifications; the four gates post here and wait.

## 7 · noesis — *not needed for slice-1*
Federated memories accepted (decision G6); the `taste-nim` Worker already holds the NVIDIA keys. noesis is the post-slice v2.

---

## Priority order (knock these out)
1. ~~Anthropic + fal keys~~ → **DONE differently:** text generation runs live on Ollama+NIM today; no keys to buy. (Anthropic/fal are deferred nice-to-haves, not blockers.)
2. **Domain** (register early — DNS propagates).
3. **PostHog** (instrument early so the funnel measures from day one).
4. **explee + Composio** (the outbound + reply loop — needed at Phase 3).
5. **Hermes + Paperclip live** (the gates route here — needed before the first gate).

**You provide the accounts (3, 4, 5, 6) + the domain (2); we write the wiring (the → tasks).** Generation (item 1) is already live on Ollama+NIM. None of this blocks Phase 1's buildable half (brand-spec emit + validate), which needs nothing live.
