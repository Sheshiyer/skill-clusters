#!/usr/bin/env node
// bootstrap-brand.mjs — P3: build a brand-DNA profile (prototype vector + rules) for the taste engine.
//
//   node taste/scripts/bootstrap-brand.mjs --brand <name> --docs <dir> [--sites <dir1,dir2,...>]
//
// Reads the brand's docs (the explicit DNA) + the tech stacks of its existing on-brand sites (the
// technique signal), composes a brand-DNA text, embeds it via NIM → taste/brands/<name>.json. This
// is the cold-start prototype; the feedback loop (P5) sharpens it from real usage. NIM-gated.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nim from './lib/nim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const brand = arg('--brand');
const docsDir = arg('--docs');
const sites = (arg('--sites') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!brand || !docsDir) { console.error('usage: bootstrap-brand.mjs --brand <name> --docs <dir> [--sites d1,d2,...]'); process.exit(2); }

// 1. brand docs → DNA text (concat the markdown, truncate)
function readDocs(dir) {
  const out = [];
  const walk = (d, depth = 0) => {
    if (depth > 3) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(md|txt|mdx)$/i.test(e.name)) { try { out.push(fs.readFileSync(p, 'utf8')); } catch {} }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out.join('\n\n').replace(/\s+/g, ' ').slice(0, 6000);
}
const docText = readDocs(docsDir);

// 2. site stacks → technique signal
const TECH = /gsap|three|@react-three|r3f|lenis|locomotive|barba|framer-motion|motion|webgl|ogl|curtains|splitting|matter-js|pixi|model-viewer|tailwind|astro|next|drei|postprocessing/i;
const techniques = new Set();
for (const s of sites) {
  const pj = path.join(s, 'package.json');
  if (!fs.existsSync(pj)) continue;
  try {
    const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
    for (const dep of Object.keys({ ...p.dependencies, ...p.devDependencies })) if (TECH.test(dep)) techniques.add(dep.replace(/^@[^/]+\//, ''));
  } catch {}
}

// 3. tone keywords (light scan of the docs)
const TONES = ['mystical', 'esoteric', 'somatic', 'sacred', 'minimal', 'brutalist', 'editorial', 'organic', 'kinetic', 'luxe', 'playful', 'ethereal', 'cinematic', 'meditative', 'ritual'];
const tone = TONES.filter((t) => new RegExp(`\\b${t}`, 'i').test(docText)).slice(0, 4);

// 4. compose brand-DNA text + embed → prototype
const brandText = `Brand: ${brand}. Aesthetic DNA: ${docText.slice(0, 4000)}. Signature techniques: ${[...techniques].join(', ')}.`;
console.log(`\n  bootstrapping brand: ${brand}`);
console.log(`  docs: ${docsDir} (${docText.length} chars) · sites: ${sites.length} · techniques: ${[...techniques].join(', ') || '—'} · tone: ${tone.join(', ') || '—'}`);
if (!nim.hasKey()) { console.error('\n  NVIDIA_API_KEY not set — needed to embed the brand DNA. Set it and re-run.\n'); process.exit(0); }

// chunk the brand DNA (the embedder caps at 512 tokens) and average → a richer prototype than truncating
const CHUNK = 800;   // ~365 tokens — safely under the embedder's 512-token cap (token-dense docs)
const chunks = [];
for (let i = 0; i < brandText.length && chunks.length < 12; i += CHUNK) chunks.push(brandText.slice(i, i + CHUNK));
const vecs = await nim.embedText(chunks, { inputType: 'passage' });
const prototype = vecs[0].map((_, i) => vecs.reduce((s, v) => s + v[i], 0) / vecs.length);
console.log(`  embedded ${chunks.length} brand-DNA chunk(s) → centroid prototype`);
const profile = {
  brand,
  prototype,
  rules: { tone: tone.join(', ') || null, techniques: [...techniques] },
  sources: [docsDir, ...sites],
  brand_text: brandText.slice(0, 800),
};
fs.mkdirSync(path.join(WING, 'brands'), { recursive: true });
fs.writeFileSync(path.join(WING, 'brands', `${brand}.json`), JSON.stringify(profile, null, 2));
console.log(`  ✓ wrote taste/brands/${brand}.json (prototype dim ${prototype.length}, tone "${profile.rules.tone}")\n`);
