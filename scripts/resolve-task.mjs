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
//
// Delivery modality (--modality <local|github-delivery>): the resolver also picks the EXECUTION
// path. `local` = conducty-execute dispatches loaded subagents. `github-delivery` = swarm-architect
// plans → github-next-wave-orchestrator dispatches to human/copilot-swe-agent lanes. The conductor
// proposes the modality; the resolver validates it against detected work-shape signals (issues, PRs,
// copilot, swarm/wave language) + orchestrator availability. The per-task CLUSTER (capability) is the
// same across modalities — modality decides WHO runs each task, the cluster decides WITH WHAT.
//
// Scoring (v1.5 — 5/5 on the mixed RN/Rust/Flutter/Remotion/Supabase smoke): per-task UNIQUE
// tokens, IDF-weighted (a distinctive token like "rust"/"flutter"/"remotion" beats a common one),
// sqrt-damped cluster mass (a big cluster can't win on spoke-count alone), plus an explicit
// handle-match bonus (a task that literally names a cluster prefers it). The plan.md stack is NOT
// folded into scoring — it pollutes every task toward the project's dominant stack; it's reserved
// as context for the Phase 3 classifier. Genuinely ambiguous stack-vs-domain tasks are where the
// classifier proposes and this resolver validates.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const argv = process.argv.slice(2);
const tasksPath = argv[0];
const asJson = argv.includes('--json');
// --propose <file.json | id=cluster,id=cluster>  — the classifier's per-task proposals; the
// resolver VALIDATES them (real cluster? phantom? agrees with keyword?). This is the Phase 3 line.
let proposeArg = null;
{ const i = argv.indexOf('--propose'); if (i >= 0) proposeArg = argv[i + 1]; }
// --modality <local|github-delivery>  — the conductor's PROPOSED execution modality; the resolver
// validates it against detected work-shape signals + orchestrator availability (classifier/validate).
let modalityArg = null;
{ const i = argv.indexOf('--modality'); if (i >= 0) modalityArg = argv[i + 1]; }
// plan.md = first positional after tasksPath that is neither a flag nor a consumed flag-value
const planPath = argv.slice(1).find((a) => !a.startsWith('--') && a !== proposeArg && a !== modalityArg);
if (!tasksPath || !fs.existsSync(tasksPath)) { console.error('usage: resolve-task.mjs <tasks.md> [plan.md] [--json] [--propose <file.json|id=cluster,...>] [--modality <local|github-delivery>]'); process.exit(2); }

// parse classifier proposals into id -> {cluster, skill?}
const proposals = {};
if (proposeArg) {
  if (fs.existsSync(proposeArg)) {
    const raw = JSON.parse(fs.readFileSync(proposeArg, 'utf8'));
    for (const [id, v] of Object.entries(raw)) proposals[id] = typeof v === 'string' ? { cluster: v } : v;
  } else {
    for (const pair of proposeArg.split(',')) { const [id, cl] = pair.split('='); if (id && cl) proposals[id.trim()] = { cluster: cl.trim() }; }
  }
}

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
// IDF: a token in many clusters is a weak discriminator; a token in ONE cluster (e.g. "rust",
// "flutter", "remotion", "axum") is a strong one. Without this, a big cluster (frontend-web has
// the most spokes) wins on sheer keyword mass and every task collapses onto it.
const numClusters = Object.keys(clusterKw).length || 1;
const docFreq = new Map();
for (const m of Object.values(clusterKw)) for (const t of m.keys()) docFreq.set(t, (docFreq.get(t) || 0) + 1);
const idf = (t) => Math.log(1 + numClusters / (docFreq.get(t) || numClusters));
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

function scoreTokens(tokens, weight = 1) {
  const s = {};
  for (const tk of tokens) {
    const w = idf(tk);
    // sqrt-dampen the per-token cluster mass: a cluster with five `*-auth` spokes shouldn't get
    // 5x credit for "auth" and swamp a cluster where the task's distinctive token (e.g. "rust")
    // lives. Dampening keeps the signal, kills the mass.
    for (const [cl, kw] of Object.entries(clusterKw)) if (kw.has(tk)) s[cl] = (s[cl] || 0) + Math.sqrt(kw.get(tk)) * w * weight;
  }
  return s;
}
function resolve(t) {
  // UNIQUE tokens: for routing, presence is the signal, not frequency. A task that says "auth"
  // three times (desc + path "src/auth/" + the re-tokenized path) is not 3x more that-domain than
  // one that says it once — counting it 3x lets a domain word swamp the task's actual stack ("rust").
  const ownToks = [...new Set([...tok(t.desc), ...t.paths.flatMap((p) => tok(p))])];  // the task's OWN signal
  const ownSet = new Set(ownToks);
  const scores = scoreTokens(ownToks);
  // Explicit handle match: when a task literally names a cluster (all of the handle's tokens are
  // present — "rust", "supabase", "expo", or "mobile"+"flutter"), that is the strongest signal a
  // keyword scorer gets. Prefer it over a domain token (e.g. "auth") that a big cluster has mass on.
  for (const cl of Object.keys(clusterKw)) {
    const handleToks = tok(cl);
    if (handleToks.length && handleToks.every((h) => ownSet.has(h))) scores[cl] = (scores[cl] || 0) + handleToks.reduce((a, h) => a + 2 * idf(h), 0);
  }
  // The plan.md global stack is NOT folded into scoring: this project's stack is frontend-heavy,
  // and injecting it (even as a "tiebreaker") re-inflates the big frontend cluster onto every task
  // and overrides a task that explicitly names its own tech (e.g. "rust"). A task's own tokens win.
  // stackTokens are parsed and exposed for the Phase 3 classifier to use as context, not here.
  // Fallback ONLY: a task with NO own signal at all may borrow the stack to avoid being unresolved.
  let ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length && stackTokens.length) {
    const boost = scoreTokens(stackTokens, 0.5);
    ranked = Object.entries(boost).sort((a, b) => b[1] - a[1]);
  }
  if (!ranked.length) return { cluster: null, confidence: 0 };
  const [cl, top] = ranked[0];
  const second = ranked[1]?.[1] || 0;
  return { ...describe(cl, ownToks), confidence: +(top / (top + second)).toFixed(2), score: +top.toFixed(2) };
}

// describe a cluster for dispatch (tier / activate / orchestrator / candidate spokes) — shared by
// the keyword resolver and the classifier-override path.
function describe(cl, ownToks) {
  const tier = clusterMeta[cl]?.tier || (index.skills[`${cl}-orchestrator`]?.tier || 'active');
  const spokes = Object.entries(index.skills).filter(([n, e]) => e.cluster === cl && e.role === 'spoke')
    .map(([n]) => [n, tok(n).filter((x) => ownToks.includes(x)).length]).filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
  return { cluster: cl, dispatch: `${cl}-orchestrator`, tier, activate: tier === 'deferred', spokes };
}

// is this a REAL cluster? (has an orchestrator in the index or appears in cluster meta) — phantom-proof
const realClusters = new Set([...Object.keys(clusterMeta), ...Object.keys(clusterKw)]);
const clusterIsReal = (cl) => realClusters.has(cl) || !!index.skills[`${cl}-orchestrator`];

// THE Phase 3 organ: classifier proposes, resolver VALIDATES (mirrors PAI's Capability-Name audit).
// A real proposal overrides the keyword guess; a phantom is rejected and flagged for the human.
function validate(t, kw) {
  const p = proposals[t.id];
  if (!p) return { ...kw, source: 'keyword' };
  const proposed = p.cluster;
  if (!clusterIsReal(proposed)) return { ...kw, source: 'keyword', phantom: proposed };  // reject phantom, keep keyword
  const ownToks = [...new Set([...tok(t.desc), ...t.paths.flatMap((x) => tok(x))])];
  const agreed = proposed === kw.cluster;
  const out = { ...describe(proposed, ownToks), source: 'classifier', proposed, agreed, confidence: agreed ? Math.max(kw.confidence || 0, 0.9) : 0.8, score: kw.score };
  if (!agreed && kw.cluster) out.overrode = kw.cluster;                                  // record the keyword disagreement
  if (p.skill) { out.skill = p.skill; out.skillReal = index.skills[p.skill]?.cluster === proposed; }
  return out;
}

const plan = tasks.map((t) => ({ ...t, ...validate(t, resolve(t)) }));
const touched = [...new Set(plan.map((p) => p.cluster).filter(Boolean))];
const activate = [...new Set(plan.filter((p) => p.activate).map((p) => p.cluster))];
const unresolved = plan.filter((p) => !p.cluster || p.confidence < 0.34);
const phantoms = plan.filter((p) => p.phantom).map((p) => ({ id: p.id, proposed: p.phantom }));
const overrides = plan.filter((p) => p.source === 'classifier' && p.agreed === false).map((p) => ({ id: p.id, classifier: p.cluster, keyword: p.overrode || null }));
const badSkills = plan.filter((p) => p.skill && p.skillReal === false).map((p) => ({ id: p.id, skill: p.skill, cluster: p.cluster }));

// ── Delivery modality (the swarm-architect / github-next-wave axis) ─────────────────────────────
// Two execution modalities: LOCAL subagents (conducty-execute) vs GITHUB multi-agent delivery
// (swarm-architect plans → github-next-wave dispatches to human/copilot-swe-agent lanes). The
// conductor (classifier) PROPOSES the modality via --modality; this resolver VALIDATES it against
// detected work-shape signals + the orchestrators' presence in the index. Same contract as Phase 3:
// the per-task cluster (capability loadout) is unchanged across modalities — modality decides WHO
// runs each task (a loaded subagent vs a human/Copilot lane), the cluster decides WITH WHAT.
const MODALITY = {
  'github-delivery': { plan: 'swarm-architect', execute: 'github-next-wave-orchestrator' },
  'local': { plan: 'conductor-orchestrator', execute: 'conducty-execute' },
};
const GH_SIGNAL = /\b(issues?|pull request|prs?|copilot|agent-ready|agent-blocked|swarms?|waves?|milestones?|assignee|gh api|github\.com|draft pr|merge queue|worktrees?|multi-agent|multi-squad|squads?|copilot[_-]?eligible)\b/gi;
const planText = planPath && fs.existsSync(planPath) ? fs.readFileSync(planPath, 'utf8') : '';
const ghHits = ((tasks.map((t) => t.desc).join('\n') + '\n' + planText).match(GH_SIGNAL) || []).length;
const detected = ghHits >= 3 ? 'github-delivery' : 'local';
const phantomModality = modalityArg && !MODALITY[modalityArg] ? modalityArg : null;
const chosen = (!phantomModality && modalityArg) || detected;      // validated proposal wins, else detected
const orch = MODALITY[chosen];
const modality = {
  chosen, proposed: phantomModality ? null : (modalityArg || null), detected, signals: ghHits,
  agreed: modalityArg && !phantomModality ? modalityArg === detected : null,
  phantom: phantomModality,
  orchestrators: { plan: orch.plan, execute: orch.execute, available: !!index.skills[orch.plan] && !!index.skills[orch.execute] },
};
// per-task lane hint (github-delivery only): well-scoped/copilot-flagged → copilot lane, else human.
if (chosen === 'github-delivery') {
  const COPILOT = /\bcopilot[_-]?eligible\b|\bagent-ready\b|\bwell[- ]?scoped\b/i;
  const HUMAN = /\b(secret|infra|credential|architect\w*|migration|destructive|deploy|production)\b/i;
  for (const p of plan) p.lane = COPILOT.test(p.desc) && !HUMAN.test(p.desc) ? 'copilot-swe-agent[bot]' : 'human';
}
const lanes = chosen === 'github-delivery'
  ? { human: plan.filter((p) => p.lane === 'human').length, copilot: plan.filter((p) => p.lane !== 'human').length }
  : null;

if (asJson) { console.log(JSON.stringify({ tasksFile: tasksPath, modality, lanes, touched, activate, unresolved: unresolved.map((u) => u.id), phantoms, overrides, badSkills, plan }, null, 2)); process.exit(0); }

const hasProposals = Object.keys(proposals).length > 0;
console.log(`\n  Dispatch plan — ${path.basename(path.dirname(tasksPath))}  (${plan.length} tasks${hasProposals ? ', classifier-validated' : ''})`);
const mflag = modality.phantom ? `⚠ phantom modality "${modality.phantom}" → detected fallback` : modality.agreed === false ? `⚠ proposed ${modality.proposed} ≠ detected ${modality.detected}` : '';
console.log(`  modality: ${modality.chosen}  (plan: ${modality.orchestrators.plan} · exec: ${modality.orchestrators.execute}${modality.orchestrators.available ? '' : ' ⚠MISSING'})  gh-signals:${modality.signals}  ${mflag}`);
console.log(`  ${'-'.repeat(64)}`);
for (const p of plan) {
  const flag = !p.cluster ? '⚠ UNRESOLVED' : p.confidence < 0.34 ? '⚠ low-conf' : p.activate ? '◆ activate' : '●';
  const src = p.source === 'classifier' ? (p.agreed ? '◇=' : '◇!') : '  ';   // ◇= classifier agrees · ◇! classifier overrode keyword
  const lane = p.lane ? (p.lane === 'human' ? '👤' : '🤖') : '  ';
  console.log(`  ${p.id.padEnd(5)} ${p.done ? '✓' : ' '} ${src} ${lane} ${flag.padEnd(13)} ${(p.cluster || '—').padEnd(18)} ${p.desc.slice(0, 38)}`);
  if (p.spokes?.length) console.log(`        ↳ ${p.dispatch}  spokes: ${p.spokes.join(', ')}`);
  if (p.overrode) console.log(`        ↳ classifier overrode keyword guess: ${p.overrode} → ${p.cluster}`);
  if (p.phantom) console.log(`        ⚠ phantom proposal "${p.phantom}" REJECTED (not in index) — kept keyword: ${p.cluster || '—'}`);
  if (p.skill && p.skillReal === false) console.log(`        ⚠ proposed skill "${p.skill}" not in cluster ${p.cluster}`);
}
console.log(`  ${'-'.repeat(64)}`);
console.log(`  clusters touched: ${touched.join(', ') || 'none'}`);
if (lanes) console.log(`  lanes (github-delivery): ${lanes.human} human 👤 · ${lanes.copilot} copilot 🤖  → ${modality.orchestrators.execute} dispatches via agent-ready label`);
console.log(`  DEFERRED → activate first: ${activate.length ? activate.join(', ') + '  (node scripts/tier.mjs --activate <c> --apply)' : 'none'}`);
if (hasProposals) {
  console.log(`  classifier: ${plan.filter((p) => p.source === 'classifier').length} validated · ${overrides.length} overrode keyword · ${phantoms.length} phantom rejected · ${badSkills.length} bad-skill`);
}
console.log(`  unresolved/low-confidence: ${unresolved.length}/${plan.length}  (conductor escalates these to human)\n`);
