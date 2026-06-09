#!/usr/bin/env node
// taste-resolve.mjs — P3: the bridge between the brains. {request, brand} → a TASTE BRIEF.
//
//   node taste/scripts/taste-resolve.mjs "<request>" [--brand <name>] [--k 5] [--json]
//
// classify → recall (cosine over the corpus' NIM embeddings) → brand-biased re-rank → emit:
//   { classification, top-K Codrops exemplars (technique + tags + code link), conformance directive,
//     steerable axes, suggested cluster }.  This is what the right brain hands the left brain.
//
// Mirrors resolve-task.mjs (which maps a task → cluster); this maps a request + brand → aesthetics.
// NIM-gated only for embedding the request; everything else is local cosine.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as nim from './lib/nim.mjs';
import { variableContract } from './lib/variable-contract.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');
const CORPUS = path.join(WING, 'corpus', 'taste-corpus.jsonl');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const request = argv.find((a) => !a.startsWith('--') && a !== arg('--brand') && a !== arg('--k'));
function arg(f) { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; }
const brandName = arg('--brand');
const K = parseInt(arg('--k') || '5', 10);
if (!request) { console.error('usage: taste-resolve.mjs "<request>" [--brand <name>] [--k 5] [--json]'); process.exit(2); }

// cosine
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const norm = (a) => Math.sqrt(dot(a, a)) || 1;
const cos = (a, b) => dot(a, b) / (norm(a) * norm(b));
const centroid = (vs) => { const m = vs[0].map(() => 0); for (const v of vs) for (let i = 0; i < v.length; i++) m[i] += v[i] / vs.length; return m; };

// load corpus (only embedded rows)
if (!fs.existsSync(CORPUS)) { console.error('  no corpus — run crawl + embed first'); process.exit(1); }
const rows = fs.readFileSync(CORPUS, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => Array.isArray(r.embedding));
if (!rows.length) { console.error('  no embedded rows — run: node taste/scripts/embed.mjs'); process.exit(1); }

// brand profile (optional)
let brand = null;
if (brandName) {
  const bp = path.join(WING, 'brands', `${brandName}.json`);
  if (fs.existsSync(bp)) brand = JSON.parse(fs.readFileSync(bp, 'utf8'));
  else console.error(`  (brand "${brandName}" not bootstrapped — run bootstrap-brand.mjs; proceeding request-only)`);
}
const brandVec = brand?.prototype || (brand?.prototypes?.length ? centroid(brand.prototypes) : null);

// embed the request (query side)
if (!nim.hasKey()) { console.error('  NVIDIA_API_KEY not set — needed to embed the request'); process.exit(1); }
const reqVec = (await nim.embedText([request], { inputType: 'query' }))[0];

// score: request similarity, biased toward the brand prototype
const wReq = brandVec ? 0.7 : 1.0, wBrand = brandVec ? 0.3 : 0;
const scored = rows.map((r) => {
  const sReq = cos(reqVec, r.embedding);
  const sBrand = brandVec ? cos(brandVec, r.embedding) : 0;
  return { r, sReq, sBrand, score: wReq * sReq + wBrand * sBrand };
}).sort((a, b) => b.score - a.score);
const top = scored.slice(0, K);

// classification = dominant aesthetic axis among the winners
const tally = (key) => { const m = {}; for (const t of top) { const v = t.r.taste_schema?.[key]; if (v) m[v] = (m[v] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || null; };
const classification = { category: tally('aesthetic_category'), mood: tally('mood'), motion: tally('motion_language'), type: tally('type_voice') };

// suggested cluster from the winners' technique tags (light map → the left brain's handle)
const CLUSTER_HINT = [[/three|webgl|r3f|shader|3d|glsl/i, 'creative-frontend'], [/gsap|scroll|motion|parallax|animation|lenis/i, 'creative-frontend'], [/astro/i, 'astro'], [/react native|expo/i, 'react-native'], [/svg|typography|type/i, 'creative-frontend'], [/webflow|cms/i, 'frontend-web']];
const tagblob = top.flatMap((t) => t.r.tags || []).join(' ') + ' ' + top.map((t) => t.r.title).join(' ');
const cluster = CLUSTER_HINT.find(([re]) => re.test(tagblob))?.[1] || 'creative-frontend';

const directive = `Make it feel **${classification.category || 'on-corpus'}** — ${classification.mood || ''}${classification.motion ? ', ' + classification.motion + ' motion' : ''}${classification.type ? ', ' + classification.type + ' type' : ''}.` +
  (brand ? ` Conform to ${brandName}'s DNA${brand.rules?.tone ? ` (${brand.rules.tone})` : ''}${brand.rules?.techniques?.length ? `; favored techniques: ${brand.rules.techniques.slice(0, 6).join(', ')}` : ''}.` : '');

const brief = {
  request, brand: brandName || null, classification, suggested_cluster: cluster, directive,
  exemplars: top.map((t) => ({ title: t.r.title, url: t.r.url, code_url: t.r.code_url, tags: t.r.tags, axes: t.r.taste_schema, score: +t.score.toFixed(3), brand_fit: +t.sBrand.toFixed(3) })),
  ...variableContract({ classification, cluster, directive }), // the canonical variable contract taste PRODUCES (cambium hand-off)
};

if (asJson) { console.log(JSON.stringify(brief, null, 2)); process.exit(0); }

console.log(`\n  🎨 TASTE BRIEF — "${request}"${brandName ? `  ·  brand: ${brandName}` : ''}\n  ${'-'.repeat(66)}`);
console.log(`  feel: ${classification.category || '—'} · ${classification.mood || '—'} · ${classification.motion || '—'} motion · ${classification.type || '—'} type`);
console.log(`  → left brain: dispatch to  ${cluster}-orchestrator`);
console.log(`  ${'-'.repeat(66)}`);
for (const e of brief.exemplars) {
  console.log(`  ● ${e.score.toFixed(3)}${brandVec ? ` (brand ${e.brand_fit.toFixed(2)})` : ''}  ${e.title.slice(0, 50)}`);
  console.log(`      ${e.axes?.aesthetic_category || '—'} · ${e.axes?.color_story || ''} · ${(e.tags || []).slice(0, 4).join(', ')}`);
  console.log(`      code: ${e.code_url || '—'}`);
}
console.log(`  ${'-'.repeat(66)}`);
console.log(`  directive: ${directive}\n`);
