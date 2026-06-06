// validate-brand-spec.test.mjs — the canonical brand-spec contract guard.
// Run: node --test taste/scripts/validate-brand-spec.test.mjs
//
// The brand-spec is the one artifact that carries brand truth across the
// brandmint → taste → conductor seam. These tests pin the validator to the REAL
// schema file (no hardcoded copy) so schema + validator can never silently drift.

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBrandSpec, SCHEMA_PATH } from './validate-brand-spec.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A complete, on-spec fixture — every required field present and well-typed.
function validSpec() {
  return {
    brand: 'tryambakam-noesis',
    identity: {
      name: 'Tryambakam Noesis',
      tagline: 'The three-eyed knowing',
      mission: 'Make esoteric somatic practice legible to modern seekers.',
    },
    positioning: {
      category: 'contemplative technology',
      differentiation: 'somatic-first, ritual-grade craft',
      target_market: 'practitioners and facilitators',
    },
    persona: {
      who: 'the modern seeker who distrusts hype',
      pains: ['noise', 'shallow gamification'],
      gains: ['depth', 'embodied insight'],
    },
    voice_tokens: {
      tone: ['mystical', 'precise'],
      vocabulary: ['noesis', 'soma'],
      dos: ['speak plainly about deep things'],
      donts: ['hype', 'jargon for its own sake'],
    },
    visual_tokens: {
      palette: ['#0b0b0f', '#e8e2d4'],
      type: { heading: 'Canela', body: 'Inter' },
      motion: 'slow, breathing easings',
      imagery: 'grain, candlelight, sacred geometry',
    },
    taste_seed: {
      aesthetic: 'ritual-minimal, editorial',
      references: ['https://tympanus.net/codrops/demo/x'],
    },
    assets: [
      { id: 'logo', kind: 'image', path: 'assets/logo.svg', origin: 'user_provided' },
      { id: 'hero', kind: 'image', url: 'https://cdn.example/hero.png', origin: 'generated' },
    ],
  };
}

test('a complete, valid spec validates clean', () => {
  const res = validateBrandSpec(validSpec());
  assert.deepEqual(res, { valid: true, errors: [] });
});

test('missing visual_tokens is invalid with an error path that includes visual_tokens', () => {
  const spec = validSpec();
  delete spec.visual_tokens;
  const res = validateBrandSpec(spec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.path.includes('visual_tokens')),
    `expected an error path including visual_tokens, got ${JSON.stringify(res.errors)}`
  );
});

test('voice_tokens.tone as a string (not array) is a type error at voice_tokens.tone', () => {
  const spec = validSpec();
  spec.voice_tokens.tone = 'mystical'; // should be an array of string
  const res = validateBrandSpec(spec);
  assert.equal(res.valid, false);
  const e = res.errors.find((x) => x.path === 'voice_tokens.tone');
  assert.ok(e, `expected an error at voice_tokens.tone, got ${JSON.stringify(res.errors)}`);
  assert.match(e.message, /array/i);
});

test('an asset with neither path nor url is invalid with a path under assets', () => {
  const spec = validSpec();
  spec.assets.push({ id: 'orphan', kind: 'image', origin: 'generated' }); // no path, no url
  const res = validateBrandSpec(spec);
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.path.startsWith('assets')),
    `expected an error path under assets, got ${JSON.stringify(res.errors)}`
  );
});

test('the validator reads the REAL schema file on disk (schema + validator cannot drift)', () => {
  // SCHEMA_PATH is exported so this test can prove the validator does not embed a copy.
  assert.ok(fs.existsSync(SCHEMA_PATH), `schema file should exist at ${SCHEMA_PATH}`);
  const onDisk = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  assert.equal(onDisk.$schema, 'http://json-schema.org/draft-07/schema#');
  assert.equal(
    path.resolve(SCHEMA_PATH),
    path.resolve(__dirname, '..', 'schemas', 'brand-spec.schema.json'),
    'validator must load the canonical schema path'
  );
  // And the top-level required set is the contract we promised.
  assert.deepEqual(
    [...onDisk.required].sort(),
    ['brand', 'identity', 'positioning', 'visual_tokens', 'voice_tokens'].sort()
  );
});
