#!/usr/bin/env node
// taste-feedback.mjs — P5: the feedback learning loop. The right brain learns from use.
//
//   --record --brand <b> --request "<r>" --used <url|substr,...> [--rejected <...>] [--rating good|bad]
//   --rollup [--json]
//
// On record: pull the brand prototype TOWARD the exemplars that were actually used (good) or AWAY
// (bad), harvest (anchor, positive, negative) triplets for a future contrastive/DPO fine-tune, and log
// the cycle. Brand DNA sharpens with use. No NIM needed — operates on existing corpus embeddings.
// This is the "continuously updates and informs the skills" close; pairs with loop-feedback.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');
const CORPUS = path.join(WING, 'corpus', 'taste-corpus.jsonl');
const LOG = path.join(WING, 'feedback', 'taste-log.jsonl');
const TRIPLETS = path.join(WING, 'eval', 'triplets.jsonl');
const ALPHA = 0.15;                                   // learning rate for prototype nudge

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const list = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const norm = (a) => Math.sqrt(dot(a, a)) || 1;
const unit = (a) => a.map((x) => x / norm(a));
const centroid = (vs) => vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0) / vs.length);

function loadCorpus() {
  if (!fs.existsSync(CORPUS)) { console.error('  no corpus — build it first'); process.exit(1); }
  return fs.readFileSync(CORPUS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
}
// resolve a user ref (url substring or title substring) → corpus rows
const match = (rows, ref) => rows.filter((r) => (r.url || '').includes(ref) || (r.title || '').toLowerCase().includes(ref.toLowerCase()));

function record() {
  const brand = arg('--brand');
  const request = arg('--request') || '';
  const rating = (arg('--rating') || 'good').toLowerCase();
  const usedRefs = list(arg('--used'));
  const rejRefs = list(arg('--rejected'));
  if (!brand) { console.error('  --record needs --brand'); process.exit(2); }

  const rows = loadCorpus();
  const resolveRefs = (refs) => refs.flatMap((ref) => match(rows, ref)).filter((r) => Array.isArray(r.embedding));
  const used = resolveRefs(usedRefs);
  const rejected = resolveRefs(rejRefs);

  // 1. nudge the brand prototype toward (good) / away from (bad) the used exemplars
  const bp = path.join(WING, 'brands', `${brand}.json`);
  let drift = 0;
  if (fs.existsSync(bp) && used.length) {
    const profile = JSON.parse(fs.readFileSync(bp, 'utf8'));
    const proto = profile.prototype || (profile.prototypes?.length ? centroid(profile.prototypes) : null);
    if (proto) {
      const c = centroid(used.map((r) => r.embedding));
      const next = rating === 'bad'
        ? unit(proto.map((x, i) => x - ALPHA * c[i]))               // push away
        : unit(proto.map((x, i) => (1 - ALPHA) * x + ALPHA * c[i])); // pull toward
      drift = 1 - dot(unit(proto), next);                            // cosine distance moved
      profile.prototype = next;
      profile.cycles = (profile.cycles || 0) + 1;
      fs.writeFileSync(bp, JSON.stringify(profile, null, 2));
    }
  }

  // 2. harvest triplets (anchor=request, positive=used, negative=rejected)
  fs.mkdirSync(path.dirname(TRIPLETS), { recursive: true });
  let triplets = 0;
  for (const u of used) for (const r of rejected) {
    fs.appendFileSync(TRIPLETS, JSON.stringify({ anchor: request, positive: u.url, negative: r.url, brand }) + '\n');
    triplets++;
  }

  // 3. log the cycle
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  const cycle = { ts: new Date().toISOString(), brand, request, rating, used: used.map((r) => r.url), rejected: rejected.map((r) => r.url), triplets, drift: +drift.toFixed(4) };
  fs.appendFileSync(LOG, JSON.stringify(cycle) + '\n');

  console.log(`  ◈ recorded — brand ${brand} · ${rating} · used ${used.length} · rejected ${rejected.length} · prototype drift ${drift.toFixed(4)} · +${triplets} triplet(s)`);
  if (!used.length) console.log('    (no used exemplars matched — prototype unchanged; pass --used <url substring>)');
}

function rollup() {
  if (!fs.existsSync(LOG)) { console.log('  no taste feedback yet (run --record first)'); process.exit(0); }
  const cycles = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const byBrand = {};
  let triplets = 0, good = 0, bad = 0, drift = 0;
  for (const c of cycles) {
    (byBrand[c.brand] ||= { cycles: 0, drift: 0 }); byBrand[c.brand].cycles++; byBrand[c.brand].drift += c.drift || 0;
    triplets += c.triplets || 0; drift += c.drift || 0; c.rating === 'bad' ? bad++ : good++;
  }
  const tripletTotal = fs.existsSync(TRIPLETS) ? fs.readFileSync(TRIPLETS, 'utf8').split('\n').filter(Boolean).length : 0;
  const rep = { cycles: cycles.length, good, bad, brands: byBrand, triplets_logged: triplets, triplets_total: tripletTotal, avg_drift: cycles.length ? +(drift / cycles.length).toFixed(4) : 0 };
  if (asJson) { console.log(JSON.stringify(rep, null, 2)); return; }
  console.log(`\n  Taste feedback rollup — ${rep.cycles} cycle(s) · ${good}👍 / ${bad}👎\n  ${'-'.repeat(56)}`);
  for (const [b, v] of Object.entries(byBrand)) console.log(`  ${b.padEnd(22)} ${v.cycles} cycle(s) · total prototype drift ${v.drift.toFixed(3)}`);
  console.log(`  triplets harvested : ${tripletTotal}  ${tripletTotal >= 200 ? '← enough to fine-tune the embedder (contrastive/DPO)' : '(need ~200 to graduate to a fine-tune)'}`);
  console.log(`  ${'-'.repeat(56)}`);
  console.log(`  → next: hot brands sharpen their prototype automatically; once triplets ≥ 200, fine-tune`);
  console.log(`    nv-embedqa on them, and distill stable brand rules into the cluster *-core (write-back).\n`);
}

if (argv.includes('--record')) record();
else rollup();
