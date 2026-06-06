---
task: canonical brand-spec schema plus zero-dep validator
slug: 20260606-000000_brand-spec-schema-validator
effort: extended
phase: verify
progress: 22/22
mode: interactive
started: 2026-06-06T00:00:00Z
updated: 2026-06-06T00:18:00Z
---

## Context

Unit C of Phase 0 (HDILINT live-slice) for the je-ne-sais-quoi taste engine. brandmint
generates a brand; the conductor builds on-brand; the taste engine keeps it on-brand. The
**canonical brand-spec** is the single contract all three read — the one artifact carrying
brand truth across the brandmint→taste→conductor seam. Under-specify it and "on-brand"
silently becomes "off-brand". This task defines its JSON Schema (draft-07) + a zero-dependency
schema-driven-lite validator that fails loudly on a malformed spec.

Conventions (verified against repo): zero-dep Node ESM (`.mjs`), Node v26, built-ins only, no
JSON-schema npm lib. Test runner is `node --test`. Precedent validator style: `scripts/skills-health.mjs`
(zero-dep frontmatter + schema-subset checks). Precedent test style: `taste/scripts/lib/*.test.mjs`
(`node:test` + `node:assert`). Precedent schema style: `schemas/skill-frontmatter.schema.json`
(draft-07 with `$id`).

Requested: schema file + validator + CLI + TDD tests, commit with the Co-Authored-By trailer,
schema file IS committed (source/contract not data). Not requested: a general draft-07 engine,
any npm dependency, runtime/network behavior.

### Risks

- Validator and schema drift apart → mitigated: validator loads the REAL schema file at runtime;
  a test asserts this (no hardcoded copy).
- assets[].path|url one-of ambiguity → mitigated: spec defines exactly-one-of {path,url} required;
  validator implements XOR with a dotted path under `assets`.
- Over-engineering toward full JSON-schema semantics → mitigated: scope capped to required keys
  (top + nested), primitive types, array-of-string, and the assets one-of. ~80 lines.
- Nested error paths unclear → mitigated: dotted paths (`visual_tokens.palette: required`,
  `identity.name: expected string`, `assets[0]: requires exactly one of path|url`).

### Plan

1. TDD: write `taste/scripts/validate-brand-spec.test.mjs` first (5 cases) — watch it fail.
2. Write `taste/schemas/brand-spec.schema.json` (draft-07, the required arrays + nested shapes).
3. Write `taste/scripts/validate-brand-spec.mjs` — `validateBrandSpec(spec)` reads the real schema,
   walks required + types + array-of-string + assets one-of → `{valid, errors:[{path,message}]}`;
   CLI prints PASS/errors, exit 1 on invalid.
4. Run tests → green. Self-review (/simplify spirit). Commit (schema + validator + test).

## Criteria

- [x] ISC-1: `taste/schemas/brand-spec.schema.json` exists and is valid JSON
- [x] ISC-2: schema declares draft-07 via `$schema`
- [x] ISC-3: schema top-level `required` is exactly [brand, identity, positioning, voice_tokens, visual_tokens]
- [x] ISC-4: schema defines `identity` object with required `name`
- [x] ISC-5: schema defines `positioning` with required `category` and `differentiation`
- [x] ISC-6: schema defines `voice_tokens` with required `tone` as array-of-string
- [x] ISC-7: schema defines `visual_tokens` with required `palette` as array-of-string
- [x] ISC-8: schema defines `assets` items with required `id` and a path|url one-of
- [x] ISC-9: schema defines `persona`, `taste_seed` shapes per spec
- [x] ISC-10: `validate-brand-spec.mjs` exports `validateBrandSpec(spec)`
- [x] ISC-11: `validateBrandSpec` returns `{valid:boolean, errors:[{path,message}]}` shape
- [x] ISC-12: validator loads the real schema file (not a hardcoded copy)
- [x] ISC-13: validator detects missing top-level required keys with dotted path
- [x] ISC-14: validator detects missing nested required keys (e.g. visual_tokens.palette)
- [x] ISC-15: validator detects primitive type mismatch (string/object/array)
- [x] ISC-16: validator detects array-of-string violations
- [x] ISC-17: validator enforces assets[].id required + exactly-one-of path|url
- [x] ISC-18: CLI runs `node taste/scripts/validate-brand-spec.mjs <path>` and exits 1 on invalid, 0 on valid
- [x] ISC-19: test: complete valid spec → {valid:true, errors:[]}
- [x] ISC-20: test: missing visual_tokens → invalid, error path includes visual_tokens
- [x] ISC-21: test: voice_tokens.tone as string → invalid, type error at voice_tokens.tone; asset missing path+url → invalid path under assets
- [x] ISC-22: `node --test taste/scripts/validate-brand-spec.test.mjs` is all-green

## Decisions

- **assets path|url = exactly-one-of (XOR), not at-least-one.** Encoded as draft-07 `oneOf` of two
  single-key `required` branches so external draft-07 tools agree; the lite validator reads those
  branches and enforces `present.length === 1` (catches missing-both AND both-present).
- **Validator is schema-DRIVEN, not schema-replicating.** It reads `required`/`properties`/`items`/
  `oneOf` from the loaded schema JSON, so adding a brand-spec field needs no validator edit. Avoided
  a general draft-07 engine (out of scope, would add bulk for no contract value).
- **One recursive `checkNode`** handles type + array-items + object-required/props/oneOf uniformly;
  array items recurse through the same function (primitives → type check, objects → full required/oneOf).
- **`origin` enum + `additionalProperties:true`** in schema: enum documents provenance for external
  tools; the lite validator does not enforce enums (kept to declared scope) and the contract stays
  open for extension fields. Standard draft-07 `enum` is honored by full validators.
- **Schema read memoized** (lazy `loadSchema()` cache) so loop callers don't re-hit disk (/simplify).

## Verification

- **ISC-1,2,3..9 (schema):** `node -e` parse of `taste/schemas/brand-spec.schema.json` →
  `$schema = http://json-schema.org/draft-07/schema#`; top `required = [brand,identity,positioning,
  voice_tokens,visual_tokens]`; identity.required=[name]; positioning.required=[category,
  differentiation]; voice_tokens.required=[tone] with tone.items={type:string};
  visual_tokens.required=[palette] with palette.items={type:string}; assets.items.required=[id]
  with oneOf=[{required:[path]},{required:[url]}]; origin.enum=[user_provided,generated];
  persona.required=[who]; taste_seed.props=aesthetic,references. All confirmed.
- **ISC-10,11,12 (exports/shape/real-schema):** validator exports `validateBrandSpec` + `SCHEMA_PATH`;
  returns `{valid,errors:[{path,message}]}`; test asserts it loads the real on-disk schema at the
  canonical path and that schema.$schema is draft-07 → drift-proof. Test green.
- **ISC-13..17 (validator logic):** invalid CLI fixture produced exactly: `identity.name: required`,
  `positioning.differentiation: required`, `voice_tokens.tone: expected array`,
  `visual_tokens.palette: required`, `assets[0]: requires exactly one of path|url`,
  `assets[1].id: required`, `assets[1]: requires exactly one of path|url`. Covers missing
  top+nested required, primitive type mismatch, array-of-string, and assets id + XOR (both
  missing-both and both-present). 
- **ISC-18 (CLI):** valid fixture → "✓ PASS", exit 0. invalid fixture → 7 errors, exit 1.
  no-arg → usage, exit 2. Verified live.
- **ISC-19,20,21,22 (tests):** `node --test taste/scripts/validate-brand-spec.test.mjs` → 5 pass,
  0 fail. Watched RED first (ERR_MODULE_NOT_FOUND), then GREEN after implementation.
- **Capability invocation check:** `Skill("superpowers:test-driven-development")` invoked (RED watched
  before code). `Skill("simplify")` invoked (4-angle review → 1 efficiency fix applied, retest green).
  Both selected capabilities were actually called via the Skill tool.
