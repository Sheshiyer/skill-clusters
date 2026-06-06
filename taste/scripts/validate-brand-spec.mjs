#!/usr/bin/env node
// validate-brand-spec.mjs — zero-dep validator for the canonical brand-spec (the brand-truth contract).
//
// The brand-spec is the one artifact that crosses the brandmint -> taste -> conductor seam. If it is
// malformed, "on-brand" silently becomes "off-brand". This validator fails loudly. It is schema-DRIVEN
// (reads taste/schemas/brand-spec.schema.json at runtime, never a hardcoded copy) but intentionally
// schema-LITE: it covers exactly what this contract needs — required keys (top-level + one level of
// nested objects), primitive types (string/object/array), array-of-string, and the assets[].id +
// path|url one-of. It is NOT a general draft-07 engine. Same spirit as scripts/skills-health.mjs.
//
//   import { validateBrandSpec } from './validate-brand-spec.mjs'  ->  { valid, errors:[{path,message}] }
//   node taste/scripts/validate-brand-spec.mjs <path-to-brand-spec.json>   (PASS / errors; exit 1 on invalid)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.resolve(__dirname, '..', 'schemas', 'brand-spec.schema.json');

// Read + parse the canonical schema once, lazily. validateBrandSpec may be called per-asset or
// per-brand in a loop; without this it would re-hit the filesystem on every call.
let _schemaCache;
function loadSchema() {
  if (!_schemaCache) _schemaCache = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return _schemaCache;
}

// typeof-with-the-JS-footguns-removed: null is not "object", arrays are "array".
function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // 'string' | 'object' | 'number' | 'boolean' | ...
}

// Validate one value against one property schema node, pushing dotted-path errors. One level of object
// nesting (enough for identity/positioning/persona/voice_tokens/visual_tokens/taste_seed + assets items).
function checkNode(val, node, p, errors) {
  if (node.type && typeOf(val) !== node.type) {
    errors.push({ path: p, message: `expected ${node.type}` });
    return; // a wrong-typed value can't be inspected further
  }
  if (node.type === 'array' && node.items) {
    // Recurse per item: primitives get a type check, object items get full
    // required/oneOf enforcement (this is how assets[].id + path|url is checked).
    val.forEach((item, i) => checkNode(item, node.items, `${p}[${i}]`, errors));
  }
  if (node.type === 'object') {
    // nested required
    for (const r of node.required || []) {
      if (!(r in val)) errors.push({ path: `${p}.${r}`, message: 'required' });
    }
    // nested property types
    for (const [k, sub] of Object.entries(node.properties || {})) {
      if (k in val) checkNode(val[k], sub, `${p}.${k}`, errors);
    }
    // the assets-style one-of: each branch is a single-key `required` (path XOR url)
    if (Array.isArray(node.oneOf)) {
      const keys = node.oneOf.map((b) => (b.required || [])[0]).filter(Boolean);
      const present = keys.filter((k) => k in val);
      if (present.length !== 1) {
        errors.push({ path: p, message: `requires exactly one of ${keys.join('|')}` });
      }
    }
  }
}

export function validateBrandSpec(spec, schema = loadSchema()) {
  const errors = [];
  if (typeOf(spec) !== 'object') {
    return { valid: false, errors: [{ path: '', message: 'expected object' }] };
  }
  // top-level required
  for (const r of schema.required || []) {
    if (!(r in spec)) errors.push({ path: r, message: 'required' });
  }
  // top-level properties (recurse one level into objects + array items)
  for (const [k, node] of Object.entries(schema.properties || {})) {
    if (k in spec) checkNode(spec[k], node, k, errors);
  }
  return { valid: errors.length === 0, errors };
}

// ---- CLI (skills-health output vibe: PASS, or the error list; exit 1 on invalid) ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node taste/scripts/validate-brand-spec.mjs <path-to-brand-spec.json>');
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (e) {
    console.error(`✖ cannot read/parse ${target}: ${e.message}`);
    process.exit(2);
  }
  const { valid, errors } = validateBrandSpec(spec);
  console.log(`\n  brand-spec validation — ${path.basename(target)}`);
  console.log(`  ${'-'.repeat(48)}`);
  if (valid) {
    console.log(`\n  ✓ PASS — valid brand-spec\n`);
    process.exit(0);
  }
  console.log(`\n  ✖ ${errors.length} ERROR(S):`);
  for (const e of errors) console.log(`     ${e.path || '<root>'}: ${e.message}`);
  console.log(`\n  ✖ FAIL — ${errors.length} error(s)\n`);
  process.exit(1);
}
