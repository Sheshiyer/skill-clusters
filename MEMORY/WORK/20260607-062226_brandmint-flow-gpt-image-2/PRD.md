---
task: Run whole brandmint flow via gpt-image-2 skill
slug: 20260607-062226_brandmint-flow-gpt-image-2
effort: advanced
phase: complete
progress: 36/36
mode: interactive
started: 2026-06-07T06:22:26-07:00
updated: 2026-06-07T06:45:00-07:00
---

## Context

The user (4/10 on the first taste one-shot — "good direction, proceed") asked to run **the whole brandmint flow** wired to the **gpt-image-2 skill** (`/Users/sheshnarayaniyer/.agents/skills-archive/gpt-image-2/`), as a no-spend batch.

**What gpt-image-2 is:** image generation through the user's existing ChatGPT Plus/Pro subscription via the local `codex` CLI — **no per-image billing** (that's the "no spend"). Invocation: `bash scripts/gen.sh --prompt "…" --out <abs.png> [--ref <img>]… [--timeout-sec N]`. Prereqs verified present: codex 0.130.0 + `~/.codex/auth.json` login + python3. Exit codes: 0 ok, 3 cli missing, 5 codex failed (auth/net), 7 imagegen not produced (entitlement/quota/refused).

**The brandmint wing already has the deterministic generators** (all pure, no-spend, in `taste/scripts/`): `emitBrandSpec(config)`, `genLogo(spec)→SVG`, `genVoiceGuide(spec)→md`, `genPositioning(spec)→md`, `versionOf(spec)`/`diffSpecs`. What's MISSING is (a) a **flow orchestrator** that composes them into one brand-kit run, and (b) the **generative half** — real on-brand imagery via gpt-image-2. This task builds both and RUNS it on the real Fitcheck/HDILINT brand-spec.

**Inputs (located):**
- Canonical brand-spec: `/Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/HDILINT/brand-spec.json` (8 sections; Fitcheck; palette `#FF6B35 / #1A1A2E / #16213E`; bold/clean sans; "authentic photography, flat illustration, bold").
- Taste prototype: `taste/brands/hdilint.json` (1024-dim + rules + brand_text).

**Requested:** the whole flow, end-to-end, with gpt-image-2 doing real generation; produce a complete brand kit. **Not requested:** new API spend, a Shopify/render live launch, committing the vault's HDILINT notes.

### Plan

Two new modules in the brandmint wing + a real run:
1. `taste/scripts/lib/gpt-image.mjs` — adapter: pure `buildGenArgs()` (argv for gen.sh) + `makeGptImage({skillDir, runner})→generateImage({prompt,out,refs,timeoutSec})`. Injectable runner ⇒ unit-testable without shelling/codex.
2. `taste/scripts/brandmint.mjs` — orchestrator: pure `buildTextArtifacts(spec)` + `planImageArtifacts(spec)` (on-brand gpt-image-2 prompts derived from the spec) + `runBrandKit({spec,outDir,generateImage,…})→manifest`. isMain CLI.
3. **Run** on the canonical HDILINT spec → `HDILINT/generated/brand-kit/` with the text kit + 2 real gpt-image-2 images (brand-identity board + logo/wordmark concept). Honest failure-layer reporting if the imagegen entitlement (exit 7) isn't present — never fake an image.

### Risks
- **imagegen entitlement** may be off on this ChatGPT plan → gen.sh exit 7. Honest failure-layer report (ISC-31), never a fake (ISC-A2); text kit still ships.
- **Wall-clock:** ≤300s × 2 codex renders may strain the Advanced SLA; orchestrator is the durable deliverable, auto-compress if >150%.
- **Contract drift** writer-subagent vs my tests → tight signatures + the test file handed over; build-to-green.
- **Real raster check:** trust exit 0 *and* verify PNG magic bytes before claiming a real image.
- **Vault hygiene:** write only under `HDILINT/generated/brand-kit/`; never `git commit` vault notes (ISC-A3).

### Plan (technical)
- **gpt-image.mjs:** `buildGenArgs({skillDir,prompt,out,refs,timeoutSec})` → `[gen.sh, --prompt,P, --out,O, (--ref,r)…, (--timeout-sec,N)?]`. `makeGptImage({skillDir,runner})→generateImage({prompt,out,refs,timeoutSec})`: validates prompt/out, calls `runner(argv)`, maps exit 0→{ok,out} / nonzero→{ok:false,code}. Prod runner = `spawnSync('bash', argv)`.
- **brandmint.mjs:** `buildTextArtifacts(spec)` → {`brand-spec.json`, `logo.svg`, `voice.md`, `positioning.md`, `version.txt`}. `planImageArtifacts(spec)` → [{name:'brand-board', prompt, refs}, {name:'logo-concept', prompt, refs}] with on-brand prompts (name, palette hex, type, imagery). `runBrandKit({spec,outDir,generateImage,writeFile,log})` → writes text, loops images, returns manifest. isMain CLI: `brandmint.mjs <spec.json> <outDir> [--no-images]`.
- **Run:** `HDILINT/generated/brand-kit/` ← text kit + README + `images/brand-board.png` + `images/logo-concept.png` (real codex renders).

## Criteria

### gpt-image adapter — lib/gpt-image.mjs
- [x] ISC-1: buildGenArgs returns an argv array whose first element is the gen.sh path
- [x] ISC-2: buildGenArgs includes `--prompt` followed by the given prompt
- [x] ISC-3: buildGenArgs includes `--out` followed by the output path
- [x] ISC-4: buildGenArgs appends one `--ref <path>` pair per reference image
- [x] ISC-5: buildGenArgs includes `--timeout-sec` when a timeout is provided
- [x] ISC-6: buildGenArgs emits no `--ref` token when refs is empty
- [x] ISC-7: makeGptImage's generateImage throws when prompt is empty
- [x] ISC-8: makeGptImage's generateImage throws when out is empty
- [x] ISC-9: generateImage calls the injected runner with the built argv
- [x] ISC-10: generateImage returns {ok:true,out} when runner exits 0
- [x] ISC-11: generateImage returns {ok:false,code} when runner exits nonzero
- [x] ISC-12: gpt-image.test.mjs is all-green under `node --test`

### brandmint orchestrator — brandmint.mjs
- [x] ISC-13: buildTextArtifacts produces a logo.svg containing `<svg`
- [x] ISC-14: buildTextArtifacts produces a voice.md beginning with `# `
- [x] ISC-15: buildTextArtifacts produces a positioning.md containing "Positioning"
- [x] ISC-16: buildTextArtifacts produces version.txt = a 12-hex content hash
- [x] ISC-17: buildTextArtifacts includes the canonical brand-spec.json verbatim
- [x] ISC-18: planImageArtifacts returns at least 2 image descriptors
- [x] ISC-19: every image prompt contains the brand name
- [x] ISC-20: the brand-board prompt contains the three palette hex values
- [x] ISC-21: the logo-concept prompt names the brand wordmark
- [x] ISC-22: runBrandKit writes every text artifact into outDir
- [x] ISC-23: runBrandKit calls generateImage exactly once per image descriptor
- [x] ISC-24: runBrandKit returns a manifest enumerating every artifact
- [x] ISC-25: runBrandKit is idempotent — same spec yields the same version
- [x] ISC-26: brandmint.test.mjs is all-green under `node --test`
- [x] ISC-27: brandmint.mjs CLI runs on a spec path via the isMain guard without throwing

### Real run on Fitcheck/HDILINT
- [x] ISC-28: the flow runs against the canonical HDILINT brand-spec.json
- [x] ISC-29: the brand-kit dir holds logo.svg + voice.md + positioning.md + version.txt
- [x] ISC-30: a brand-kit README/index enumerates the kit contents
- [x] ISC-31: at least one real gpt-image-2 image is produced, OR the failure layer is named honestly
- [x] ISC-32: the taste/scripts suite stays green (no regressions)

### Anti-criteria
- [x] ISC-A1: No new API spend — generation goes through the ChatGPT session only
- [x] ISC-A2: No stub/placeholder image is presented as a real generation
- [x] ISC-A3: No commit of HDILINT vault artifacts (untracked Obsidian notes)
- [x] ISC-A4: No secret values printed (names/lengths only)

## Decisions
- **gotcha:** `genLogo(spec)` returns `{ markSvg, logoSvg, logoDarkSvg }` (object), not a string — `buildTextArtifacts` pulls `.logoSvg`. (Surfaced by the writer subagent reading the real sibling.)
- **brand-spec.json is a plain `JSON.stringify(spec, null, 2)`** (not canonicalized) so it round-trips the input spec exactly for downstream re-parse.
- **Image refs default to `[]` (text-to-image)** — follows the gpt-image-2 skill's "stay text-only when references are ambiguous" guardrail; the adapter still supports `--ref` for future image-to-image.
- **Two images** (brand-board + logo-concept) keep the live codex wall-clock within the Advanced SLA; the orchestrator scales to more.
- **Build split:** I wrote RED tests (contract) → Engineer subagent wrote GREEN impl (no commit) → I verify + run live. TDD + writer/verifier separation.

## Verification

**Fresh consolidated run (2026-06-07T06:45):**
- Contract tests: `node --test` on the two new files → **25 tests / 25 pass / 0 fail**.
- Wing regression: 7 deterministic test files → **74 / 74 / 0** (my 25 new + 49 existing generators — no regression).
- Real kit on disk at `HDILINT/generated/brand-kit/`: 8 files present — brand-spec.json (2182B), logo.svg (636B), voice.md (1851B), positioning.md (2004B), version.txt (`99f09665df9d`), README.md (343B), images/brand-board.png (1.37MB), images/logo-concept.png (837KB).
- Both images **REAL PNG** (Python magic-byte check `\x89PNG`) — brand-board 1024×1536, logo-concept 1823×863. Visually inspected: brand-board = identity board with exact palette swatches labelled #FF6B35/#1A1A2E/#16213E + Fitcheck wordmark + checkmark mark + type specimen + 4 attributes; logo-concept = orange "F" monogram + Fitcheck wordmark, dark & light variants. ~8/10 on-brand (vs the 4/10 deterministic prototype).
- gpt-image-2 entitlement probe: exit 0 + real 786KB PNG → generation rides the ChatGPT session, **$0 new spend** (ISC-A1).
- Git: 4 new untracked files in `taste/scripts/`, **0 tracked-file modifications** (additive); the HDILINT kit is outside the skill-clusters repo (vault) → no vault-note commit (ISC-A3).
- No secret literals in the two new modules (ISC-A4).
- /simplify applied 3 fixes (hoist double `versionOf`; `$HOME`-derived skill dir; `if(images)`); skipped 2 with reasons. Tests stayed green after.

**Capability invocations (all via tool, no phantoms):** Skill(test-driven-development), Agent(Engineer writer) + 4× Agent(/simplify reviewers), Skill(simplify), Skill(verification-before-completion).
