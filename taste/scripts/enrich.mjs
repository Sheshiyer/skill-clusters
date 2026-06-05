#!/usr/bin/env node
// enrich.mjs — fill each corpus row's taste_schema via the NIM VLM (NIM-gated, idempotent).
//
//   NVIDIA_API_KEY=... node taste/scripts/enrich.mjs [--limit N] [--force]
//
// Without a key it exits 0 with a clear "pending" message — the crawled corpus is already valid;
// enrichment just activates when the key is present. With --force it re-annotates rows that already
// have a taste_schema. Rate-limited and polite.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nim from './lib/nim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');
const CORPUS = path.join(WING, 'corpus', 'taste-corpus.jsonl');

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const limit = parseInt((argv.indexOf('--limit') >= 0 ? argv[argv.indexOf('--limit') + 1] : '') || '0', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mimeOf = (f) => ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'image/jpeg');

if (!fs.existsSync(CORPUS)) { console.error('  no corpus yet — run crawl-codrops.mjs first'); process.exit(1); }
const rows = fs.readFileSync(CORPUS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const todo = rows.filter((r) => r.screenshot && (force || !r.taste_schema));

console.log(`\n  je-ne-sais-quoi · enrich (VLM taste schema)`);
console.log(`  corpus: ${rows.length} rows · to enrich: ${todo.length}${force ? ' (--force)' : ''}\n  ${'-'.repeat(60)}`);

if (!nim.hasKey()) {
  console.log('  ⏸  NVIDIA_API_KEY not set — enrichment PENDING (not an error).');
  console.log('     The crawled corpus is valid; set NVIDIA_API_KEY (build.nvidia.com) and re-run');
  console.log('     to fill taste_schema. Model override: NIM_VLM_MODEL (default meta/llama-3.2-90b-vision-instruct).\n');
  process.exit(0);
}

// checkpoint incrementally so a kill (session suspend) never loses more than ~10 rows;
// enrich is idempotent (skips rows with taste_schema), so a re-run resumes cleanly.
const save = () => fs.writeFileSync(CORPUS, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
process.on('SIGINT', () => { save(); console.log('\n  ⓘ checkpointed on interrupt — re-run to resume'); process.exit(130); });
process.on('SIGTERM', () => { save(); process.exit(143); });

let done = 0, failed = 0, since = 0;
for (const r of (limit ? todo.slice(0, limit) : todo)) {
  const fp = path.join(WING, r.screenshot);
  if (!fs.existsSync(fp)) { console.log(`  · ${path.basename(r.screenshot)}: image missing, skip`); continue; }
  try {
    r.taste_schema = await nim.vlmAnnotate(fs.readFileSync(fp), mimeOf(r.screenshot));
    done++; since++;
    console.log(`  ✓ ${(r.taste_schema.aesthetic_category || '—').padEnd(22).slice(0, 22)} ${r.title.slice(0, 40)}`);
  } catch (e) { failed++; console.log(`  ✗ ${r.title.slice(0, 40)} — ${e.message}`); }
  if (since >= 10) { save(); since = 0; }   // checkpoint every 10
  await sleep(500);
}
save();
console.log(`  ${'-'.repeat(60)}`);
console.log(`  enriched ${done} · failed ${failed} · total with schema: ${rows.filter((r) => r.taste_schema).length}/${rows.length}`);
console.log(`  next (P2): node taste/scripts/embed.mjs → multi-modal NIM vectors → taste index\n`);
