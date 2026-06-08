---
task: brandmint voice + positioning deterministic generators (#27, #29)
slug: 20260607-130000_brandmint-voice-positioning-generators
effort: extended
phase: complete
progress: 22/22
mode: interactive
started: 2026-06-07T13:00:00Z
updated: 2026-06-07T13:30:00Z
---

## Context

Build two brandmint generators that turn the canonical brand-spec into Markdown
brand artifacts, DETERMINISTICALLY — no AI, no network, no spend. They mirror the
existing pure-core + isMain-CLI pattern of `taste/scripts/emit-brand-spec.mjs` and
`taste/scripts/gen-logo.mjs`.

- **#27 `taste/scripts/gen-voice.mjs`** — `export function genVoiceGuide(spec)` →
  a Markdown voice/tone guide derived from `voice_tokens` (tone/vocabulary/dos/donts)
  + `persona.who` + `identity`. Sections: Tone, Do/Don't, Vocabulary,
  "Writing for {persona.who}", and 2–3 example rewrites (generic → on-brand).
- **#29 `taste/scripts/gen-positioning.mjs`** — `export function genPositioning(spec)` →
  a Markdown positioning brief derived from `positioning` (category/differentiation/
  target_market) + `persona` (pains/gains) + `identity` (name/tagline/mission).
  Includes the classic one-line positioning statement, 3–5 value props from gains,
  key messages, and the pains it addresses.

Both pure functions: same input → same output, input never mutated, graceful on a
spec missing an optional field. CLI shape: `node <script> <brand-spec.json> [out.md]`
(isMain-guarded; prints to stdout, or writes the file if an out path is given;
exit 2 on usage/IO error). Real spec to prove against: `../HDILINT/brand-spec.json`
(Fitcheck — direct/confident/pragmatic voice; Shopify-fashion VTO positioning).

**Requested:** two generators + two test files (`node --test`), run both CLIs on the
real spec, report files/test-results/sample-output. **NOT requested:** git commit/push,
any AI/network/spend, any dependency.

### Risks

- Markdown injection / special chars in spec strings breaking output → keep raw text,
  no leaking `undefined`/`null`.
- Empty optional arrays (the real Fitcheck spec ships `vocabulary: []`) must render a
  graceful fallback, not a broken/empty section or a crash.
- CLI guard must use the robust `pathToFileURL(process.argv[1]).href` form so an
  imported module is side-effect-free (tests import the pure fn).

## Criteria

gen-voice.mjs (#27):
- [x] ISC-1: gen-voice.mjs exports a function named genVoiceGuide
- [x] ISC-2: genVoiceGuide returns a non-empty string
- [x] ISC-3: output contains every tone token from voice_tokens.tone
- [x] ISC-4: output renders the dos entries under a Do section
- [x] ISC-5: output renders the donts entries under a Don't section
- [x] ISC-6: output includes a "Writing for {persona.who}" section heading
- [x] ISC-7: output includes 2–3 example rewrites (generic → on-brand)
- [x] ISC-8: empty vocabulary renders a graceful fallback, no crash
- [x] ISC-9: genVoiceGuide is pure — same input yields identical output
- [x] ISC-10: genVoiceGuide does not mutate its input spec
- [x] ISC-11: gen-voice.mjs CLI prints to stdout and writes a file when given out path

gen-positioning.mjs (#29):
- [x] ISC-12: gen-positioning.mjs exports a function named genPositioning
- [x] ISC-13: genPositioning returns a non-empty string
- [x] ISC-14: output contains the positioning category
- [x] ISC-15: output contains the target_market text
- [x] ISC-16: output contains a one-line positioning statement in the classic template
- [x] ISC-17: output renders 3–5 value props mapped from persona.gains
- [x] ISC-18: output renders the pains it addresses from persona.pains
- [x] ISC-19: genPositioning is pure and does not mutate its input spec
- [x] ISC-20: a spec missing an optional field does not crash genPositioning

Proof:
- [x] ISC-21: `node --test` passes for both gen-voice.test.mjs and gen-positioning.test.mjs
- [x] ISC-22: both CLIs run on ../HDILINT/brand-spec.json producing on-brand output

## Decisions

- Mirror gen-logo.mjs exactly: shebang, header doc comment, pure-core + isMain CLI,
  `pathToFileURL(process.argv[1]).href` guard (side-effect-free on import), exit 2 on
  usage/IO error, defensive `mkdirSync(dirname, {recursive:true})` before file write.
- Classic positioning template has no `alternatives` field in the schema → synthesize
  the "unlike" clause from category ("unlike other {category} options") rather than
  inventing competitor names. Keeps the template structurally intact and brand-true.
- Every list-derived Markdown section gets a graceful fallback sentence when its source
  array is empty/absent (Fitcheck ships `vocabulary: []`; `persona` is schema-optional).
- Tests assert spec-derived content with substring `.includes()` checks, not dynamic
  `RegExp`, so a token with regex-special chars can never break the assertion.
- When the CLI writes a file, the artifact goes to disk and only a short `✓` line goes
  to stdout (mirrors gen-logo); when no out path, the full Markdown prints to stdout.

## Verification

- **Tests:** `node --test gen-voice.test.mjs` → 9 pass / 0 fail. `node --test
  gen-positioning.test.mjs` → 8 pass / 0 fail. (One test caught a real bug during the
  run — the rewrite-row counter matched the table `--- | ---` separator; fixed in the
  test, generator emits exactly 3 rows.)
- **ISC-1/12 exports:** dynamic `import()` confirmed `genPositioning = function`;
  `genVoiceGuide` imported by its test. **ISC-11 CLI:** stdout mode prints Markdown;
  file mode wrote a 57-line voice.md + a `✓` line (positioning wrote 46 lines).
- **ISC-22 real spec:** both CLIs ran on `../HDILINT/brand-spec.json`. Voice guide opens
  "Fitcheck sounds **direct, confident, pragmatic, fast-moving and proof-seeking**";
  positioning resolves the classic template for the Shopify-fashion VTO offer and maps
  the three gains to numbered value props. No `undefined`/`null` leaked into either full
  document (grep clean). Usage error (no args) exits 2. Import is side-effect-free.
- **Capabilities:** zero external capabilities selected in OBSERVE (all declined with
  reasons) → no owed Skill/Task calls, no phantom capabilities.
