#!/usr/bin/env node
// budget-report.mjs — per-venture budget dashboard over the governor's accumulated spend (#32).
//
// The governor (taste/scripts/lib/governor.mjs) tracks spend per venture and pauses at the cap;
// this is the read-side view of that state — a flat table you can print in CI or a dashboard to see,
// at a glance, which ventures are healthy, approaching their cap, or already over.
//
//   node scripts/budget-report.mjs <spend.json> [caps.json]
//
//   spend.json   { "<venture>": <number spent> }
//   caps.json    { "<venture>": <number cap> }   (optional; missing ventures read as uncapped)
//
// Pure core (budgetReport) so it's trivially testable; the CLI is a thin JSON-in / table-out shell.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Project per-venture spend against caps into a status table.
 *
 * status:
 *   'uncapped' — no cap declared for the venture (pct/cap are null; excluded from counts)
 *   'over'     — pct >= 1 (at or beyond the cap; a zero cap means any spend is over)
 *   'warn'     — warnAt <= pct < 1
 *   'ok'       — pct < warnAt
 *
 * @param {Record<string, number>} spend  venture -> amount spent
 * @param {{ caps?: Record<string, number>, warnAt?: number }} [opts]
 * @returns {{ ventures: Array<{venture:string, spent:number, cap:number|null, pct:number|null, status:string}>, overCount:number, warnCount:number }}
 */
export function budgetReport(spend = {}, { caps = {}, warnAt = 0.8 } = {}) {
  const ventures = [];
  let overCount = 0;
  let warnCount = 0;

  for (const venture of Object.keys(spend)) {
    const spent = spend[venture];
    const hasCap = Object.prototype.hasOwnProperty.call(caps, venture) && Number.isFinite(caps[venture]);

    if (!hasCap) {
      ventures.push({ venture, spent, cap: null, pct: null, status: 'uncapped' });
      continue;
    }

    const cap = caps[venture];
    // A zero (or negative) cap is a hard "no budget": any spend is at/over it. Treat pct as >=1
    // rather than dividing by zero (which would yield Infinity/NaN).
    const pct = cap > 0 ? round(spent / cap) : (spent >= 0 ? 1 : 0);

    let status;
    if (pct >= 1) { status = 'over'; overCount++; }
    else if (pct >= warnAt) { status = 'warn'; warnCount++; }
    else { status = 'ok'; }

    ventures.push({ venture, spent, cap, pct, status });
  }

  return { ventures, overCount, warnCount };
}

// round to 4 decimals so the ratio is stable/displayable without float noise.
function round(n) {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function readJson(p) {
  return JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
}

function formatTable({ ventures, overCount, warnCount }, warnAt) {
  const icon = { ok: '✓', warn: '⚠', over: '✗', uncapped: '·' };
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [];
  lines.push('');
  lines.push(`  Budget report — ${ventures.length} venture(s), warn at ${Math.round(warnAt * 100)}%`);
  lines.push('  ' + '-'.repeat(64));
  lines.push(`  ${pad('', 2)}${pad('venture', 22)}${pad('spent', 12)}${pad('cap', 12)}${pad('pct', 8)}status`);
  lines.push('  ' + '-'.repeat(64));
  for (const v of ventures) {
    const pctStr = v.pct == null ? '—' : `${Math.round(v.pct * 100)}%`;
    lines.push(
      `  ${pad(icon[v.status] || '?', 2)}${pad(v.venture, 22)}${pad(v.spent, 12)}${pad(v.cap == null ? '—' : v.cap, 12)}${pad(pctStr, 8)}${v.status}`,
    );
  }
  lines.push('  ' + '-'.repeat(64));
  lines.push(`  ${overCount} over · ${warnCount} warn · ${ventures.length - overCount - warnCount - ventures.filter((v) => v.status === 'uncapped').length} ok · ${ventures.filter((v) => v.status === 'uncapped').length} uncapped`);
  lines.push('');
  return lines.join('\n');
}

function usage() {
  return 'Usage: node scripts/budget-report.mjs <spend.json> [caps.json] [--json] [--warn-at <0..1>]';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const warnAtIdx = argv.indexOf('--warn-at');
  const warnAt = warnAtIdx >= 0 ? parseFloat(argv[warnAtIdx + 1]) : 0.8;
  const positional = argv.filter((a, i) => !a.startsWith('--') && !(warnAtIdx >= 0 && i === warnAtIdx + 1));

  const spendPath = positional[0];
  const capsPath = positional[1];

  if (!spendPath) {
    console.error(usage());
    process.exit(2);
  }

  let spend, caps;
  try {
    spend = readJson(spendPath);
    caps = capsPath ? readJson(capsPath) : {};
  } catch (e) {
    console.error(`budget-report: ${e.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (!Number.isFinite(warnAt) || warnAt < 0 || warnAt > 1) {
    console.error('budget-report: --warn-at must be a number in [0,1]');
    process.exit(2);
  }

  const report = budgetReport(spend, { caps, warnAt });
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatTable(report, warnAt));
  }
  // Non-zero when any venture is over budget, so this can gate a pipeline if desired.
  process.exit(report.overCount > 0 ? 1 : 0);
}
