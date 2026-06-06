# Live provisioning checklist — what to stand up before Phases 1–5 go live

**Pilot:** HDILINT / **Fitcheck** (AI virtual try-on for Shopify fashion brands). **Runtime:** local-first; cloud only for the NIM Worker. Each item = *what to get* → *where the secret lands* → *what it unblocks* → *our wiring task*. Secrets go in `.env` / `~/.claude/.env` for the local-first slice (KV via the Worker comes when we productize).

## 1 · Provider API keys — the router's fallback adapters  *(unblocks Phase 2/3 generation · gaps G1/G4)*
| Get | Secret (env) | Unblocks | Our wiring task |
|---|---|---|---|
| **Anthropic API key** | `ANTHROPIC_API_KEY` | Claude as the **primary** for creative-text · code · outreach (best-of-breed) | Implement the `claude` adapter in `router.mjs` (replace the stub) |
| **fal.ai key** | `FAL_API_KEY` | Autonomous-safe **image/video fallback** when the gpt-image-2/arcplume sessions expire | Implement the `fal` / `fal-video` adapters |
| *(have)* gpt-image-2 (ChatGPT) · arcplume (Grok) sessions | — | primary image/video (quality) | session-keeper or accept fal fallback |

→ With these three, the router stops being NIM-only and every content type has a live primary + fallback.

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
1. **Anthropic + fal keys** → unblocks all generation (do first; cheapest, biggest).
2. **Domain** (register early — DNS propagates).
3. **PostHog** (instrument early so the funnel measures from day one).
4. **explee + Composio** (the outbound + reply loop — needed at Phase 3).
5. **Hermes + Paperclip live** (the gates route here — needed before the first gate).

**You provide the keys/accounts (1, 3, 4, 5, 6) + the domain (2); we write the adapters + wiring (the → tasks).** None of this blocks Phase 1's buildable half (brand-spec emit + validate), which needs nothing live.
