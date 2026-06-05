#!/usr/bin/env node
// loop-feedback.mjs — the capability-wing half of "close the loop" (Phase 5).
//
// conducty closes its loop in the vault (Failure Patterns → next Plan, narrative). PAI closes its
// loop in user-learning. This closes the SKILL-CLUSTER loop with queryable, structured data: every
// conductor cycle records which clusters it dispatched to, which tasks escalated, whether the
// classifier overrode the keyword guess, whether phantoms were rejected, and the ship verdict.
// The rollup then tells you what to change — exactly the signal the next Plan should read:
//
//   • a DEFERRED cluster used a lot           → promote it to active (profiles.json)
//   • a high classifier-OVERRIDE rate         → the keyword resolver is noisy there; retune
//   • repeated PHANTOM proposals              → a missing cluster the classifier keeps wanting
//   • a gate that fails every cycle           → a real process weak point
//
//   node scripts/loop-feedback.mjs --record --dispatch <resolve.json> [--ship <ship.json>] [--note "..."]
//   node scripts/loop-feedback.mjs --rollup            # aggregate the whole log
//   node scripts/loop-feedback.mjs --rollup --json
//
// Log: feedback/loop-log.jsonl (append-only, one cycle per line).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const LOG = path.join(REPO, 'feedback', 'loop-log.jsonl');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const opt = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function record() {
  const dispatchPath = opt('--dispatch');
  if (!dispatchPath || !fs.existsSync(dispatchPath)) { console.error('--record needs --dispatch <resolve-task --json output>'); process.exit(2); }
  const d = readJson(dispatchPath);
  const shipPath = opt('--ship');
  const ship = shipPath && fs.existsSync(shipPath) ? readJson(shipPath) : null;

  const cycle = {
    ts: new Date().toISOString(),
    tasksFile: d.tasksFile || null,
    tasks: (d.plan || []).length,
    clusters: d.touched || [],
    activated: d.activate || [],
    escalated: d.unresolved || [],
    overrides: (d.overrides || []).length,
    phantoms: (d.phantoms || []).length,
    badSkills: (d.badSkills || []).length,
    bySource: (d.plan || []).reduce((a, p) => { const s = p.source || 'keyword'; a[s] = (a[s] || 0) + 1; return a; }, {}),
    ship: ship ? { shipOk: ship.shipOk, failed: ship.failed || [] } : null,
    note: opt('--note') || null,
  };
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify(cycle) + '\n');
  console.log(`  recorded cycle — ${cycle.tasks} tasks · clusters: ${cycle.clusters.join(', ') || 'none'} · escalated: ${cycle.escalated.length} · ship: ${cycle.ship ? (cycle.ship.shipOk ? 'OK' : 'HOLD(' + cycle.ship.failed.join(',') + ')') : 'n/a'}`);
}

function rollup() {
  if (!fs.existsSync(LOG)) { console.log('  no feedback log yet (run --record first)'); process.exit(0); }
  const cycles = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const inc = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
  const clusterUse = new Map(), activations = new Map(), escalations = new Map(), gateFails = new Map();
  let tasks = 0, overrides = 0, phantoms = 0, badSkills = 0, classifier = 0, keyword = 0, ships = 0, shipOk = 0;
  for (const c of cycles) {
    tasks += c.tasks || 0; overrides += c.overrides || 0; phantoms += c.phantoms || 0; badSkills += c.badSkills || 0;
    for (const cl of c.clusters || []) inc(clusterUse, cl);
    for (const cl of c.activated || []) inc(activations, cl);
    for (const id of c.escalated || []) inc(escalations, c.tasksFile ? path.basename(path.dirname(c.tasksFile)) + ':' + id : id);
    classifier += c.bySource?.classifier || 0; keyword += c.bySource?.keyword || 0;
    if (c.ship) { ships++; if (c.ship.shipOk) shipOk++; for (const g of c.ship.failed || []) inc(gateFails, g); }
  }
  const top = (m, n = 8) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const rep = {
    cycles: cycles.length, tasks,
    clusterUse: Object.fromEntries(top(clusterUse)),
    deferredActivations: Object.fromEntries(top(activations)),
    escalationRate: tasks ? +(([...escalations.values()].reduce((a, b) => a + b, 0)) / tasks).toFixed(3) : 0,
    classifierShare: classifier + keyword ? +(classifier / (classifier + keyword)).toFixed(3) : 0,
    overrides, phantoms, badSkills,
    shipPassRate: ships ? +(shipOk / ships).toFixed(3) : null,
    gateFails: Object.fromEntries(top(gateFails)),
  };
  if (asJson) { console.log(JSON.stringify(rep, null, 2)); return; }

  console.log(`\n  Loop feedback rollup — ${rep.cycles} cycle(s), ${rep.tasks} task(s)\n  ${'-'.repeat(60)}`);
  console.log(`  cluster usage      : ${top(clusterUse).map(([k, v]) => `${k}×${v}`).join('  ') || 'none'}`);
  console.log(`  deferred activated : ${top(activations).map(([k, v]) => `${k}×${v}`).join('  ') || 'none'}  ← candidates to promote to active`);
  console.log(`  escalation rate    : ${(rep.escalationRate * 100).toFixed(1)}%  (unresolved/low-confidence → human)`);
  console.log(`  classifier share   : ${(rep.classifierShare * 100).toFixed(1)}%  · overrides ${overrides} · phantoms ${phantoms} · bad-skills ${badSkills}`);
  console.log(`  ship pass rate     : ${rep.shipPassRate === null ? 'n/a' : (rep.shipPassRate * 100).toFixed(1) + '%'}`);
  console.log(`  gates failing      : ${top(gateFails).map(([k, v]) => `${k}×${v}`).join('  ') || 'none'}  ← process weak points`);
  console.log(`  ${'-'.repeat(60)}`);
  console.log(`  → next Plan reads this: promote hot deferred clusters, retune high-override resolutions,`);
  console.log(`    add clusters the classifier keeps phantom-proposing, harden gates that keep failing.\n`);
}

if (argv.includes('--record')) record();
else rollup();   // default action
