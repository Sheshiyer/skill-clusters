// brand-tokens.mjs — small shared helpers for reading brand-spec token fields safely.
//
// The brandmint text generators (gen-voice, gen-positioning) all coerce spec fields the same way —
// non-empty strings, trimmed string arrays, flattened multi-line text. Factor the primitives here so
// each generator imports them instead of re-declaring identical copies.

export const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

export const asArr = (v) => (Array.isArray(v) ? v.filter((x) => isStr(x)).map((x) => x.trim()) : []);

// Flatten any multi-line string to one flowing line (newlines → spaces, runs collapsed).
export function oneLine(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}
