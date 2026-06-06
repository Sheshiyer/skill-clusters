#!/usr/bin/env node
// emit-brand-spec.mjs — map a brandmint brand-config.yaml → the canonical brand-spec.json.
//
// This is the buildable half of the brandmint → taste → conductor seam: brandmint authors a
// brand-config (human-friendly YAML), and everything downstream (the je-ne-sais-quoi taste
// engine, the conductor) consumes the canonical brand-spec. This emitter is the adapter
// between the two shapes, and it is contractually obligated to emit a spec that passes
// validateBrandSpec — a malformed spec is exactly how "on-brand" silently rots to "off-brand".
//
//   import { emitBrandSpec } from './emit-brand-spec.mjs'   // (config) -> brand-spec object
//   node taste/scripts/emit-brand-spec.mjs <brand-config.yaml> <out brand-spec.json>
//     → parse (yaml-lite) → map → write JSON → validate; PASS/FAIL, exit 1 if the emit is invalid.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYaml } from './lib/yaml-lite.mjs';
import { validateBrandSpec } from './validate-brand-spec.mjs';

// ---- small mapping helpers ------------------------------------------------

// Flatten a `|` block (or any multi-line string) into one flowing line: newlines → spaces,
// runs of whitespace collapsed. Used wherever the spec wants a single-line value.
function oneLine(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

// First sentence of a (possibly multi-line) description: flatten, then take up to and
// including the first sentence-ending period. Falls back to the whole flattened string.
function firstSentence(s) {
  const flat = oneLine(s);
  if (!flat) return '';
  const m = flat.match(/^(.*?[.!?])(\s|$)/);
  return m ? m[1] : flat;
}

// Collapse a solution block (often a `: line + bullet list`) to one readable line: turn
// "- item" bullets into separated clauses rather than gluing words across line breaks.
function collapseSolution(s) {
  if (typeof s !== 'string') return '';
  const parts = s
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim()) // strip bullet markers
    .filter(Boolean);
  return parts.join('; ').replace(/:\s*;/g, ':').trim(); // tidy "header:; first" → "header: first"
}

const isStr = (v) => typeof v === 'string' && v.length > 0;
const asArr = (v) => (Array.isArray(v) ? v : []);

// ---- the mapping ----------------------------------------------------------

export function emitBrandSpec(config = {}) {
  const c = config || {};
  const brand = c.brand || {};
  const company = c.company || {};
  const audience = c.audience || {};
  const primary = audience.primary || {};
  const personality = c.personality || {};
  const archetypes = personality.archetypes || {};
  const vis = c.visual_preferences || {};
  const assetsSrc = c.user_provided_assets || {};

  // identity (name required by the schema; default to slug if name is absent)
  const identity = { name: isStr(brand.name) ? brand.name : (isStr(brand.slug) ? brand.slug : 'Untitled') };
  if (isStr(brand.tagline)) identity.tagline = brand.tagline;
  const mission = firstSentence(company.description);
  if (mission) identity.mission = mission;

  // positioning (category + differentiation are required strings)
  const differentiation = collapseSolution(company.solution) || oneLine(brand.tagline) || '';
  const positioning = {
    category: isStr(brand.category) ? brand.category : 'general',
    differentiation: differentiation || 'Differentiation to be defined.',
  };
  const tm = [primary.title, primary.industry].filter(isStr).join(' — ');
  if (tm) positioning.target_market = tm;

  // persona (who required) — only emit when we have at least a title to describe
  const who = isStr(primary.title)
    ? (isStr(primary.company_size) ? `${primary.title} (${primary.company_size})` : primary.title)
    : '';
  const persona = who ? { who, pains: asArr(primary.pain_points), gains: asArr(primary.goals) } : null;

  // voice_tokens (tone required, array-of-string) — traits are the tone; the rest are
  // sensible brand-agnostic defaults so the verbal contract is never empty.
  const voice_tokens = {
    tone: asArr(personality.traits),
    vocabulary: [],
    dos: ['lead with outcomes/ROI'],
    donts: ['overhype the AI'],
  };

  // visual_tokens (palette required, array-of-string)
  const imagery = [
    isStr(vis.photography_style) ? `${vis.photography_style} photography` : null,
    isStr(vis.illustration_style) ? `${vis.illustration_style} illustration` : null,
    isStr(vis.color_mood) ? vis.color_mood : null,
  ]
    .filter(Boolean)
    .join(', ');
  const visual_tokens = {
    palette: asArr(vis.preferred_colors),
    type: { heading: 'bold sans-serif', body: 'clean sans-serif' },
    motion: 'purposeful, fast',
  };
  if (imagery) visual_tokens.imagery = imagery;

  // taste_seed (optional) — aesthetic = color_mood + archetype pair
  const aesthetic = [
    isStr(vis.color_mood) ? vis.color_mood : null,
    [archetypes.primary, archetypes.secondary].filter(isStr).join('/') || null,
  ]
    .filter(Boolean)
    .join(', ');
  const taste_seed = { aesthetic: aesthetic || 'undefined aesthetic', references: [] };

  // assets (optional) — map existing[] entries that carry a path; tag provenance. An entry
  // without a path can't satisfy the schema's path-XOR-url oneOf, so it is skipped (this is
  // how the null-path logo placeholder is dropped).
  const assets = asArr(assetsSrc.existing)
    .filter((a) => a && isStr(a.path))
    .map((a) => ({
      id: path.basename(a.path),
      kind: isStr(a.type) ? a.type : 'asset',
      path: a.path,
      origin: 'user_provided',
    }));

  // assemble — only attach optional blocks when they carry real content, to keep the spec clean
  const spec = { brand: isStr(brand.slug) ? brand.slug : 'untitled', identity, positioning, voice_tokens, visual_tokens };
  if (persona) spec.persona = persona;
  spec.taste_seed = taste_seed;
  if (assets.length) spec.assets = assets;
  return spec;
}

// ---- CLI ------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) {
    console.error('usage: node taste/scripts/emit-brand-spec.mjs <brand-config.yaml> <out brand-spec.json>');
    process.exit(2);
  }
  let config;
  try {
    config = parseYaml(fs.readFileSync(inPath, 'utf8'));
  } catch (e) {
    console.error(`✖ cannot read/parse ${inPath}: ${e.message}`);
    process.exit(2);
  }
  const spec = emitBrandSpec(config);
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');

  const { valid, errors } = validateBrandSpec(spec);
  const base = path.basename(outPath);
  console.log(`\n  emit-brand-spec — ${path.basename(inPath)} → ${base}`);
  console.log(`  ${'-'.repeat(48)}`);
  if (valid) {
    console.log(`\n  ✓ PASS — emitted a valid brand-spec → ${outPath}\n`);
    process.exit(0);
  }
  console.log(`\n  ✖ ${errors.length} ERROR(S) in emitted spec:`);
  for (const e of errors) console.log(`     ${e.path || '<root>'}: ${e.message}`);
  console.log(`\n  ✖ FAIL — emitter produced an INVALID spec (this is a bug)\n`);
  process.exit(1);
}
