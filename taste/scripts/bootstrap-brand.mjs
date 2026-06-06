#!/usr/bin/env node
// bootstrap-brand.mjs — P3: build a brand-DNA profile (prototype vector + rules) for the taste engine.
//
//   node taste/scripts/bootstrap-brand.mjs --brand <name> --docs <dir> [--sites d1,d2,...] [--spec <brand-spec.json>]
//
// Reads the brand's docs (the explicit DNA) + the tech stacks of its existing on-brand sites (the
// technique signal) and — when given --spec — the CANONICAL brand-spec (the validated contract:
// tagline, positioning, voice tone, palette/type/motion/imagery, persona, taste_seed). Composes a
// brand-DNA text, embeds it via NIM → taste/brands/<name>.json. The cold-start prototype; the
// feedback loop (P5) sharpens it from real usage. NIM-gated for embedding only.
//
// composeBrandDNA() is the pure, NIM-free core (text + rules from inputs) so it's unit-testable;
// the embedding + file write live behind the CLI main() guard.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as nim from './lib/nim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');

// Tone vocabulary for the light regex scan of free-form docs (the no-spec fallback signal).
const TONES = ['mystical', 'esoteric', 'somatic', 'sacred', 'minimal', 'brutalist', 'editorial', 'organic', 'kinetic', 'luxe', 'playful', 'ethereal', 'cinematic', 'meditative', 'ritual'];

// ── composeBrandDNA (PURE) ───────────────────────────────────────────────────────────────────────
// { brand, docText, techniques, spec } → { brandText, rules }. No I/O, no network — unit-testable.
// With a spec, the DNA is grounded in the validated contract and leads with the highest-signal tokens
// so they dominate the embedding centroid even after the 512-token chunk window. Without a spec, the
// legacy docs+techniques composition (and regex tone-scan) is preserved byte-for-byte.
export function composeBrandDNA({ brand, docText = '', techniques = [], spec = null }) {
  if (!spec) {
    const tone = TONES.filter((t) => new RegExp(`\\b${t}`, 'i').test(docText)).slice(0, 4);
    return {
      brandText: `Brand: ${brand}. Aesthetic DNA: ${docText.slice(0, 4000)}. Signature techniques: ${[...techniques].join(', ')}.`,
      rules: { tone: tone.join(', ') || null, techniques: [...techniques] },
    };
  }
  const id = spec.identity || {};
  const pos = spec.positioning || {};
  const voice = spec.voice_tokens || {};
  const vis = spec.visual_tokens || {};
  const persona = spec.persona || {};
  const seed = spec.taste_seed || {};
  const tone = (voice.tone || []).join(', ');
  const palette = vis.palette || [];
  const type = vis.type ? [vis.type.heading, vis.type.body].filter(Boolean).join(' / ') : '';
  const parts = [
    `Brand: ${id.name || brand}.`,
    id.tagline ? `Tagline: ${id.tagline}.` : '',
    pos.differentiation ? `Positioning: ${pos.differentiation}.` : '',
    pos.target_market ? `Target: ${pos.target_market}.` : '',
    tone ? `Voice: ${tone}.` : '',
    palette.length ? `Palette: ${palette.join(', ')}.` : '',
    type ? `Type: ${type}.` : '',
    vis.motion ? `Motion: ${vis.motion}.` : '',
    vis.imagery ? `Imagery: ${vis.imagery}.` : '',
    persona.who ? `Persona: ${persona.who}.` : '',
    seed.aesthetic ? `Aesthetic: ${seed.aesthetic}.` : '',
    docText ? `Aesthetic DNA: ${docText.slice(0, 3000)}.` : '',
    techniques.length ? `Signature techniques: ${[...techniques].join(', ')}.` : '',
  ].filter(Boolean);
  return {
    brandText: parts.join(' '),
    rules: {
      tone: tone || null,
      techniques: [...techniques],
      palette,
      type: type || null,
      motion: vis.motion || null,
      imagery: vis.imagery || null,
      aesthetic: seed.aesthetic || null,
    },
  };
}

// brand docs → DNA text (concat the markdown, collapse whitespace, truncate)
export function readDocs(dir) {
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

// site stacks → technique signal (the libraries on-brand sites actually ship)
const TECH = /gsap|three|@react-three|r3f|lenis|locomotive|barba|framer-motion|motion|webgl|ogl|curtains|splitting|matter-js|pixi|model-viewer|tailwind|astro|next|drei|postprocessing/i;
export function scanTechniques(sites) {
  const techniques = new Set();
  for (const s of sites) {
    const pj = path.join(s, 'package.json');
    if (!fs.existsSync(pj)) continue;
    try {
      const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
      for (const dep of Object.keys({ ...p.dependencies, ...p.devDependencies })) if (TECH.test(dep)) techniques.add(dep.replace(/^@[^/]+\//, ''));
    } catch {}
  }
  return [...techniques];
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const brand = arg('--brand');
  const docsDir = arg('--docs');
  const specPath = arg('--spec');
  const sites = (arg('--sites') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!brand || !docsDir) { console.error('usage: bootstrap-brand.mjs --brand <name> --docs <dir> [--sites d1,d2,...] [--spec <brand-spec.json>]'); process.exit(2); }

  // canonical brand-spec (optional) — the validated contract, grounds the prototype
  let spec = null;
  if (specPath) {
    if (!fs.existsSync(specPath)) { console.error(`  --spec not found: ${specPath}`); process.exit(2); }
    try { spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); }
    catch (e) { console.error(`  --spec is not valid JSON (${specPath}): ${e.message}`); process.exit(2); }
  }

  const docText = readDocs(docsDir);
  const techniques = scanTechniques(sites);
  const { brandText, rules } = composeBrandDNA({ brand, docText, techniques, spec });

  console.log(`\n  bootstrapping brand: ${brand}${spec ? '  (spec-grounded)' : ''}`);
  console.log(`  docs: ${docsDir} (${docText.length} chars) · sites: ${sites.length} · techniques: ${techniques.join(', ') || '—'} · tone: ${rules.tone || '—'}`);
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
    rules,
    spec_grounded: !!spec,
    sources: [docsDir, ...sites, ...(specPath ? [specPath] : [])],
    brand_text: brandText.slice(0, 800),
  };
  fs.mkdirSync(path.join(WING, 'brands'), { recursive: true });
  fs.writeFileSync(path.join(WING, 'brands', `${brand}.json`), JSON.stringify(profile, null, 2));
  console.log(`  ✓ wrote taste/brands/${brand}.json (prototype dim ${prototype.length}, tone "${rules.tone}")\n`);
}

// Run the CLI only when invoked directly — importing the module (e.g. from tests) must be side-effect-free.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
