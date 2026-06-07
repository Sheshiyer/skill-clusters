// brandmint.test.mjs — RED-first contract for the brandmint FLOW orchestrator (brandmint.mjs).
//
// brandmint.mjs composes the wing's deterministic generators (genLogo / genVoiceGuide /
// genPositioning / versionOf) into one brand-kit run, and plans the on-brand gpt-image-2 prompts
// for the generative half. Three surfaces:
//   buildTextArtifacts(spec)  -> { 'brand-spec.json','logo.svg','voice.md','positioning.md','version.txt' } (PURE, string contents)
//   planImageArtifacts(spec)  -> [ {name,file,prompt,refs}, ... ]  (PURE; derives prompts from the spec)
//   runBrandKit({spec,outDir,generateImage,writeFile,mkdir,log}) -> manifest  (I/O injected)
// Tests inject writeFile + generateImage so nothing touches disk or codex here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTextArtifacts, planImageArtifacts, runBrandKit } from './brandmint.mjs';

const SPEC = {
  brand: 'testco',
  identity: { name: 'TestCo', tagline: 'We test things', mission: 'TestCo tests things end to end.' },
  positioning: { category: 'testing tool', differentiation: 'Speed: runs in CI; fails loud', target_market: 'developer teams' },
  voice_tokens: { tone: ['direct', 'confident'], vocabulary: ['ship', 'green'], dos: ['lead with the outcome'], donts: ['hype'] },
  visual_tokens: { palette: ['#FF6B35', '#1A1A2E', '#16213E'], type: { heading: 'bold sans-serif', body: 'clean sans-serif' }, motion: 'purposeful, fast', imagery: 'authentic photography, flat illustration, bold' },
  persona: { who: 'a developer', pains: ['slow flaky tools'], gains: ['ship faster with confidence'] },
};

// --- buildTextArtifacts (PURE) ---------------------------------------------

test('buildTextArtifacts: logo.svg is an SVG document', () => {
  const a = buildTextArtifacts(SPEC);
  assert.ok(a['logo.svg'].includes('<svg'), 'logo.svg contains <svg');
});

test('buildTextArtifacts: voice.md is a Markdown doc (starts with an H1)', () => {
  const a = buildTextArtifacts(SPEC);
  assert.ok(a['voice.md'].startsWith('# '), 'voice.md starts with "# "');
});

test('buildTextArtifacts: positioning.md is the positioning brief', () => {
  const a = buildTextArtifacts(SPEC);
  assert.ok(a['positioning.md'].includes('Positioning'), 'positioning.md mentions Positioning');
});

test('buildTextArtifacts: version.txt is a 12-hex content hash', () => {
  const a = buildTextArtifacts(SPEC);
  assert.match(a['version.txt'].trim(), /^[0-9a-f]{12}$/);
});

test('buildTextArtifacts: brand-spec.json round-trips the canonical spec', () => {
  const a = buildTextArtifacts(SPEC);
  assert.deepEqual(JSON.parse(a['brand-spec.json']), SPEC);
});

// --- planImageArtifacts (PURE) ---------------------------------------------

test('planImageArtifacts: returns at least 2 image descriptors', () => {
  const imgs = planImageArtifacts(SPEC);
  assert.ok(Array.isArray(imgs) && imgs.length >= 2, `got ${imgs.length}`);
});

test('planImageArtifacts: every prompt names the brand', () => {
  const imgs = planImageArtifacts(SPEC);
  for (const d of imgs) assert.ok(d.prompt.includes('TestCo'), `${d.name} prompt names the brand`);
});

test('planImageArtifacts: the brand-board prompt carries all three palette hexes', () => {
  const imgs = planImageArtifacts(SPEC);
  const board = imgs.find((d) => d.name === 'brand-board');
  assert.ok(board, 'has a brand-board descriptor');
  for (const hex of SPEC.visual_tokens.palette) assert.ok(board.prompt.includes(hex), `prompt includes ${hex}`);
});

test('planImageArtifacts: the logo-concept prompt names the wordmark', () => {
  const imgs = planImageArtifacts(SPEC);
  const logo = imgs.find((d) => d.name === 'logo-concept');
  assert.ok(logo, 'has a logo-concept descriptor');
  assert.ok(/wordmark|logotype|logo/i.test(logo.prompt), 'logo prompt references the wordmark/logo');
  assert.ok(logo.prompt.includes('TestCo'));
});

// --- runBrandKit (injected I/O) --------------------------------------------

// Capture writes + image-gen calls instead of touching disk/codex.
function harness() {
  const writes = {};            // path -> content
  const imageCalls = [];        // {prompt,out,refs}
  return {
    writes, imageCalls,
    writeFile: (p, c) => { writes[p] = c; },
    mkdir: () => {},
    log: () => {},
    generateImage: (opts) => { imageCalls.push(opts); return { ok: true, out: opts.out }; },
  };
}

test('runBrandKit: writes every text artifact into outDir', () => {
  const h = harness();
  runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log });
  const written = Object.keys(h.writes).join('\n');
  for (const f of ['brand-spec.json', 'logo.svg', 'voice.md', 'positioning.md', 'version.txt']) {
    assert.ok(written.includes(f), `wrote ${f}`);
  }
});

test('runBrandKit: calls generateImage exactly once per image descriptor', () => {
  const h = harness();
  runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log });
  assert.equal(h.imageCalls.length, planImageArtifacts(SPEC).length);
});

test('runBrandKit: returns a manifest enumerating text + image artifacts', () => {
  const h = harness();
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log });
  assert.ok(m && typeof m === 'object');
  assert.ok(Array.isArray(m.textArtifacts) && m.textArtifacts.length >= 5, 'lists text artifacts');
  assert.ok(Array.isArray(m.imageArtifacts) && m.imageArtifacts.length >= 2, 'lists image artifacts');
  assert.match(String(m.version).trim(), /^[0-9a-f]{12}$/);
});

test('runBrandKit: is idempotent — same spec yields the same version', () => {
  const h1 = harness(); const h2 = harness();
  const m1 = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h1.generateImage, writeFile: h1.writeFile, mkdir: h1.mkdir, log: h1.log });
  const m2 = runBrandKit({ spec: SPEC, outDir: '/kit', generateImage: h2.generateImage, writeFile: h2.writeFile, mkdir: h2.mkdir, log: h2.log });
  assert.equal(m1.version, m2.version);
});

test('runBrandKit: skips image generation when images:false', () => {
  const h = harness();
  const m = runBrandKit({ spec: SPEC, outDir: '/kit', images: false, generateImage: h.generateImage, writeFile: h.writeFile, mkdir: h.mkdir, log: h.log });
  assert.equal(h.imageCalls.length, 0, 'no image calls when images:false');
  assert.ok(Object.keys(h.writes).length >= 5, 'still writes the text kit');
});
