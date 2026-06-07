// kit-register.mjs — register a brand kit (its 1024-dim prototype + metadata) into BOTH local memories.
//
// A "brand kit" is a brand's visual DNA distilled to one vector: the `prototype` embedding that
// taste/brands/<brand>.json already carries (dim 1024, the shared NIM cosine space). Registering it
// means writing that vector — once — into the two stores that make a brand recallable:
//
//   • noesis (taste/scripts/lib/noesis.mjs) — the federated cortex. The kit goes into its `brand`
//     lane so a later queryAll across taste|brand|knowledge can surface it by cosine alone.
//   • design-memory (taste/scripts/lib/design-memory.mjs) — the per-brand visual-DNA store, the
//     `brand` lane of that same future cortex, namespaced by the brand string.
//
// Both stores share ONE design: add(<ns-or-brand>, id, vector, meta) -> { id }, and they DON'T mint
// ids — the caller supplies one. So registerKit synthesizes a stable, derivable id `${brand}:${version}`
// (re-registering the same brand+version targets the same logical record) and stamps an authoritative
// `{ brand, version, kind: 'brand-kit' }` onto the metadata (caller meta is merged underneath, so a
// caller can attach extra fields but cannot spoof those three).
//
// PURE CORE + INJECTED DEPS: registerKit is pure over the two injected store instances — no globals,
// no I/O, no embedding (the vector arrives already-embedded). The CLI main() is the only thing that
// touches the filesystem, and only node: builtins do so. Zero third-party dependencies.
//
//   registerKit({ brand, version, embedding, meta = {}, noesis, designMemory }) -> { noesisId, designMemoryId }
//
// CLI:  node taste/scripts/kit-register.mjs <prototype.json> <kitDir>
//   <prototype.json> — a brand file like taste/brands/hdilint.json: .prototype = number[] (the embedding),
//                      .brand = the brand string.
//   <kitDir>         — a kit directory; its version.txt (if present) gives the version, else 'unknown'.
//   Registers the kit into fresh noesis + design-memory instances, then DEMONSTRATES RECALL by querying
//   both stores with the SAME embedding and printing the top hit + score. Exits 2 on usage/parse errors.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { makeNoesis } from './lib/noesis.mjs';
import { makeDesignMemory } from './lib/design-memory.mjs';

// --- pure core -------------------------------------------------------------------------------------

// Register one brand kit into both injected stores under a stable `${brand}:${version}` id.
// The id is the same for both stores so the two records refer to the same logical kit. Authoritative
// metadata { brand, version, kind } is applied LAST so caller-supplied meta can enrich but never
// override it. Returns the ids actually used (handy for the caller's own bookkeeping / recall).
export function registerKit({ brand, version, embedding, meta = {}, noesis, designMemory }) {
  const id = `${brand}:${version}`;
  const record = { ...meta, brand, version, kind: 'brand-kit' };

  // noesis: into the `brand` lane of the federated cortex.
  const { id: noesisId } = noesis.add('brand', id, embedding, record);
  // design-memory: into the per-brand visual-DNA store, namespaced by the brand string.
  const { id: designMemoryId } = designMemory.add(brand, id, embedding, record);

  return { noesisId, designMemoryId };
}

// --- CLI -------------------------------------------------------------------------------------------

// Read and JSON-parse a brand prototype file, validating the two fields registerKit depends on.
// Throws on a missing/short embedding or a missing brand so main() can map it to a clean exit 2.
function loadPrototype(protoPath) {
  const raw = readFileSync(protoPath, 'utf8');
  const json = JSON.parse(raw);
  if (!Array.isArray(json.prototype) || json.prototype.length === 0) {
    throw new Error(`prototype file has no .prototype array: ${protoPath}`);
  }
  if (typeof json.brand !== 'string' || json.brand.length === 0) {
    throw new Error(`prototype file has no .brand string: ${protoPath}`);
  }
  return { brand: json.brand, embedding: json.prototype };
}

// The version is the trimmed contents of <kitDir>/version.txt, or 'unknown' if the file is absent.
// Any read error (missing file is the common one) degrades to 'unknown' rather than failing the run.
function readVersion(kitDir) {
  try {
    const v = readFileSync(join(kitDir, 'version.txt'), 'utf8').trim();
    return v.length ? v : 'unknown';
  } catch {
    return 'unknown';
  }
}

function main(argv = process.argv.slice(2)) {
  const [protoPath, kitDir] = argv;
  if (!protoPath || !kitDir) {
    console.error('usage: node taste/scripts/kit-register.mjs <prototype.json> <kitDir>');
    process.exit(2);
  }

  let brand, embedding;
  try {
    ({ brand, embedding } = loadPrototype(protoPath));
  } catch (err) {
    console.error(`kit-register: ${err.message}`);
    process.exit(2);
  }

  const version = readVersion(kitDir);

  // Fresh cortex + design memory, then register the kit into both.
  const noesis = makeNoesis();
  const designMemory = makeDesignMemory();
  const { noesisId, designMemoryId } = registerKit({ brand, version, embedding, noesis, designMemory });

  // DEMONSTRATE RECALL: query both stores with the SAME embedding and show the top hit + score.
  const noesisTop = noesis.query('brand', embedding, 1)[0];
  const dmTop = designMemory.query(brand, embedding, 1)[0];

  console.log(`registered ${brand} kit (version ${version})`);
  console.log(`  noesis id:        ${noesisId}`);
  console.log(`  design-memory id: ${designMemoryId}`);
  console.log(`  embedding dim:    ${embedding.length}`);
  console.log('recall:');
  console.log(`  noesis[brand]   → ${noesisTop.id}  score=${noesisTop.score.toFixed(4)}  (kind=${noesisTop.meta.kind})`);
  console.log(`  design-memory   → ${dmTop.id}  score=${dmTop.score.toFixed(4)}  (kind=${dmTop.meta.kind})`);
  console.log(`  noesis census:  ${JSON.stringify(noesis.stats())}`);
}

// isMain guard: run main() only when invoked directly, never on import (keeps the test's import pure).
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
