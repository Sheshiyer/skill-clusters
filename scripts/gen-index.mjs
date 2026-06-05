#!/usr/bin/env node
// gen-index.mjs — generate skill-index.json: the canonical "where is skill X" map that the
// harness, hooks, and PAI orchestration consult to resolve any skill reference. Built from
// skills.sh.json (clusters) + profiles.json (tiers) + ~/.agents/skills-archive/.archived.json.
//
// status values:
//   active-hub    — active cluster's orchestrator/core; ENUMERATED at startup
//   active-spoke  — active cluster's spoke; loads on demand (repo via ~/.agents/skill-clusters)
//   deferred-hub  — deferred cluster's orchestrator/core; activate to enumerate
//   deferred-spoke— deferred cluster's spoke; activate the cluster
//   archived      — moved out of the scanned dir, not in any cluster (bundles/one-offs)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const man = JSON.parse(fs.readFileSync(path.join(REPO, 'skills.sh.json'), 'utf8'));
const prof = JSON.parse(fs.readFileSync(path.join(REPO, 'profiles.json'), 'utf8')).tiers;
let archived = [];
try { archived = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.agents', 'skills-archive', '.archived.json'), 'utf8')).archived || []; } catch {}

const tierOf = (h) => (prof.active.includes(h) ? 'active' : prof.deferred.includes(h) ? 'deferred' : 'active');
const POINTER = '~/.agents/skill-clusters';
const ARCHIVE = '~/.agents/skills-archive';

const skills = {};
const clusters = {};
for (const g of man.groupings || []) {
  const orch = (g.skills || []).find((s) => s.endsWith('-orchestrator'));
  if (!orch) continue;
  const handle = orch.replace(/-orchestrator$/, '');
  const tier = tierOf(handle);
  clusters[handle] = { tier, title: g.title, orchestrator: orch, core: `${handle}-core`, spokeCount: (g.skills || []).length - 2 };
  for (const s of g.skills || []) {
    const isHub = s === orch || s === `${handle}-core`;
    const status = `${tier}-${isHub ? 'hub' : 'spoke'}`;
    // first cluster wins for shared skills; prefer the one whose handle prefixes the name
    if (!skills[s] || s.startsWith(handle + '-') || s === handle) {
      skills[s] = {
        cluster: handle, tier, role: isHub ? 'hub' : 'spoke', status,
        enumerated: status === 'active-hub',
        path: `${POINTER}/skills/${s}/SKILL.md`,
        activate: tier === 'deferred' ? `node scripts/tier.mjs --activate ${handle} --apply` : null,
      };
    }
  }
}
// archived-only skills (not in any cluster)
for (const name of archived) {
  if (skills[name]) continue; // already resolved via a cluster (its original was archived)
  skills[name] = { cluster: null, tier: 'archived', role: null, status: 'archived', enumerated: false, path: `${ARCHIVE}/${name}`, restore: `node scripts/archive-library.mjs --restore --apply` };
}

const counts = { total_indexed: Object.keys(skills).length, clusters: Object.keys(clusters).length };
for (const s of Object.values(skills)) counts[s.status] = (counts[s.status] || 0) + 1;

const index = {
  $comment: 'Canonical skill resolution map for the harness/hooks/PAI. Regenerate with: node scripts/gen-index.mjs',
  resolutionOrder: [
    '1. active-hub  → already enumerated; invoke directly',
    '2. active-spoke → Read its `path` on demand, or invoke its cluster orchestrator',
    '3. deferred-*  → run its `activate` command to enumerate the cluster, then invoke',
    '4. archived    → run its `restore` command, or Read its `path` directly',
  ],
  pointer: POINTER,
  archive: ARCHIVE,
  counts,
  clusters,
  skills,
};
fs.writeFileSync(path.join(REPO, 'skill-index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`skill-index.json: ${counts.total_indexed} skills across ${counts.clusters} clusters`);
console.log(`  ` + Object.entries(counts).filter(([k]) => k.includes('-') || k === 'archived').map(([k, v]) => `${k}:${v}`).join('  '));
