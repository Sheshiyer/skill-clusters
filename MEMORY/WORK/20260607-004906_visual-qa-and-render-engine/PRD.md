---
task: Visual-QA the Fitcheck landing + build the render engine
slug: 20260607-004906_visual-qa-and-render-engine
effort: advanced
phase: complete
progress: 24/24
mode: interactive
started: 2026-06-07T19:19:06Z
updated: 2026-06-07T19:38:00Z
---

## Context

Continuation after Task 9. Two deliverables the founder asked for:
1. **Browser visual QA** of the built landing (`HDILINT/web/landing/dist/index.html`) — render headlessly, screenshot at 320/768/1280, and **confirm computed contrast** in the *rendered* page (closing my own Task-9 reflection: verify contrast deterministically, not by eyeball).
2. **The render engine** — the VTO core: idempotency-keyed, cost-governed, router-dispatched garment-on-body generation — built + TDD-tested with a MOCK adapter. The **live paid generation stays behind the spend gate** (the router's `image` lane is a stub today, so live firing is naturally gated).

### Decisions
- **Render engine lives in skill-clusters** (`taste/scripts/lib/render.mjs`), not HDILINT — it reuses the Phase-0 libs (`router.generate`, `idempotency.actionKey/once`, `governor.makeGovernor`) same-repo, and commits to the code repo (not the personal vault). HDILINT/render/ becomes a thin pointer + the live-call gate doc.
- **Visual-QA tool is reusable** (`scripts/visual-qa.mjs`, playwright): screenshot at N widths + a computed-contrast audit over rendered text nodes. Built by a parallel subagent while I TDD the engine.
- **No live spend.** The image adapter remains a stub; the engine is proven with an injected mock. Firing a real render needs a wired image API + explicit spend approval.
- **Commit split:** engine + QA tool + tests → skill-clusters. Screenshots + HDILINT/render README → HDILINT (vault, deferred to user).

### Risks
- **Playwright local-file access:** load via `file://` (no server) or a tiny static server; confirm chromium launches headless.
- **Contrast audit accuracy:** must resolve the *effective* background by walking up the DOM (transparent backgrounds inherit), else false positives/negatives.
- **Fallback masking errors:** distinguish adapter-failure → graceful fallback (FR-004) from bad-input → throw; don't swallow programmer errors.
- **No live-spend leak:** tests inject a MOCK adapter; the real image lane stays a stub. Assert no live adapter is invoked (ISC-A1).
- **Capabilities (Advanced):** executing-plans, test-driven-development, Agent (parallel visual-QA subagent), verification-before-completion.

## Criteria

**Visual QA (verification workstream)**
- [x] ISC-1: `scripts/visual-qa.mjs` renders a local file headlessly via playwright (chromium-1223)
- [x] ISC-2: a 320px screenshot is produced (shot-320.png, ~710 KB)
- [x] ISC-3: a 768px screenshot is produced (shot-768.png, ~877 KB)
- [x] ISC-4: a 1280px screenshot is produced (shot-1280.png, ~983 KB)
- [x] ISC-5: a computed-contrast audit runs over 110 rendered text elements (getComputedStyle + gradient compositing)
- [x] ISC-6: audit reports **0 WCAG-AA failures** — it CAUGHT a real bug (hero eyebrow #C2410C on the dark hero = 3.29:1; my Task-9 fix wrongly assumed a light hero) → fixed to bright #FF6B35 (6:1); also hardened the sticky header (0.85→0.95) so the brandmark dot stays AA on scroll
- [x] ISC-7: screenshot visually confirms hero + all sections render (read shot-768.png — hero, problem, solution, how-it-works, pricing, faq, cta)

**Render engine (build workstream)**
- [x] ISC-8: `media-gen` cluster activated — `tier.mjs --activate` deployed it (`● media-gen (activated) → enumerates 2`); base tier stays deferred-on-demand by design (resolve-task flags it per-run, as intended)
- [x] ISC-9: `render.mjs` exports `renderTryOn(request, opts)`
- [x] ISC-10: `renderTryOn` derives an idempotency key from the request (actionKey on {productImage, body})
- [x] ISC-11: identical request → generates once; second call returns the cached render (test: counter=1)
- [x] ISC-12: distinct requests → both generate (test: counter=2)
- [x] ISC-13: `renderTryOn` charges the governor (cost metered via generate)
- [x] ISC-14: an over-budget venture → BudgetPaused, model never fires (test: counter=0)
- [x] ISC-15: `renderTryOn` dispatches via the router image lane (`generate('image', …)`)
- [x] ISC-16: an adapter failure → graceful fallback object (status:'fallback', image:null) per FR-004
- [x] ISC-17: `render.test.mjs` covers idempotency + governor + fallback with a MOCK adapter (no live spend)
- [x] ISC-18: `node --test render.test.mjs` passes (5/5)
- [x] ISC-19: full taste lib suite passes — 38/38, 0 fail (no regressions)
- [x] ISC-20: HDILINT/render/ README updated to reference the engine + the spend gate

**Gate / honesty**
- [x] ISC-21: the LIVE image generation is NOT fired (image adapter is a stub; only the mock ran)
- [x] ISC-22: the render README documents how to fire a real render (wire an image adapter + spend approval)

**Commit**
- [x] ISC-23: render.mjs + render.test.mjs + visual-qa.mjs committed to skill-clusters (88d15c2, pushed)
- [x] ISC-24: HDILINT artifacts (screenshots, styles fix, render README) NOT in skill-clusters (commit holds only the 3 code files; the "hdilint" grep hit is a PRD-slug false positive)

**Anti-criteria**
- [x] ISC-A1: no live paid generation fired — only the mock adapter ran; the image lane stays a stub
- [x] ISC-A2: no secret values printed
- [x] ISC-A3: the render engine reuses the Phase-0 libs (imports idempotency.mjs + router.mjs), not reinvented

## Verification

| Evidence | Result |
|---|---|
| **Render engine** `node --test render.test.mjs` | 5/5 — idempotency (1 gen for 2 identical) · distinct (2) · over-budget→BudgetPaused (0 fired) · adapter-fail→fallback · bad-input→throw |
| full taste lib suite | **38/38, 0 fail** (no regressions) |
| live spend | NONE — mock adapter only; router `image` lane is a stub (real call gated on a wired adapter + spend approval) |
| `media-gen` activation | `tier.mjs --activate` → `● media-gen (activated) → enumerates 2`; base tier deferred-on-demand by design |
| **Visual QA** `node scripts/visual-qa.mjs … 320,768,1280` | 3 screenshots rendered (710/877/983 KB); **110 text elements audited @1280; 0 contrast failures** (exit 0) |
| real bug caught | hero eyebrow `#C2410C` on the DARK hero = 3.29:1 (my Task-9 fix wrongly assumed light) → fixed to `#FF6B35` (6:1); sticky header 0.85→0.95 so the brandmark dot stays AA on scroll over light sections |
| screenshot spot-check | read shot-768.png — hero + all 7 sections render on-brand |
| commit isolation | `88d15c2` = visual-qa.mjs + render.mjs + render.test.mjs only; HDILINT (landing fix, screenshots, README) deferred to the vault |

**Capability invocation check:** executing-plans ✓ · test-driven-development (render RED→GREEN watched) ✓ · Agent (background visual-QA subagent — built the tool, fixed its own gradient-compositing, found the real bug) ✓ · verification-before-completion (independent re-runs; caught the contrast truth via rendered audit + manual math) ✓. No phantom capabilities.
