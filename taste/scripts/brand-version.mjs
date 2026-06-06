#!/usr/bin/env node
// brand-version.mjs — content-address + diff the canonical brand-spec (the brand-truth contract).
//
// The brand-spec crosses the brandmint -> taste -> conductor seam. As a brand evolves the spec is
// edited; downstream builds must know WHICH spec they built against and WHAT moved between revisions.
// This module gives the spec a deterministic identity and a readable diff:
//
//   versionOf(spec)   -> a short, stable content hash (first 12 hex of sha256 over a CANONICALIZED
//                        spec, so key-insertion order never changes the version). Same truth → same id.
//   diffSpecs(a, b)   -> { changed: [{ path, from, to }], added: [path], removed: [path] }, walking
//                        the brand-truth sections identity / positioning / voice_tokens /
//                        visual_tokens / persona / taste_seed. PURE — inputs are never mutated.
//
// CLI (isMain-guarded, emit-brand-spec style):
//   node taste/scripts/brand-version.mjs <specA.json>            → prints the version of A
//   node taste/scripts/brand-version.mjs <specA.json> <specB.json> → prints a human-readable diff
//   (exit 2 on a usage / read / parse error)
//
// Zero dependencies: node:crypto / node:fs only.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { stableStringify } from './lib/canonical.mjs';

// The brand-truth surface diffSpecs walks. The top-level `brand` slug and `assets` are intentionally
// out of scope — they aren't brand *truth*, they're identity/attachments — matching the task's
// named field list.
const SECTIONS = ['identity', 'positioning', 'voice_tokens', 'visual_tokens', 'persona', 'taste_seed'];

// canonical JSON (order-invariant) → ./lib/canonical.mjs, shared with the idempotency ledger so the
// brand version hash and the action key fingerprint content the same, drift-free way.

// --- versionOf -------------------------------------------------------------------------------------

// Deterministic 12-char content hash of the whole spec. Canonicalize first so the version is a pure
// function of the spec's VALUE, never its key order. 12 hex chars (48 bits) is plenty to pin a spec
// revision without being unwieldy in logs/filenames.
export function versionOf(spec) {
  return createHash('sha256').update(stableStringify(spec)).digest('hex').slice(0, 12);
}

// --- diffSpecs -------------------------------------------------------------------------------------

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Recursively compare two values at `path`, appending into changed/added/removed. PURE: only reads
// `av`/`bv`; never writes them. Three-way reconciliation per level:
//   - both containers of the same kind → recurse per key/index (union of keys)
//   - a key present only in B → added; only in A → removed
//   - leaves (or kind mismatch) that differ → changed { path, from, to }
function walk(av, bv, path, out) {
  // both plain objects → recurse over the union of keys
  if (isObj(av) && isObj(bv)) {
    const keys = new Set([...Object.keys(av), ...Object.keys(bv)]);
    for (const k of keys) {
      const sub = path ? `${path}.${k}` : k;
      walkKey(k in av, k in bv, av[k], bv[k], sub, out);
    }
    return;
  }
  // both arrays → recurse over the union of indices (bracket notation in the path)
  if (Array.isArray(av) && Array.isArray(bv)) {
    const len = Math.max(av.length, bv.length);
    for (let i = 0; i < len; i++) {
      const sub = `${path}[${i}]`;
      walkKey(i < av.length, i < bv.length, av[i], bv[i], sub, out);
    }
    return;
  }
  // leaves, or a kind mismatch (e.g. string vs array). Fast-path: if BOTH sides are primitives,
  // compare directly (Object.is handles NaN/±0) — no need to allocate two JSON strings per scalar.
  // Only fall back to canonical stringify when a side is still a container (kind mismatch, or an
  // object/array reached here because the other side isn't the same kind).
  const differ = (av !== null && typeof av === 'object') || (bv !== null && typeof bv === 'object')
    ? stableStringify(av) !== stableStringify(bv)
    : !Object.is(av, bv);
  if (differ) out.changed.push({ path, from: av, to: bv });
}

// Decide added / removed / recurse for a single key or index, given its presence on each side.
function walkKey(inA, inB, av, bv, path, out) {
  if (inA && !inB) { out.removed.push(path); return; }
  if (!inA && inB) { out.added.push(path); return; }
  walk(av, bv, path, out); // present on both sides → compare deeper
}

// Structured diff of two brand-specs across the brand-truth sections only. PURE.
export function diffSpecs(a = {}, b = {}) {
  const out = { changed: [], added: [], removed: [] };
  for (const section of SECTIONS) {
    const inA = a && section in a;
    const inB = b && section in b;
    walkKey(inA, inB, a?.[section], b?.[section], section, out);
  }
  return out;
}

// --- CLI -------------------------------------------------------------------------------------------

// Render a diff as a human-readable block (the CLI's two-arg output).
function formatDiff(d) {
  const lines = [];
  if (d.changed.length) {
    lines.push('  ~ changed:');
    for (const c of d.changed) lines.push(`     ${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`);
  }
  if (d.added.length) {
    lines.push('  + added:');
    for (const p of d.added) lines.push(`     ${p}`);
  }
  if (d.removed.length) {
    lines.push('  - removed:');
    for (const p of d.removed) lines.push(`     ${p}`);
  }
  if (!lines.length) lines.push('  (no changes across brand-truth sections)');
  return lines.join('\n');
}

function readSpec(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`✖ cannot read ${file}: ${e.message}`);
    process.exit(2);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`✖ ${file} is not valid JSON: ${e.message}`);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pathA, pathB] = process.argv.slice(2);
  if (!pathA) {
    console.error('usage: node taste/scripts/brand-version.mjs <specA.json> [specB.json]');
    process.exit(2);
  }
  const specA = readSpec(pathA);

  if (!pathB) {
    // one arg → just the version of A
    console.log(versionOf(specA));
    process.exit(0);
  }

  const specB = readSpec(pathB);
  const vA = versionOf(specA);
  const vB = versionOf(specB);
  console.log(`\n  brand-spec diff — ${vA} → ${vB}`);
  console.log(`  ${'-'.repeat(48)}`);
  console.log(formatDiff(diffSpecs(specA, specB)));
  console.log('');
  process.exit(0);
}
