// canonical.mjs — order-invariant JSON canonicalization: the shared primitive behind content hashing.
//
// Recursively sorts object keys so a value's serialization is independent of key insertion order.
// Used by the idempotency ledger (actionKey) and brand-spec versioning (versionOf) — both need a
// STABLE content fingerprint, so they share one definition rather than drifting two copies.

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
    return out;
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}
