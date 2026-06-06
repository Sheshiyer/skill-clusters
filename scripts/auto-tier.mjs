#!/usr/bin/env node
// auto-tier.mjs — suggest cluster tier changes (active <-> deferred) from dispatch usage (#38).
//
// tier.mjs APPLIES tiers (symlinks the active clusters' hubs into the scanned dir). This script does
// NOT apply anything — it only looks at how clusters have actually been dispatched and SUGGESTS:
//   • activate  — a DEFERRED cluster that was used recently (it's paying rent; promote it)
//   • defer     — an ACTIVE cluster that has been idle past a threshold (it's bloating context; demote it)
// The operator (or tier.mjs --activate/--deactivate) acts on the suggestion. Keeping suggest and apply
// separate means this stays pure and the destructive symlink work stays in one audited place.
//
//   node scripts/auto-tier.mjs <usage.json> [skill-index.json]
//
//   usage.json        [{ "cluster": "<handle>", "ts": <epoch ms> }, ...]  (dispatch events)
//   skill-index.json  the canonical index; its `.clusters` map ({handle: {tier}}) is read.
//
// Pure core (suggestTiers) with an injected `now`, so "recent" / "idle" are deterministic under test.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Suggest tier flips from dispatch usage. Suggests only — never mutates anything.
 *
 * @param {Array<{cluster:string, ts:number}>} usage  dispatch events (epoch ms)
 * @param {{ index: Record<string, {tier:string}>, idleDefer?: number, recentActivate?: number, now?: number }} opts
 *   index          cluster -> { tier: 'active' | 'deferred' }  (the skill-index clusters map)
 *   idleDefer      days of inactivity after which an ACTIVE cluster is a defer candidate (default 30)
 *   recentActivate days within which usage counts as "recent" for a DEFERRED cluster (default 1)
 *   now            current time in epoch ms (injected for determinism)
 * @returns {{ activate: string[], defer: string[] }}
 */
export function suggestTiers(usage = [], { index = {}, idleDefer = 30, recentActivate = 1, now = Date.now() } = {}) {
  // Most-recent dispatch timestamp per cluster.
  const lastSeen = new Map();
  for (const ev of usage) {
    if (!ev || typeof ev.cluster !== 'string' || !Number.isFinite(ev.ts)) continue;
    const prev = lastSeen.get(ev.cluster);
    if (prev === undefined || ev.ts > prev) lastSeen.set(ev.cluster, ev.ts);
  }

  const idleDeferMs = idleDefer * DAY_MS;
  const recentActivateMs = recentActivate * DAY_MS;

  const activate = [];
  const defer = [];

  // Drive off the index so we only ever suggest for known clusters (usage for unknown clusters is
  // ignored), and so an ACTIVE cluster with zero dispatches is still considered (idle forever → defer).
  for (const cluster of Object.keys(index)) {
    const tier = index[cluster] && index[cluster].tier;
    const seen = lastSeen.get(cluster); // may be undefined (never dispatched)
    const idleMs = seen === undefined ? Infinity : now - seen;

    if (tier === 'deferred') {
      // Promote a deferred cluster only if it was used within the recent window.
      if (seen !== undefined && idleMs <= recentActivateMs) activate.push(cluster);
    } else if (tier === 'active') {
      // Demote an active cluster that has been idle for at least idleDefer days
      // (includes never-dispatched active clusters: idleMs === Infinity).
      if (idleMs >= idleDeferMs) defer.push(cluster);
    }
  }

  return { activate, defer };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function readJson(p) {
  return JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
}

function usage() {
  return 'Usage: node scripts/auto-tier.mjs <usage.json> [skill-index.json] [--json] [--idle-defer <days>] [--recent-activate <days>]';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const numOpt = (flag, dflt) => { const i = argv.indexOf(flag); return i >= 0 ? Number(argv[i + 1]) : dflt; };
  const idleDefer = numOpt('--idle-defer', 30);
  const recentActivate = numOpt('--recent-activate', 1);

  const flagsWithValue = new Set(['--idle-defer', '--recent-activate']);
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { if (flagsWithValue.has(a)) i++; continue; }
    positional.push(a);
  }

  const usagePath = positional[0];
  const indexPath = positional[1] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skill-index.json');

  if (!usagePath) {
    console.error(usage());
    process.exit(2);
  }

  let events, indexFile;
  try {
    events = readJson(usagePath);
    indexFile = readJson(indexPath);
  } catch (e) {
    console.error(`auto-tier: ${e.message}`);
    console.error(usage());
    process.exit(2);
  }

  const index = indexFile.clusters || indexFile; // accept the whole skill-index or a bare clusters map
  const result = suggestTiers(events, { index, idleDefer, recentActivate, now: Date.now() });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log(`  Auto-tier suggestions — idle-defer ${idleDefer}d · recent-activate ${recentActivate}d`);
    console.log('  ' + '-'.repeat(54));
    console.log(`  ↑ activate (deferred, recently used): ${result.activate.length ? result.activate.join(', ') : '(none)'}`);
    console.log(`  ↓ defer    (active, idle):            ${result.defer.length ? result.defer.join(', ') : '(none)'}`);
    console.log('  ' + '-'.repeat(54));
    console.log('  apply with: node scripts/tier.mjs --activate <c> --apply   /   --deactivate <c> --apply');
    console.log('');
  }
  process.exit(0);
}
