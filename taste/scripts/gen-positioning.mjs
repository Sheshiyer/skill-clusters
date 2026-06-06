#!/usr/bin/env node
// gen-positioning.mjs — the generic brandmint positioning/messaging capability (issue #29).
//
//   node taste/scripts/gen-positioning.mjs <brand-spec.json> [out.md]
//
// Turns a CANONICAL brand-spec (the validated contract emitted by brandmint — schema at
// taste/schemas/brand-spec.schema.json) into a Markdown POSITIONING BRIEF, DETERMINISTICALLY:
// no AI, no network, no spend. Sibling to gen-voice.mjs (verbal voice) and gen-logo.mjs (visual):
// same pure-core + isMain-CLI shape, but it reads `positioning` (category/differentiation/
// target_market) + `persona` (pains/gains) + `identity` (name/tagline/mission).
//
// genPositioning() is the PURE core (brand-spec in → one Markdown string out): no I/O, no network,
// no mutation of its input — so it's unit-testable like the wing's other pure cores (genLogo,
// genVoiceGuide, emitBrandSpec). The file write lives behind main().

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// asArr/oneLine + the safe brand-spec reader are shared with the other brandmint generators.
import { asArr, oneLine, readBrandTokens } from './lib/brand-tokens.mjs';

// ---- small helpers --------------------------------------------------------

// Drop a trailing sentence terminator so a clause can be spliced mid-sentence cleanly.
function clause(s) {
  return oneLine(s).replace(/[.!?;]+$/, '').trim();
}

// Lowercase the first character (for splicing a clause after "who …").
function lowerFirst(s) {
  const t = clause(s);
  return t ? t[0].toLowerCase() + t.slice(1) : t;
}

// Render an array as a Markdown bullet list, or a single fallback line when empty.
function bullets(arr, fallback) {
  const items = asArr(arr);
  if (!items.length) return `_${fallback}_`;
  return items.map((i) => `- ${i}`).join('\n');
}

// Render an array as a numbered list, capped to [min,max] items, with a fallback when empty.
function numbered(arr, fallback, max) {
  const items = asArr(arr).slice(0, max || asArr(arr).length);
  if (!items.length) return `_${fallback}_`;
  return items.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
}

// The first differentiation clause: the spec stores differentiation as one string that often
// packs several clauses (": a; b; c"). Take the lead clause for the tight one-liner.
function leadDiff(differentiation) {
  const d = clause(differentiation);
  if (!d) return '';
  // strip a "Header: first clause; second; …" prefix down to the first concrete clause
  const afterColon = d.includes(':') ? d.split(':').slice(1).join(':').trim() : d;
  const firstClause = afterColon.split(';')[0].trim();
  return clause(firstClause || d);
}

// The positioning primitives (name/tagline/mission/category/differentiation/target + persona
// who/pains/gains) come from the shared readBrandTokens(spec) — same safe fallbacks, now in one
// place (./lib/brand-tokens.mjs).

// The classic positioning statement. The schema carries no `alternatives` field, so the "unlike"
// clause is synthesized from the category ("unlike other {category} options") rather than inventing
// a competitor — keeping the template structurally intact and brand-true.
function positioningStatement(t) {
  const target = t.target || t.who || 'teams who need a better option';
  const pain = t.pains[0] ? lowerFirst(t.pains[0]) : 'are underserved by the status quo';
  const value = t.gains[0] ? lowerFirst(t.gains[0]) : (leadDiff(t.differentiation) ? lowerFirst(leadDiff(t.differentiation)) : 'delivers a measurably better outcome');
  const keyDiff = leadDiff(t.differentiation) ? lowerFirst(leadDiff(t.differentiation)) : (t.gains[1] ? lowerFirst(t.gains[1]) : 'is built to deliver, not to impress');
  return `For ${target} who ${pain}, ${t.name} is the ${t.category} that ${value} — unlike other ${t.category} options, it ${keyDiff}.`;
}

// ── genPositioning (PURE) ─────────────────────────────────────────────────────────────────────
// brand-spec → a Markdown positioning brief string. No I/O, no network, no mutation of `spec`.
export function genPositioning(spec) {
  const t = readBrandTokens(spec);
  const L = []; // lines

  L.push(`# ${t.name} — Positioning Brief`);
  if (t.tagline) L.push('', `> ${t.tagline}`);
  L.push('', `_Deterministically generated from the canonical brand-spec (\`positioning\` + \`persona\` + \`identity\`)._`);

  // Positioning statement (classic template)
  L.push('', '## Positioning statement', '');
  L.push(`> ${positioningStatement(t)}`);

  // Value propositions (mapped from gains, 3–5)
  L.push('', '## Value propositions', '');
  if (t.gains.length) {
    L.push('What customers get — mapped from the gains the brand promises:', '');
    L.push(numbered(t.gains, '', 5));
  } else {
    L.push(numbered(t.gains, 'No gains recorded on the spec — define 3–5 concrete, measurable outcomes here.', 5));
  }

  // Key messages (category + differentiation clauses)
  L.push('', '## Key messages', '');
  const diffClauses = t.differentiation
    ? clause(t.differentiation).replace(/^[^:]*:\s*/, '').split(';').map((c) => clause(c)).filter(Boolean)
    : [];
  L.push(`- **Category:** ${t.name} competes as a **${t.category}**.`);
  if (t.target) L.push(`- **For:** ${t.target}.`);
  if (diffClauses.length) {
    L.push('- **What makes it different:**');
    L.push(...diffClauses.map((c) => `  - ${c}`));
  } else {
    L.push('- **What makes it different:** _Differentiation not yet specified — name the one thing only this brand does._');
  }
  if (t.mission) L.push(`- **Why it exists:** ${t.mission}`);

  // Who it's for
  L.push('', "## Who it's for", '');
  if (t.target || t.who) {
    if (t.target) L.push(`- **Target market:** ${t.target}`);
    if (t.who) L.push(`- **Primary persona:** ${t.who}`);
  } else {
    L.push('_No target market or persona on the spec — define the single best-fit buyer before going to market._');
  }

  // Pains it addresses
  L.push('', '## Pains it addresses', '');
  L.push(bullets(t.pains, 'No pains recorded — interview the target buyer and list what is costing them time, money or conversions.'));

  // Mission
  if (t.mission) {
    L.push('', '## Mission', '', t.mission);
  }

  return L.join('\n') + '\n';
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────
function main() {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath) {
    console.error('usage: gen-positioning.mjs <brand-spec.json> [out.md]');
    process.exit(2);
  }
  if (!fs.existsSync(specPath)) {
    console.error(`  brand-spec not found: ${specPath}`);
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.error(`  brand-spec is not valid JSON (${specPath}): ${e.message}`);
    process.exit(2);
  }

  const md = genPositioning(spec);
  if (outPath) {
    try {
      fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
      fs.writeFileSync(outPath, md);
    } catch (e) {
      console.error(`  cannot write ${outPath}: ${e.message}`);
      process.exit(2);
    }
    const name = (spec.identity && spec.identity.name) || spec.brand || 'Brand';
    console.log(`  ✓ ${name}: wrote positioning brief → ${outPath}`);
  } else {
    process.stdout.write(md);
  }
}

// Run the CLI only when invoked directly — importing the module (e.g. from tests) is side-effect-free.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
