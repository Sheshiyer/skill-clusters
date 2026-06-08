// brandmint-prompt-grounding.test.mjs — planImageArtifacts must GROUND the gpt-image-2 prompts in the
// brand's actual product (identity.mission) and reuse the brand system's existing direction
// (visual_tokens.logo_brief + visual_tokens.art_direction), so a render reflects the PRODUCT, not a
// literal reading of the name. (Regression guard for the "Fitcheck read as fitness" miss.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planImageArtifacts } from './brandmint.mjs';

const SPEC = {
  brand: 'fitcheck',
  identity: {
    name: 'Fitcheck',
    tagline: 'Try it before they buy it',
    mission: 'Fitcheck is an AI virtual try-on launch service for Shopify fashion brands.',
  },
  positioning: { category: 'AI virtual try-on platform for fashion brands', differentiation: 'x', target_market: 'fashion founders' },
  voice_tokens: { tone: ['direct'], vocabulary: [], dos: [], donts: [] },
  visual_tokens: {
    palette: ['#FF6B35', '#1A1A2E', '#16213E'],
    type: { heading: 'geometric sans', body: 'clean sans' },
    motion: 'purposeful',
    imagery: 'fashion editorial, fitting-room, apparel on real bodies',
    logo_brief: 'Wordmark "Fitcheck" with the i-dot replaced by a checkmark that doubles as a human silhouette being fitted, set in a fitting-room-mirror frame.',
    art_direction: 'Fashion-tech editorial — apparel, styled outfits, the "fit check" outfit-share culture; avoid fitness, gym, or athletic cues.',
  },
  persona: { who: 'a fashion founder', pains: [], gains: [] },
};

test('planImageArtifacts: every prompt is grounded in the mission (the product, not the name)', () => {
  for (const d of planImageArtifacts(SPEC)) {
    assert.ok(d.prompt.includes('virtual try-on'), `${d.name} prompt names the actual product`);
  }
});

test('planImageArtifacts: the logo-concept prompt reuses the existing logo_brief', () => {
  const logo = planImageArtifacts(SPEC).find((d) => d.name === 'logo-concept');
  assert.ok(logo.prompt.includes('checkmark that doubles as a human silhouette'), 'logo follows the brand-system brief');
  assert.ok(logo.prompt.includes('fitting-room-mirror'), 'logo carries the mirror-frame motif');
});

test('planImageArtifacts: both prompts carry the art_direction (the anti-fitness steer)', () => {
  for (const d of planImageArtifacts(SPEC)) {
    assert.ok(d.prompt.includes('avoid fitness'), `${d.name} prompt carries the art direction`);
  }
});

// The existing contract must still hold (additive change).
test('planImageArtifacts: still names the brand, palette, and wordmark (unchanged contract)', () => {
  const imgs = planImageArtifacts(SPEC);
  for (const d of imgs) assert.ok(d.prompt.includes('Fitcheck'), `${d.name} names the brand`);
  const board = imgs.find((d) => d.name === 'brand-board');
  for (const hex of SPEC.visual_tokens.palette) assert.ok(board.prompt.includes(hex), `board carries ${hex}`);
  const logo = imgs.find((d) => d.name === 'logo-concept');
  assert.ok(/wordmark|logotype|logo/i.test(logo.prompt), 'logo prompt references the wordmark');
});
