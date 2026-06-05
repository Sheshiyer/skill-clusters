#!/usr/bin/env node
// resolve-task.mjs — the BRIDGE between spec-kit and the skill-clusters capability wing.
// Reads a spec-kit tasks.md (+ optional plan.md for stack) and emits a DISPATCH PLAN:
// each task -> {cluster, dispatch orchestrator, tier, activate?, candidate spokes, confidence}.
// This is the resolver none of spec-kit / conducty / PAI owns: spec-kit emits tasks with
// no skill binding; conducty dispatches to general-purpose; PAI triages mode/tier only.
//
//   node scripts/resolve-task.mjs <tasks.md> [plan.md] [--json]
//
// The conductor (conducty Execute) calls this per wave; the resolved orchestrator skill is
// loaded into the dispatched subagent. Deterministic + validated against skill-index.json
// (real clusters only — phantom-proof, like PAI's Capability-Name audit).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [tasksPath, ...rest] = process.argv.slice(2);
const asJson = rest.includes('--json');
const planPath = rest.find((a) => !a.startsWith('--'));
if (!tasksPath || !fs.existsSync(tasksPath)) { console.error('usage: resolve-task.mjs <tasks.md> [plan.md] [--json]'); process.exit(2); }

// load the resolution map (via the deployed pointer, else repo)
const idxPaths = [path.join(os.homedir(), '.agents/skill-clusters/skill-index.json'), path.resolve(path.dirname(new URL(import.meta.url).pathname), '../skill-index.json')];
const index = JSON.parse(fs.readFileSync(idxPaths.find(fs.existsSync), 'utf8'));

// build per-cluster keyword weights from skill names (descriptive) + handle
const STOP = new Set('the a an of to for and or in on with using build use create implement add define setup configure test review skill orchestrator core from ecc library via app via per skills'.split(' '));
const tok = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));
const clusterKw = {};           // handle -> Map(token -> weight)
const clusterOf = {};           // skill -> handle
for (const [name, e] of Object.entries(index.skills)) {
  if (!e.cluster) continue;
  clusterOf[name] = e.cluster;
  const m = (clusterKw[e.cluster] ||= new Map());
  const w = e.role === 'hub' ? 1 : 2;                       // spoke names are the signal
  for (const t of [...tok(name), ...tok(e.cluster)]) m.set(t, (m.get(t) || 0) + w);
}
const clusterMeta = index.clusters || {};

// stack hint from plan.md
let stackTokens = [];
if (planPath && fs.existsSync(planPath)) {
  const m = fs.readFileSync(planPath, 'utf8').match(/(language|framework|stack|primary depend\w*|project type)[^\n]*/gi) || [];
  stackTokens = tok(m.join(' '));
}

// parse spec-kit tasks.md grammar:  - [ ] T### [P?] [US#?] description (+ file paths)
const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
let phase = 0;
const tasks = [];
for (const ln of lines) {
  const ph = ln.match(/^#{1,4}\s+(phase\s+\d+|.*phase.*)/i); if (ph) phase++;
  const m = ln.match(/^\s*-\s*\[([ xX])\]\s*(T\d+)?\s*(\[P\])?\s*(\[[A-Z]+\d*\])?\s*(.+)$/);
  if (!m) continue;
  const desc = m[5].trim();
  const paths = (desc.match(/[\w./-]+\.[a-z]{1,5}\b/g) || []);
  tasks.push({ id: m[2] || `L${tasks.length + 1}`, done: m[1] !== ' ', parallel: !!m[3], story: (m[4] || '').replace(/[\[\]]/g, ''), wave: phase || 1, desc, paths });
}

function resolve(t) {
  const toks = [...tok(t.desc), ...t.paths.flatMap((p) => tok(p)), ...stackTokens];
  const scores = {};
  for (const tk of toks) for (const [cl, kw] of Object.entries(clusterKw)) if (kw.has(tk)) scores[cl] = (scores[cl] || 0) + kw.get(tk);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { cluster: null, confidence: 0 };
  const [cl, top] = ranked[0];
  const second = ranked[1]?.[1] || 0;
  const tier = clusterMeta[cl]?.tier || (index.skills[`${cl}-orchestrator`]?.tier || 'active');
  // candidate spokes: cluster skills whose name shares a token with the task
  const spokes = Object.entries(index.skills).filter(([n, e]) => e.cluster === cl && e.role === 'spoke')
    .map(([n]) => [n, tok(n).filter((x) => toks.includes(x)).length]).filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
  return { cluster: cl, dispatch: `${cl}-orchestrator`, tier, activate: tier === 'deferred', spokes, confidence: +(top / (top + second)).toFixed(2), score: top };
}

const plan = tasks.map((t) => ({ ...t, ...resolve(t) }));
const touched = [...new Set(plan.map((p) => p.cluster).filter(Boolean))];
const activate = [...new Set(plan.filter((p) => p.activate).map((p) => p.cluster))];
const unresolved = plan.filter((p) => !p.cluster || p.confidence < 0.34);

if (asJson) { console.log(JSON.stringify({ tasksFile: tasksPath, touched, activate, unresolved: unresolved.map((u) => u.id), plan }, null, 2)); process.exit(0); }

console.log(`\n  Dispatch plan — ${path.basename(path.dirname(tasksPath))}  (${plan.length} tasks)\n  ${'-'.repeat(64)}`);
for (const p of plan) {
  const flag = !p.cluster ? '⚠ UNRESOLVED' : p.confidence < 0.34 ? '⚠ low-conf' : p.activate ? '◆ activate' : '●';
  console.log(`  ${p.id.padEnd(5)} ${p.done ? '✓' : ' '} ${flag.padEnd(13)} ${(p.cluster || '—').padEnd(20)} ${p.desc.slice(0, 42)}`);
  if (p.spokes?.length) console.log(`        ↳ ${p.dispatch}  spokes: ${p.spokes.join(', ')}`);
}
console.log(`  ${'-'.repeat(64)}`);
console.log(`  clusters touched: ${touched.join(', ') || 'none'}`);
console.log(`  DEFERRED → activate first: ${activate.length ? activate.join(', ') + '  (node scripts/tier.mjs --activate <c> --apply)' : 'none'}`);
console.log(`  unresolved/low-confidence: ${unresolved.length}/${plan.length}  (conductor escalates these to human)\n`);
