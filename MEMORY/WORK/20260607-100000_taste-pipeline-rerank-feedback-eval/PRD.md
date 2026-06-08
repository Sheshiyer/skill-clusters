---
task: Build three taste-pipeline modules with TDD
slug: 20260607-100000_taste-pipeline-rerank-feedback-eval
effort: advanced
phase: complete
progress: 30/30
mode: interactive
started: 2026-06-07T10:00:00-07:00
updated: 2026-06-07T10:24:00-07:00
---

## Context

Three pure, zero-dependency Node ESM (`.mjs`) modules for the taste pipeline, built TDD-first,
living in `taste/scripts/lib/`. They are the pure-logic complements to existing CLI-shaped siblings:

- **#54 `rerank.mjs`** — a second-stage MMR (maximal marginal relevance) rerank for the candidates
  `taste-resolve.mjs` retrieves. `taste-resolve` already does cosine retrieve + a `wReq·sReq + wBrand·sBrand`
  brand-bias re-rank, but its top-K can be near-duplicates. MMR injects DIVERSITY: iteratively pick the
  candidate maximizing `λ·relevance − (1−λ)·maxSimToAlreadyPicked`.
- **#57 `prototype-feedback.mjs`** — the PURE feedback loop. `taste-feedback.mjs` EXISTS as the
  side-effecting CLI (reads corpus, rewrites the brand JSON, harvests triplets). This module is its
  pure core: `updatePrototype` nudges a prototype vector toward chosen exemplars / away from rejected,
  L2-normalized, no mutation. Same nudge idiom as taste-feedback's `(1−α)·proto + α·c` + `unit()`.
- **#60 `taste-eval.mjs`** — on-brand precision metric. Injects `resolveFn` (no live NIM/LLM), runs it
  over labelled `cases`, scores a hit when the brief's `classification[axis]` or `suggested_cluster`
  matches `expect`.

Requested: the three modules + three `node --test` suites with the named scenarios. NOT requested /
forbidden: git commit/push (stated twice), external deps, live network, duplicating taste-feedback,
input mutation, `.md` reports, TypeScript.

House style (from existing lib files): `import { test } from 'node:test'` + `node:assert`, header
comment with run command, terse descriptive test names, side-effect-free imports, cosine via
`dot/norm/cos` with `norm(a)||1` divide-by-zero guard, `centroid`/`unit` helpers.

### Risks

- MMR diversity test needs a carefully designed fixture: the DISTINCT candidate must rank LAST by
  pure relevance (so a difference is observable) yet appear EARLIER under low-lambda MMR. Construct
  near-identical candidates with slightly-higher query sim and one distinct candidate with lower query
  sim but orthogonal embedding.
- "chosen pulls cosine up" must be isolated: the test supplies ONLY chosen (no rejected) so the pull
  is observable without the push confounding it.
- Zero-norm vectors (empty/cancelled nudge, zero prototype) must not produce NaN — guard `norm()||1`.
- Eval axis lookup must be literal `brief.classification?.[axis]` — no key translation. The real
  taste-resolve brief uses `classification.category`; callers pass whatever axis matches their fixture.
- applyFeedbackLog purity depends on updatePrototype being pure; fold via reduce returning fresh vectors.

### Plan

- rerank: `rel(e) = cos(q,e) + (brandVec ? 0.15*cos(brand,e) : 0)`; MMR loop picks
  `argmax[ lambda*rel - (1-lambda)*maxCosToPicked ]`; first pick (empty picked) = argmax rel;
  returns new array of original refs, capped at k. Reuse dot/norm(||1)/cos/centroid idioms.
- updatePrototype: `next=[...proto]`; chosen→`next += rate*(centroid(chosen)-next)`;
  rejected→`next -= rate*(centroid(rejected)-next)`; then `unit(next)`. Empty→`unit(proto)`. Copies only.
- applyFeedbackLog: `events.reduce((p,ev)=>updatePrototype(p,{...ev,...opts}), proto)` — pure fold.
- evalTaste: per case `brief=await resolveFn(req)`; `got=brief?.classification?.[axis]??null`;
  `hit = got===expect || brief?.suggested_cluster===expect`; `precision=hits/n`, `n=cases.length`.
- TDD order: write each *.test.mjs → run (RED, module missing) → implement → run (GREEN). Then
  full-suite run, then /simplify in VERIFY.

## Criteria

rerank.mjs (#54):
- [x] ISC-1: rerank.mjs exports a pure `rerank(candidates, opts)` function
- [x] ISC-2: relevance = cosine of candidate.embedding to queryVec
- [x] ISC-3: brandVec given adds a small brand-bias term to relevance
- [x] ISC-4: MMR objective = lambda*rel - (1-lambda)*maxSimToPicked
- [x] ISC-5: first pick is the max-relevance candidate (empty picked set)
- [x] ISC-6: each next pick maximizes the MMR objective over remaining
- [x] ISC-7: output length capped at k
- [x] ISC-8: lambda and k default to 0.7 and 5
- [x] ISC-9: cosine guards zero-norm vectors (no NaN)
- [x] ISC-10: rerank does not mutate the input candidates array or items

prototype-feedback.mjs (#57):
- [x] ISC-11: exports pure `updatePrototype(prototype, opts)`
- [x] ISC-12: chosen pulls prototype toward mean of chosen embeddings
- [x] ISC-13: rejected pushes prototype away from mean of rejected embeddings
- [x] ISC-14: nudge magnitude scales with rate
- [x] ISC-15: returned prototype is L2-normalized (unit length)
- [x] ISC-16: empty chosen and rejected returns prototype unchanged but normalized
- [x] ISC-17: input prototype array is not mutated
- [x] ISC-18: chosen/rejected input embeddings are not mutated
- [x] ISC-19: exports pure `applyFeedbackLog(prototype, events, opts)`
- [x] ISC-20: applyFeedbackLog folds events left-to-right via updatePrototype

taste-eval.mjs (#60):
- [x] ISC-21: exports `async evalTaste(cases, resolveFn, opts)`
- [x] ISC-22: axis defaults to 'aesthetic_category'
- [x] ISC-23: calls injected resolveFn per case (no live network)
- [x] ISC-24: hit when brief.classification[axis] equals expect
- [x] ISC-25: hit when brief.suggested_cluster equals expect
- [x] ISC-26: precision = hits / n
- [x] ISC-27: perCase records request, expect, got, hit per case
- [x] ISC-28: n equals number of cases

Test suites:
- [x] ISC-29: all three test files exist and import from their module
- [x] ISC-30: node --test passes for all three suites (0 failures)

Anti-criteria:
- [x] ISC-A1: no git commit or git push performed
- [x] ISC-A2: no external dependency imported (zero-dep; node: builtins only if any)
- [x] ISC-A3: no live NIM/LLM/network call in any module or test
- [x] ISC-A4: taste-feedback.mjs not modified or duplicated

## Decisions

- **rerank brand bias = 0.15** (small), added to query cosine only when brandVec given — keeps relevance
  query-dominated while letting brand break ties (proven by the brand-bias test).
- **MMR diversity-test fixture**: distinct candidate `[0.8,0.6]` (cosQ≈0.80, clearly below the dups'
  ≈1.0) at lambda=0.3. RED encoded lambda=0.5 / a near-orthogonal low-relevance vector; the math probe
  showed the cluster's mutual similarity (≈1.0) means lambda must be genuinely low AND the distinct
  candidate's relevance high enough to be liftable. Corrected the TEST (the production MMR was already
  correct), keeping the original intent: distinct surfaces 2nd (behind the single most-relevant), not
  last. This is a fixture fix, not a logic change.
- **updatePrototype** uses `next += rate*(centroid(chosen) - next)` toward chosen and
  `next -= rate*(centroid(rejected) - next)` away from rejected — the same pull idiom as
  taste-feedback.mjs `unit((1-a)*proto + a*c)`, generalized to both signals + L2-normalize.
- **applyFeedbackLog** seeds reduce with `unit([...prototype])` so an empty log returns a unit vector
  (ISC-16/empty-log parity) and never mutates the caller's array.
- **evalTaste**: `got = brief.classification?.[axis] ?? null` (literal axis lookup, no key translation);
  `hit = got===expect || suggested_cluster===expect` (dual handle); empty cases → precision 0 (no /0).
- Cosine `dot` uses `Math.min(a.length,b.length)` so mismatched-dim vectors don't read `undefined`.

## Verification

`node --test` (Node v26) — combined run of all three suites:
- **rerank.test.mjs**: tests 10, pass 10, fail 0
- **prototype-feedback.test.mjs**: tests 10, pass 10, fail 0
- **taste-eval.test.mjs**: tests 9, pass 9, fail 0
- **Combined**: tests 29, pass 29, fail 0, exit 0

TDD discipline: RED verified first — all three suites failed with `ERR_MODULE_NOT_FOUND` (production
module missing), confirming the tests fail for the right reason before any implementation existed.

Anti-criteria evidence:
- ISC-A1: `git log` HEAD unchanged; no `git commit`/`git push` command run this session.
- ISC-A2/A3: `grep -nE '^import|require\(|fetch|http|fs\.|process\.'` over the 3 modules → zero matches
  (the only "nim" occurrence is a comment). Fully self-contained pure logic, no deps, no network.
- ISC-A4: `git status --porcelain taste/scripts/taste-feedback.mjs` → empty (untouched).

Capabilities invoked (no phantoms): `Skill("superpowers:test-driven-development")` in BUILD,
`Skill("simplify")` in VERIFY (drove the `unit()` O(N²)→O(N) hoist; suite re-run stayed 10/10).

Files (all absolute):
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/rerank.mjs
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/rerank.test.mjs
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/prototype-feedback.mjs
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/prototype-feedback.test.mjs
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/taste-eval.mjs
- /Volumes/madara/2026/twc-vault/01-Projects/thoughtseed/Skill-clusters/taste/scripts/lib/taste-eval.test.mjs
