// brandmint-reroll-flow.test.mjs — runBrandKit's OPTIONAL self-correcting (reroll) path.
//
// Wiring the auto-reroll loop INTO the main flow: runBrandKit({…, reroll}) — when `reroll` is set,
// the image step routes through rerollImages (generate → score → regenerate off-brand renders) instead
// of a single generate. When `reroll` is null, the flow is byte-for-byte the old single-generation
// behavior (the existing brandmint.test.mjs contract). These tests inject fakes — no disk, no codex.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBrandKit } from './brandmint.mjs';

const SPEC = {
  brand: 'testco',
  identity: { name: 'TestCo', tagline: 'We test things', mission: 'TestCo tests things.' },
  positioning: { category: 'testing tool', differentiation: 'fast: a; b', target_market: 'devs' },
  voice_tokens: { tone: ['direct'], vocabulary: ['ship'], dos: ['be clear'], donts: ['hype'] },
  visual_tokens: { palette: ['#FF6B35', '#1A1A2E', '#16213E'], type: { heading: 'bold sans', body: 'clean sans' }, motion: 'fast', imagery: 'bold' },
  persona: { who: 'a developer', pains: ['slow tools'], gains: ['ship faster'] },
};

// A reroll harness: records generate/score calls; scoreImage pops scripted scores in call order.
function harness(scores = []) {
  const writes = {}, genOuts = [], scoreOuts = [];
  const queue = [...scores];
  return {
    writes, genOuts, scoreOuts,
    writeFile: (p, c) => { writes[p] = c; },
    mkdir: () => {}, log: () => {},
    generateImage: ({ out }) => { genOuts.push(out); return { ok: true, out }; },
    scoreImage: (out) => { scoreOuts.push(out); return queue.shift() ?? { coverage: 1, accentPresence: 1 }; },
  };
}

const rerollCfg = (h, over = {}) => ({ scoreImage: h.scoreImage, scoreOf: (s) => s.coverage, threshold: 0.12, maxAttempts: 2, ...over });

test('runBrandKit reroll: image results carry attempts + bestScore + onBrand', () => {
  const h = harness([{ coverage: 0.5 }, { coverage: 0.5 }]);
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log, reroll: rerollCfg(h) });
  assert.ok(m.imageArtifacts.length >= 2);
  for (const a of m.imageArtifacts) {
    assert.ok('attempts' in a && 'bestScore' in a && 'onBrand' in a, `${a.name} carries reroll fields`);
  }
});

test('runBrandKit reroll: regenerates a below-threshold render and keeps the best', () => {
  // brand-board: 0.10 (below 0.12) → reroll → 0.20 (clears) ; logo-concept: 0.50 (clears first try)
  const h = harness([{ coverage: 0.10 }, { coverage: 0.20 }, { coverage: 0.50 }]);
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log, reroll: rerollCfg(h) });
  const board = m.imageArtifacts.find((a) => a.name === 'brand-board');
  const logo = m.imageArtifacts.find((a) => a.name === 'logo-concept');
  assert.equal(board.attempts, 2, 'brand-board rerolled once');
  assert.equal(board.bestScore, 0.20, 'kept the better second score');
  assert.equal(board.onBrand, true);
  assert.equal(logo.attempts, 1, 'logo passed on the first attempt — no wasted generation');
});

test('runBrandKit reroll: scores exactly once per generation', () => {
  const h = harness([{ coverage: 0.5 }, { coverage: 0.5 }]);
  runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log, reroll: rerollCfg(h) });
  assert.equal(h.scoreOuts.length, h.genOuts.length, 'one score per generated render');
});

test('runBrandKit reroll: still writes the text kit + returns a valid manifest', () => {
  const h = harness([{ coverage: 0.5 }, { coverage: 0.5 }]);
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log, reroll: rerollCfg(h) });
  const written = Object.keys(h.writes).join('\n');
  for (const f of ['brand-spec.json', 'logo.svg', 'voice.md', 'positioning.md', 'version.txt']) assert.ok(written.includes(f), `wrote ${f}`);
  assert.match(String(m.version).trim(), /^[0-9a-f]{12}$/);
});

test('runBrandKit reroll=null: preserves the single-generation shape (ok/code, no reroll fields)', () => {
  const h = harness();
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log });
  assert.equal(h.scoreOuts.length, 0, 'no scoring when reroll is null');
  for (const a of m.imageArtifacts) {
    assert.ok(!('attempts' in a), 'no reroll fields in the single-gen path');
    assert.ok('ok' in a, 'single-gen result retains ok');
  }
});
