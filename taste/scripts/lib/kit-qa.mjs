// kit-qa.mjs (lib) — the on-brand RASTER scorer: given decoded RGB pixels and a brand palette,
// how much of the image is actually drawn in the brand's colors?
//
//   hexToRgb('#RRGGBB' | 'RRGGBB') -> [r, g, b]
//   scorePalette(pixels, palette, opts) -> { coverage, accentPresence, perColor, sampled }
//
// WHY: brandmint + gen-logo emit a palette in the brand-spec; the renderers turn it into PNGs. This
// module closes the loop — it MEASURES whether a render honored the palette, by counting how many
// pixels fall within a tolerance (euclidean RGB distance) of a palette color. It's the raster twin of
// the vector checks: cheap, deterministic, no AI, no network.
//
//   coverage       = fraction of sampled pixels within tolerance of ANY palette color   (0..1)
//   accentPresence = fraction within tolerance of palette[0] (the primary/accent)        (0..1)
//   perColor       = { [hex]: fraction within tolerance of THAT specific color }
//   sampled        = number of pixels actually inspected
//
// SAMPLING: large renders have millions of pixels; we stride-sample so scoring stays cheap. opts.stride
// fixes the step; otherwise an auto-stride targets ≲50k samples (and never drops below 1 so tiny images
// still sample every pixel). Each pixel is attributed to the NEAREST palette color within tolerance, so
// perColor fractions over a clean render sum toward coverage without double-counting a pixel.
//
// PURE: reads only its inputs (a Uint8Array + an array of hex strings), returns a fresh object. No I/O.

const DEFAULT_TOLERANCE = 48;     // euclidean RGB distance; ~near-exact match, generous for AA edges
const TARGET_SAMPLES = 50_000;    // auto-stride aims for at most this many samples

// '#RRGGBB' or 'RRGGBB' (case-insensitive) -> [r, g, b] as integers 0..255.
export function hexToRgb(hex) {
  const h = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`invalid hex color: ${hex}`);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Squared euclidean distance between two RGB triples (squared: avoids a sqrt in the hot loop; we
// compare against tolerance² instead).
function dist2(r, g, b, [pr, pg, pb]) {
  const dr = r - pr, dg = g - pg, db = b - pb;
  return dr * dr + dg * dg + db * db;
}

// pixels: flat RGB Uint8Array (length = N*3). palette: array of hex strings (palette[0] = accent).
export function scorePalette(pixels, palette, opts = {}) {
  const tolerance = opts.tolerance ?? DEFAULT_TOLERANCE;
  const tol2 = tolerance * tolerance;
  const totalPixels = Math.floor(pixels.length / 3);

  // Stride: explicit, or auto so we take ≲TARGET_SAMPLES samples (floored at 1 for tiny images).
  const stride = Math.max(1, opts.stride ?? Math.ceil(totalPixels / TARGET_SAMPLES));

  // Pre-resolve palette to RGB once; track per-color hit counts keyed by the ORIGINAL hex string.
  const rgb = palette.map(hexToRgb);
  const perColorHits = palette.map(() => 0);
  let anyHits = 0;     // pixels within tolerance of ANY palette color
  let accentHits = 0;  // pixels within tolerance of palette[0]
  let sampled = 0;

  for (let p = 0; p < totalPixels; p += stride) {
    const o = p * 3;
    const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
    sampled++;

    // Single pass over the palette: find the nearest color AND capture the palette[0] (accent)
    // distance, so accentPresence needs no second distance computation per pixel.
    let bestIdx = -1, bestD2 = Infinity, accentD2 = Infinity;
    for (let k = 0; k < rgb.length; k++) {
      const d2 = dist2(r, g, b, rgb[k]);
      if (k === 0) accentD2 = d2; // palette[0] = accent
      if (d2 < bestD2) { bestD2 = d2; bestIdx = k; }
    }
    if (bestIdx >= 0 && bestD2 <= tol2) {
      anyHits++;
      perColorHits[bestIdx]++;
    }
    // accentPresence is measured against palette[0] specifically (independent of nearest-wins).
    if (accentD2 <= tol2) accentHits++;
  }

  const denom = sampled || 1; // guard: empty input → 0/1 = 0 rather than NaN
  const perColor = {};
  palette.forEach((hex, k) => { perColor[hex] = perColorHits[k] / denom; });

  return {
    coverage: anyHits / denom,
    accentPresence: accentHits / denom,
    perColor,
    sampled,
  };
}
