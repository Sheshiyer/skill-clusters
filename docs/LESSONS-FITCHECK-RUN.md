# Lessons — the first full brand genesis (Fitcheck / HDILINT)

**What this is.** Fitcheck is the venture-OS tracer slice. We ran a *real* brand all the way through the brandmint engine end-to-end — **waves 0-8** (spec → logo/voice/positioning/version → real imagery → score → reroll → pack → register → persist) — twice, then rebuilt its whole visual identity. This doc captures what that taught us about the **engine**, and turns each lesson into either a **shipped change** or a **roadmap gap**.

> TL;DR: the pipeline *works*. The misses were not "bad taste" — they were **data-flow + missing-gate** problems. Three are now fixed in the engine; three are new gates the engine still needs.

---

## The lessons

### 1. Ground generation in the PRODUCT, not the NAME — `SHIPPED`
The flow built image prompts from `positioning.category` (which for Fitcheck was the vague `"technology"`) and **ignored `identity.mission`**. So the image model read the *name* literally and "Fitcheck" drifted **athletic / fitness** — the opposite of the product (AI virtual try-on for fashion).
- **Principle:** a render must be grounded in *what the brand does* (the mission) and any explicit art direction, not a literal reading of its name.
- **Change (PR #103):** `planImageArtifacts` now weaves in `identity.mission` + two optional `visual_tokens` fields: **`logo_brief`** (reuse the brand-system's actual concept) and **`art_direction`** (explicit steer, including *anti-cues* like "avoid fitness/gym/athletic"). Now first-class in the brand-spec schema.

### 2. Validate the NAME *before* building the brand — `GAP`
"Fitcheck" is **semantically perfect** ("fit check" = the outfit-show ritual) but **commercially DOA**: an exact-name **FitCheck \| Virtual Try-On** already exists on the Shopify App Store, plus ~8 other "FitCheck" try-on products. A live sprint over **11 candidate names** found the entire AI-try-on namespace is **saturated** — every semantic root is taken (drape → Gap-acquired, vesti → live rival, wear/on-model/mira → all taken); only one coined option was even category-clear. We discovered this *after* building the brand.
- **Principle:** in a crowded category, **positioning beats name** — but you must know the name is ownable before you spend on assets.
- **Gap → roadmap:** brandmint needs a **name-validation gate** early in genesis — domain + trademark + App-Store + competitor-collision check — that runs before the asset waves.

### 3. Render backends are pluggable lanes — pick the strongest — `SHIPPED`
`gpt-image-2` (ChatGPT session, no key) was *fine*. **Nano Banana Pro** (Gemini 3 Pro Image, API key) was **dramatically better** — cleaner vector logos, photoreal editorial, reliable in-image text, image-edit references (`-i`), and character consistency.
- **Change (PR #104):** `brandmint --backend gpt-image|nanobanana` (+ `lib/nanobanana.mjs`, the sibling of `gpt-image.mjs`). The default is unchanged; nanobanana is the recommended quality lane.

### 4. Reference-anchored generation gives campaign consistency — `GAP`
Feeding a **character contact-sheet** (`-i`) made *one* model consistent across the hero **and** every on-screen product tile (the "every shopper becomes your product model" frame). The `03-Resources/Design` library is built for exactly this (`character_source` + `grid_contact_sheet`).
- **Gap → roadmap:** the asset system should support a brand **character/model source** so a whole campaign shares one face/identity, not a different stock model per asset.

### 5. Palette-coverage reroll is necessary but not sufficient — `GAP`
The auto-reroll scores **palette coverage** — and the fitness-drift logo *passed* the palette score while being completely **off-concept**. Color is not concept.
- **Gap → roadmap:** the visual-QA loop needs a **semantic / brief-match check** (a vision-model judge or CLIP-style "does this render match the brief + domain?" score) layered on top of palette coverage, before a render is accepted.

### 6. Consume the upstream briefs — don't redo what's good — `PRINCIPLE`
brandmint-v2 had already authored an *excellent* logo brief (Concept-01: the i-dot as a checkmark-silhouette in a fitting-room-mirror frame). The flow **ignored it** and reinvented from scratch — straight into the fitness drift.
- **Principle:** the engine must **read the upstream artifacts** (wiki / specs / briefs) and reuse them; regenerate only what's actually wrong. "Use existing or update; don't redo what's relevant."

### 7. Human-in-the-loop visual review at the asset step — `PRINCIPLE`
Generating to a temp path, **eyeballing**, and promoting only the keeper (vs committing blind) is what caught the fitness drift, the arms-up ambiguity, and drove the garment+camera + Scandinavian-home iterations.
- **Principle:** the asset loop is **generate → look → keep/refine**. Cheap iteration + a real eyeball beats a one-shot.

### 8. The pipeline is real and composable — `VALIDATED`
spec → text → images → score → reroll → pack → register → persist ran end-to-end on a real brand, across two backends, with two distinct brands (Fitcheck + a synthesized Tryambakam). The engine is not a demo.

---

## Scoreboard

| Lesson | Status | Where |
|---|---|---|
| 1 · Ground in mission + `logo_brief` + `art_direction` | ✅ Shipped | PR #103 + schema |
| 3 · Multi-backend render (Nano Banana Pro) | ✅ Shipped | PR #104 |
| 6 · Reuse upstream briefs | ✅ Principle (applied) | flow + this doc |
| 7 · Generate → look → keep | ✅ Principle (applied) | workflow |
| 8 · End-to-end pipeline proven | ✅ Validated | waves 0-8 ×2 |
| 2 · Name-validation gate | 🔴 Gap | new roadmap item |
| 4 · Character/model source for campaigns | 🔴 Gap | new roadmap item |
| 5 · Semantic visual-QA (beyond palette) | 🔴 Gap | new roadmap item |

## The three gates the engine still needs (next cycle)
1. **Name-validation gate** — run domain/trademark/App-Store/competitor checks at the *start* of brand genesis; block or flag a saturated name before asset spend.
2. **Semantic visual-QA** — a brief-match score (vision judge) on every render, gating acceptance alongside palette coverage.
3. **Reference-anchored campaigns** — a brand character/model source so the whole asset set shares one identity.

*Generated from the Fitcheck run, 2026-06-08.*
