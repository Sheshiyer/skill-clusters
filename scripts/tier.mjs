#!/usr/bin/env node
// tier.mjs — tier- and hub-aware deployer for skill-clusters. PURPOSE: context debloat.
//
// Only ACTIVE clusters' orchestrators (+ cores) are symlinked into ~/.agents/skills (the dir the
// CLI scans at startup). Spokes are NOT enumerated — they stay in the repo and load on demand
// (an orchestrator routes to one; the agent Reads it via the ~/.agents/skill-clusters pointer).
// DEFERRED clusters deploy nothing until activated.
//
//   node scripts/tier.mjs --list                 # show tiers + what's deployed
//   node scripts/tier.mjs --apply                # deploy active hub+core (default granularity)
//   node scripts/tier.mjs --apply --granularity orchestrator   # leanest: orchestrators only
//   node scripts/tier.mjs --apply --granularity full           # every active-cluster skill
//   node scripts/tier.mjs --activate php-laravel --apply       # temporarily deploy a deferred cluster
//   node scripts/tier.mjs --deactivate php-laravel --apply
//   node scripts/tier.mjs --all --apply          # deploy EVERYTHING (ignore tiers; legacy)
// Add --dry-run to preview. Runs the Skills-Health gate first (fail closed).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SKILLS = path.join(REPO, 'skills');
const MANIFEST = path.join(REPO, 'skills.sh.json');
const PROFILES = path.join(REPO, 'profiles.json');
const AGENTS = path.join(os.homedir(), '.agents', 'skills');
const BACKUP = path.join(os.homedir(), '.agents', 'skills.backup');
const POINTER = path.join(os.homedir(), '.agents', 'skill-clusters'); // non-scanned -> REPO
const STATE = path.join(os.homedir(), '.agents', 'skill-clusters.activated.json');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const DRY = has('--dry-run');
const APPLY = has('--apply') && !DRY;
const ALL = has('--all');
const GRAN = opt('--granularity') || 'hub'; // hub | orchestrator | full

if (has('--help')) { console.log('see header of scripts/tier.mjs'); process.exit(0); }

const profiles = JSON.parse(fs.readFileSync(PROFILES, 'utf8')).tiers;
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const exists = (n) => fs.existsSync(path.join(SKILLS, n, 'SKILL.md'));

// handle -> {orchestrator, core, skills[]}
const clusters = {};
for (const g of manifest.groupings || []) {
  const orch = (g.skills || []).find((s) => s.endsWith('-orchestrator'));
  if (!orch) continue;
  const handle = orch.replace(/-orchestrator$/, '');
  clusters[handle] = {
    orchestrator: orch,
    core: (g.skills || []).find((s) => s === `${handle}-core`),
    skills: g.skills || [],
  };
}

// activation state (deferred clusters temporarily on)
let activated = [];
try { activated = JSON.parse(fs.readFileSync(STATE, 'utf8')).activated || []; } catch {}
if (opt('--activate')) activated = [...new Set([...activated, opt('--activate')])];
if (opt('--deactivate')) activated = activated.filter((c) => c !== opt('--deactivate'));

const tierOf = (h) => (profiles.active.includes(h) ? 'active' : profiles.deferred.includes(h) ? 'deferred' : 'untiered');
const deployedClusters = ALL
  ? Object.keys(clusters)
  : Object.keys(clusters).filter((h) => profiles.active.includes(h) || activated.includes(h));

// which skills get enumerated (symlinked) per granularity
function enumeratedFor(h) {
  const c = clusters[h];
  if (ALL || GRAN === 'full') return c.skills.filter(exists);
  if (GRAN === 'orchestrator') return [c.orchestrator].filter(exists);
  return [c.orchestrator, c.core].filter(Boolean).filter(exists); // hub
}
const target = new Set(deployedClusters.flatMap(enumeratedFor));

// --list
if (has('--list') || (!APPLY && !DRY && !has('--apply'))) {
  console.log('\n  Cluster tiers (profiles.json) — granularity: ' + GRAN + '\n  ' + '-'.repeat(54));
  for (const h of Object.keys(clusters).sort()) {
    const t = tierOf(h);
    const on = profiles.active.includes(h) || activated.includes(h);
    const act = activated.includes(h) ? ' (activated)' : '';
    console.log(`  ${on ? '●' : '○'} ${h.padEnd(22)} ${t}${act}${on ? `  → enumerates ${enumeratedFor(h).length}` : ''}`);
  }
  console.log(`  ${'-'.repeat(54)}\n  deployed clusters: ${deployedClusters.length}/${Object.keys(clusters).length} · enumerated skills: ${target.size}\n`);
  if (!has('--apply')) process.exit(0);
}

// health gate first (fail closed)
if (APPLY) {
  try { execFileSync('node', [path.join(__dirname, 'skills-health.mjs'), '--no-symlinks'], { stdio: 'ignore' }); }
  catch { console.error('✖ Skills-Health FAILED — refusing to deploy. Run `npm run health`.'); process.exit(1); }
}

// current skill-clusters symlinks in AGENTS (pointing into REPO/skills)
const current = new Set();
if (fs.existsSync(AGENTS)) {
  for (const e of fs.readdirSync(AGENTS)) {
    const p = path.join(AGENTS, e);
    try { if (fs.lstatSync(p).isSymbolicLink() && path.resolve(AGENTS, fs.readlinkSync(p)).startsWith(SKILLS)) current.add(e); } catch {}
  }
}
const toAdd = [...target].filter((s) => !current.has(s));
const toRemove = [...current].filter((s) => !target.has(s));

const run = (label, fn) => { if (APPLY) fn(); else console.log(`  [dry-run] ${label}`); };

fs.mkdirSync(AGENTS, { recursive: true });
// non-scanned pointer so orchestrators can Read spokes on demand
if (!fs.existsSync(POINTER)) run(`pointer ~/.agents/skill-clusters -> repo`, () => fs.symlinkSync(REPO, POINTER));

for (const name of toAdd) {
  const dest = path.join(AGENTS, name);
  if (fs.existsSync(dest) && !fs.lstatSync(dest).isSymbolicLink()) {
    run(`backup ${name}`, () => { fs.mkdirSync(BACKUP, { recursive: true }); fs.renameSync(dest, path.join(BACKUP, name)); });
  }
  run(`+ enumerate ${name}`, () => { try { fs.rmSync(dest, { recursive: true, force: true }); } catch {} fs.symlinkSync(path.join(SKILLS, name), dest); });
}
for (const name of toRemove) {
  const dest = path.join(AGENTS, name);
  // De-enumerate = drop the symlink only (debloat). The skill stays in the repo (on-demand for
  // active spokes; activatable for deferred clusters); any backed-up original stays preserved in
  // skills.backup. We do NOT restore it — restoring would re-bloat the scanned dir.
  run(`- de-enumerate ${name}`, () => { if (fs.lstatSync(dest).isSymbolicLink()) fs.rmSync(dest, { force: true }); });
}
if (opt('--activate') || opt('--deactivate')) run('save activation state', () => fs.writeFileSync(STATE, JSON.stringify({ activated }, null, 2)));

console.log(`\n${DRY ? '[dry-run] ' : ''}tier deploy (${GRAN}): +${toAdd.length} enumerated, -${toRemove.length} de-enumerated`);
console.log(`  deployed clusters: ${deployedClusters.length} · enumerated skills now: ${target.size} (was ${current.size})`);
console.log(`  spokes load on demand from ~/.agents/skill-clusters/skills/<name>/SKILL.md\n`);

// keep the resolution map (skill-index.json) in sync with the deployed tiers
if (APPLY) { try { execFileSync('node', [path.join(__dirname, 'gen-index.mjs')], { stdio: 'ignore' }); } catch {} }
