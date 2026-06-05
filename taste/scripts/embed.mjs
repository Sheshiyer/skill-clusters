#!/usr/bin/env node
// embed.mjs — P2: turn each enriched corpus row into a vector via NIM. NIM-gated, idempotent.
//
//   node taste/scripts/embed.mjs [--limit N] [--clip] [--force]
//
// Primary signal is the TEXT of the enriched "taste document" (title + tags + the VLM taste_schema +
// excerpt) embedded with nv-embedqa — the taste_schema already carries the VLM's read of the visuals.
// --clip additionally stores an NV-CLIP image vector (row.clip) for later multi-modal fusion.
// Without a key it exits 0 with a "pending" message. Vectors live in the (git-ignored) corpus row.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nim from './lib/nim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');
const CORPUS = path.join(WING, 'corpus', 'taste-corpus.jsonl');

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const doClip = argv.includes('--clip');
const limit = parseInt((argv.indexOf('--limit') >= 0 ? argv[argv.indexOf('--limit') + 1] : '') || '0', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mimeOf = (f) => ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'image/jpeg');

// the "taste document" — what we embed: enriched text carries title + tags + the VLM's aesthetic read
const tasteDoc = (r) => [
  r.title,
  (r.tags || []).join(', '),
  r.taste_schema && !r.taste_schema._raw ? Object.values(r.taste_schema).join(', ') : '',
  r.excerpt,
].filter(Boolean).join('. ');

if (!fs.existsSync(CORPUS)) { console.error('  no corpus — run crawl-codrops.mjs first'); process.exit(1); }
const rows = fs.readFileSync(CORPUS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const todo = rows.filter((r) => force || !r.embedding);

console.log(`\n  je-ne-sais-quoi · embed (multi-modal NIM → taste vectors)`);
console.log(`  corpus: ${rows.length} · to embed: ${todo.length}${doClip ? ' (+clip)' : ''}\n  ${'-'.repeat(60)}`);

if (!nim.hasKey()) {
  console.log('  ⏸  NVIDIA_API_KEY not set — embedding PENDING. Set the key (build.nvidia.com) and re-run.\n');
  process.exit(0);
}

const withSchema = rows.filter((r) => r.taste_schema && !r.taste_schema._raw).length;
if (withSchema < rows.length) console.log(`  note: ${rows.length - withSchema}/${rows.length} rows lack taste_schema — run enrich.mjs first for best quality\n`);

let done = 0, clipped = 0, failed = 0, dim = 0;
for (const r of (limit ? todo.slice(0, limit) : todo)) {
  try {
    r.embedding = (await nim.embedText([tasteDoc(r)], { inputType: 'passage' }))[0];
    dim = r.embedding.length;
    done++;
    if (doClip && r.screenshot) {
      const fp = path.join(WING, r.screenshot);
      if (fs.existsSync(fp)) { r.clip = await nim.embedImage(fs.readFileSync(fp), mimeOf(r.screenshot)); clipped++; }
    }
    if (done % 25 === 0) console.log(`  … ${done}/${todo.length} embedded`);
  } catch (e) { failed++; console.log(`  ✗ ${r.title.slice(0, 42)} — ${e.message}`); }
  await sleep(300);
}

fs.writeFileSync(CORPUS, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log(`  ${'-'.repeat(60)}`);
console.log(`  embedded ${done} (dim ${dim})${doClip ? ` · clip ${clipped}` : ''} · failed ${failed} · total vectors: ${rows.filter((r) => r.embedding).length}/${rows.length}`);
console.log(`  next (P3): node taste/scripts/taste-resolve.mjs "<request>" --brand tryambakam-noesis  → taste brief\n`);
