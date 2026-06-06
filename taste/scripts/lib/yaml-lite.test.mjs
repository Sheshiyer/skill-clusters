// yaml-lite.test.mjs — the zero-dep YAML-subset parser used to read brandmint brand-config.yaml.
// Run: node --test taste/scripts/lib/yaml-lite.test.mjs
//
// Scope is deliberately small: exactly the YAML constructs a brand-config.yaml uses.
// The fixture below packs one of each construct the parser MUST support, mirroring the
// real HDILINT/brand-config.yaml (nested maps, list-of-scalars, list-of-maps, `|` block
// scalars, quoted strings + inline `#` comments that must NOT be stripped inside quotes,
// numbers, bools, null, empty inline `[]`, full-line + inline comments, blank lines).

import { test } from 'node:test';
import assert from 'node:assert';
import { parseYaml } from './yaml-lite.mjs';

// A single fixture exercising every supported construct in one parse.
const FIXTURE = `# top-of-file comment
brand:
  name: "Fitcheck"
  slug: fitcheck            # bare scalar + inline comment
  market:
    b2b: true
    b2c: false
    seats: 42

company:
  description: |
    Line one of the block.
    Line two, still indented under description.

    Trailing line after a blank line.
  founding_year: 2024
  ratio: 0.5

personality:
  traits:
    - "direct"
    - confident
    - "fast-moving"

colors:
  - "#FF6B35"   # a hash INSIDE quotes must survive; this trailing comment must go
  - "#1A1A2E"

screenshots: []

logo:
  path: null

packages:
  - name: "Pilot"
    price: "$3,000"
    includes:
      - "Demo renders"
      - "Widget setup"
  - name: "Premium"
    price: "$7,500"
    includes:
      - "Everything in Pilot"
`;

test('parses the full brand-config construct fixture into the expected object', () => {
  const got = parseYaml(FIXTURE);

  // nested map + bool + number + inline-comment stripping on a bare scalar
  assert.deepEqual(got.brand, {
    name: 'Fitcheck',
    slug: 'fitcheck',
    market: { b2b: true, b2c: false, seats: 42 },
  });
  assert.strictEqual(got.brand.market.b2b, true);
  assert.strictEqual(got.brand.market.b2c, false);
  assert.strictEqual(got.brand.market.seats, 42); // number, not the string "42"

  // `|` block scalar: newlines preserved (incl. the interior blank line), de-indented,
  // and it does NOT bleed into the sibling keys that follow it.
  assert.strictEqual(
    got.company.description,
    'Line one of the block.\nLine two, still indented under description.\n\nTrailing line after a blank line.'
  );
  assert.strictEqual(got.company.founding_year, 2024); // number after the block ends
  assert.strictEqual(got.company.ratio, 0.5);          // float

  // list-of-scalars, with quoted + bare items
  assert.deepEqual(got.personality.traits, ['direct', 'confident', 'fast-moving']);

  // a `#` that is the first char inside a quoted string is preserved; the trailing
  // ` # comment` after the closing quote is stripped.
  assert.deepEqual(got.colors, ['#FF6B35', '#1A1A2E']);

  // empty inline array
  assert.deepEqual(got.screenshots, []);

  // explicit null
  assert.strictEqual(got.logo.path, null);

  // list-of-maps, each with a nested list
  assert.deepEqual(got.packages, [
    { name: 'Pilot', price: '$3,000', includes: ['Demo renders', 'Widget setup'] },
    { name: 'Premium', price: '$7,500', includes: ['Everything in Pilot'] },
  ]);
});

test('an empty / whitespace-only document parses to an empty object', () => {
  assert.deepEqual(parseYaml(''), {});
  assert.deepEqual(parseYaml('\n  \n# just a comment\n'), {});
});

test('scalar coercion: true/false/null are typed, quoted numbers stay strings', () => {
  const got = parseYaml(
    [
      'a: true',
      'b: false',
      'c: null',
      'd: 7',
      'e: 7.5',
      'f: "7"',        // quoted → string, not number
      'g: "true"',     // quoted → string, not bool
      'h: hello world', // bare multi-word scalar
    ].join('\n')
  );
  assert.strictEqual(got.a, true);
  assert.strictEqual(got.b, false);
  assert.strictEqual(got.c, null);
  assert.strictEqual(got.d, 7);
  assert.strictEqual(got.e, 7.5);
  assert.strictEqual(got.f, '7');
  assert.strictEqual(got.g, 'true');
  assert.strictEqual(got.h, 'hello world');
});
