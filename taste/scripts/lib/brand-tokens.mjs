// brand-tokens.mjs — the one safe brand-spec READER shared by the brandmint generators.
//
// gen-voice.mjs, gen-positioning.mjs and gen-logo.mjs each turn a CANONICAL brand-spec (the
// validated contract emitted by brandmint — schema at taste/schemas/brand-spec.schema.json) into a
// deliverable, DETERMINISTICALLY. Before building anything, each one has to pull the SAME brand
// primitives (name/tagline/mission/palette/tone/…) out of a possibly-UNDER-specified spec, with the
// SAME safe fallbacks, so the body builders never touch a possibly-undefined nested field. That
// extraction — plus the isStr/asArr/oneLine string helpers it leans on — used to be copy-pasted into
// each generator (isStr/asArr/oneLine were byte-for-byte identical across gen-voice and
// gen-positioning). This module is the single source of truth for it.
//
// Everything here is PURE: brand-spec in → plain values out. No I/O, no network, no mutation of the
// input, and zero dependencies (not even node: builtins) — so it's trivially unit-testable and safe
// to import from any generator's pure core.

// A usable string: a non-empty value once trimmed. The guard for every optional spec field.
export const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

// Coerce an unknown field to a clean string array: keep only usable strings, each trimmed. Anything
// that isn't an array (undefined/null/scalar/object) becomes []. Never throws.
export const asArr = (v) => (Array.isArray(v) ? v.filter((x) => isStr(x)).map((x) => x.trim()) : []);

// Flatten any multi-line string to one flowing line (newlines → spaces, whitespace runs collapsed).
export function oneLine(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

// readBrandTokens(spec) — pull EVERY brand primitive the generators need out of a (possibly
// under-specified) canonical brand-spec, each with its existing safe fallback. The single reader
// behind genVoiceGuide / genPositioning, and available to genLogo via `palette`:
//
//   name            identity.name → brand → 'The brand'   (trimmed)
//   tagline         identity.tagline                       ('' when absent)
//   mission         identity.mission                       ('' when absent)
//   palette         visual_tokens.palette                  ([] when absent) — positional: [0]=accent, [1]=dark
//   tone            voice_tokens.tone                      ([])
//   vocabulary      voice_tokens.vocabulary                ([])
//   dos             voice_tokens.dos                       ([])
//   donts           voice_tokens.donts                     ([])
//   category        positioning.category → 'solution'
//   differentiation positioning.differentiation            ('')
//   target          positioning.target_market             ('')
//   who             persona.who                            ('')
//   pains           persona.pains                          ([])
//   gains           persona.gains                          ([])
//
// PURE: returns a fresh object; never mutates `spec`. `palette` is returned RAW (only guarded to an
// array) because it is read positionally — filtering it would break the [0]=accent / [1]=dark
// contract the logo generator relies on.
export function readBrandTokens(spec = {}) {
  const identity = spec.identity || {};
  const vt = spec.voice_tokens || {};
  const pos = spec.positioning || {};
  const persona = spec.persona || {};
  const visual = spec.visual_tokens || {};
  const name = isStr(identity.name)
    ? identity.name.trim()
    : (isStr(spec.brand) ? spec.brand.trim() : 'The brand');
  return {
    name,
    tagline: isStr(identity.tagline) ? oneLine(identity.tagline) : '',
    mission: isStr(identity.mission) ? oneLine(identity.mission) : '',
    palette: Array.isArray(visual.palette) ? visual.palette : [],
    tone: asArr(vt.tone),
    vocabulary: asArr(vt.vocabulary),
    dos: asArr(vt.dos),
    donts: asArr(vt.donts),
    category: isStr(pos.category) ? oneLine(pos.category) : 'solution',
    differentiation: isStr(pos.differentiation) ? oneLine(pos.differentiation) : '',
    target: isStr(pos.target_market) ? oneLine(pos.target_market) : '',
    who: isStr(persona.who) ? oneLine(persona.who) : '',
    pains: asArr(persona.pains),
    gains: asArr(persona.gains),
  };
}
