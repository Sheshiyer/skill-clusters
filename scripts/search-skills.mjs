#!/usr/bin/env node
// search-skills.mjs — local skill discovery over skill-index.json + skills.sh.json.
// Complements skills.sh (`npx skills find`) which searches the public ecosystem;
// this searches YOUR installed skill-clusters map (phantom-proof, tier-aware).
//
//   node scripts/search-skills.mjs <query> [--json] [--limit 12] [--cluster design]
//   node scripts/search-skills.mjs --stage assets --workflow website-delivery
//   node scripts/search-skills.mjs --validate-workflow website-delivery
//
// Used by: WorkflowSuggest.hook.ts, resolve-task adjacent tooling, operator CLI.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const HOME = os.homedir();
const INDEX_PATHS = [
  path.join(HOME, '.agents/skill-clusters/skill-index.json'),
  path.join(REPO, 'skill-index.json'),
];
const REGISTRY_PATHS = [
  path.join(HOME, '.agents/skill-clusters/workflows/registry.json'),
  path.join(REPO, 'workflows/registry.json'),
];
const MANIFEST_PATHS = [
  path.join(HOME, '.agents/skill-clusters/skills.sh.json'),
  path.join(REPO, 'skills.sh.json'),
];

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const getOpt = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const limit = Number(getOpt('--limit') || 12);
const onlyCluster = getOpt('--cluster');
const stageId = getOpt('--stage');
const workflowId = getOpt('--workflow') || 'website-delivery';
const validateWf = argv.includes('--validate-workflow') ? (getOpt('--validate-workflow') || workflowId) : null;
const query = argv.filter((a) => !a.startsWith('--') && a !== getOpt('--limit') && a !== onlyCluster && a !== stageId && a !== workflowId && a !== getOpt('--validate-workflow')).join(' ').trim();

function loadJson(paths) {
  const p = paths.find((x) => fs.existsSync(x));
  if (!p) throw new Error(`missing file among ${paths.join(' | ')}`);
  return { path: p, data: JSON.parse(fs.readFileSync(p, 'utf8')) };
}

function tokens(s) {
  return (String(s).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1);
}

function expandHome(p) {
  if (!p) return p;
  return p.startsWith('~/') ? path.join(HOME, p.slice(2)) : p;
}

/** Score a skill against query tokens using name, cluster, status, path. */
function scoreSkill(name, entry, qTokens) {
  if (!qTokens.length) return 0;
  const hay = tokens([name, entry.cluster || '', entry.role || '', entry.status || '', entry.path || ''].join(' '));
  let score = 0;
  for (const t of qTokens) {
    if (name.toLowerCase() === t) score += 50;
    else if (name.toLowerCase().includes(t)) score += 20;
    if (entry.cluster === t) score += 15;
    if (hay.includes(t)) score += 5;
  }
  if (entry.role === 'hub') score += 3;
  if (entry.status === 'active-hub' || entry.status === 'active-spoke') score += 2;
  if (entry.enumerated) score += 1;
  return score;
}

function searchLocal(index, q, { cluster = null, limit = 12 } = {}) {
  const qTokens = tokens(q);
  const rows = [];
  for (const [name, e] of Object.entries(index.skills || {})) {
    if (cluster && e.cluster !== cluster) continue;
    const score = scoreSkill(name, e, qTokens);
    if (score <= 0 && qTokens.length) continue;
    if (!qTokens.length && cluster && e.cluster === cluster) {
      rows.push({ name, score: e.role === 'hub' ? 10 : 1, ...e });
      continue;
    }
    if (score > 0) rows.push({ name, score, ...e });
  }
  rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return rows.slice(0, limit);
}

/** Resolve a workflow stage's declared skills against the index; drop phantoms; prefer hubs. */
function resolveStageSkills(index, skillNames = []) {
  const resolved = [];
  const missing = [];
  for (const name of skillNames) {
    const e = index.skills?.[name];
    if (!e) {
      missing.push(name);
      continue;
    }
    const orch = e.cluster ? `${e.cluster}-orchestrator` : null;
    const orchEntry = orch && index.skills?.[orch] ? index.skills[orch] : null;
    resolved.push({
      name,
      cluster: e.cluster,
      status: e.status,
      role: e.role,
      path: expandHome(e.path),
      enumerated: !!e.enumerated,
      activate: e.activate || null,
      dispatch: orchEntry ? orch : (e.role === 'hub' ? name : null),
      dispatch_path: orchEntry ? expandHome(orchEntry.path) : (e.role === 'hub' ? expandHome(e.path) : null),
    });
  }
  return { resolved, missing };
}

function loadWorkflow(registry, id) {
  return (registry.workflows || []).find((w) => w.id === id) || null;
}

function resolveWorkflow(index, registry, id) {
  const wf = loadWorkflow(registry, id);
  if (!wf) return { error: `unknown workflow: ${id}` };
  const stages = [];
  const allMissing = [];
  for (const st of wf.stages || []) {
    const { resolved, missing } = resolveStageSkills(index, st.skills || []);
    allMissing.push(...missing.map((m) => ({ stage: st.id, skill: m })));
    // Also attach cluster orchestrators unique to this stage
    const clusters = [...new Set(resolved.map((r) => r.cluster).filter(Boolean))];
    const hubs = clusters.map((c) => {
      const h = index.skills?.[`${c}-orchestrator`];
      return h
        ? { name: `${c}-orchestrator`, cluster: c, status: h.status, path: expandHome(h.path), activate: h.activate || null }
        : null;
    }).filter(Boolean);

    stages.push({
      id: st.id,
      label: st.label,
      skills: resolved,
      hubs,
      missing,
    });
  }
  return {
    id: wf.id,
    title: wf.title,
    doc: expandHome(wf.doc),
    plan_template: expandHome(wf.plan_template),
    first_action: wf.first_action,
    stages,
    missing: allMissing,
    ok: allMissing.length === 0,
  };
}

// --- main ---
try {
  const { data: index } = loadJson(INDEX_PATHS);

  if (validateWf || stageId) {
    const { data: registry } = loadJson(REGISTRY_PATHS);
    const resolved = resolveWorkflow(index, registry, validateWf || workflowId);
    if (stageId && resolved.stages) {
      const st = resolved.stages.find((s) => s.id === stageId || s.id.endsWith(stageId) || s.id.includes(stageId));
      if (asJson) console.log(JSON.stringify(st || { error: 'stage not found' }, null, 2));
      else if (!st) console.log('stage not found');
      else {
        console.log(`# ${st.id} — ${st.label}`);
        console.log('hubs:', st.hubs.map((h) => h.name).join(', ') || '(none)');
        for (const s of st.skills) {
          console.log(`  ${s.name.padEnd(36)} ${s.status.padEnd(16)} → ${s.dispatch || 'Read path'}`);
        }
        if (st.missing.length) console.log('MISSING (phantom):', st.missing.join(', '));
      }
    } else if (asJson) {
      console.log(JSON.stringify(resolved, null, 2));
    } else {
      console.log(`workflow ${resolved.id} · ${resolved.ok ? 'OK' : 'HAS PHANTOMS'} · stages ${resolved.stages?.length || 0}`);
      for (const st of resolved.stages || []) {
        console.log(`  ${st.id}: ${(st.skills || []).map((s) => s.name).join(', ')}${st.missing.length ? '  ⚠ missing ' + st.missing.join(',') : ''}`);
      }
      if (resolved.missing?.length) {
        console.log('phantoms:', resolved.missing.map((m) => `${m.stage}/${m.skill}`).join(', '));
        console.log('hint: search local index or `npx skills find <query>` then import into skill-clusters');
      }
    }
    process.exit(resolved.ok === false ? 1 : 0);
  }

  if (!query && !onlyCluster) {
    console.error('usage: search-skills.mjs <query> [--json] [--limit N] [--cluster design]');
    console.error('       search-skills.mjs --validate-workflow website-delivery');
    console.error('       search-skills.mjs --stage assets --workflow website-delivery');
    process.exit(2);
  }

  const hits = searchLocal(index, query || '', { cluster: onlyCluster, limit });
  if (asJson) {
    console.log(JSON.stringify({ query, cluster: onlyCluster, count: hits.length, hits }, null, 2));
  } else {
    console.log(`# local skill-clusters search: ${query || '(cluster list)'} ${onlyCluster ? `[${onlyCluster}]` : ''}`);
    console.log(`# ${hits.length} hits · source skill-index.json · public gaps: npx skills find "${query}"`);
    for (const h of hits) {
      const act = h.activate ? ` · activate: ${h.activate}` : '';
      console.log(`${String(h.score).padStart(3)}  ${h.name.padEnd(40)} ${(h.cluster || '-').padEnd(18)} ${h.status}${act}`);
      console.log(`     ${h.path}`);
    }
    if (!hits.length) {
      console.log('(no local hits)');
      console.log(`try: npx skills find ${JSON.stringify(query)}`);
    }
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(2);
}
