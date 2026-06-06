// taste-nim — secret-holding proxy for the je-ne-sais-quoi taste engine.
//
// Holds the NVIDIA (+ future inference.sh) keys in KV (TASTE_SECRETS). The publishable product calls
// THIS Worker — the keys never ship to a client. Multi-key round-robin + failover on 429/5xx, so no
// single account is overloaded. Bearer-token gated so the proxy isn't open to the world.
//
//   POST /embed  → NVIDIA /embeddings        (body = NVIDIA embeddings payload)
//   POST /vlm    → NVIDIA /chat/completions  (body = NVIDIA chat payload, incl. vision)
//   GET  /health → { ok, nvidia_keys, inference_sh }
//
// Auth: Authorization: Bearer <proxy_token>  (proxy_token lives in KV).

const NIM_BASE = 'https://integrate.api.nvidia.com/v1';
const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });

let rr = 0; // round-robin cursor (per isolate — fine for load distribution)

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,GET,OPTIONS' } });

    // auth gate (skip only if no token is provisioned yet)
    const tok = await env.TASTE_SECRETS.get('proxy_token');
    if (tok && req.headers.get('authorization') !== `Bearer ${tok}`) return j({ error: 'unauthorized' }, 401);

    if (pathname === '/health') {
      const ks = await Promise.all(['nvidia_nim_primary', 'nvidia_nim_secondary', 'inference_sh'].map((k) => env.TASTE_SECRETS.get(k)));
      return j({ ok: true, nvidia_keys: ks.slice(0, 2).filter(Boolean).length, inference_sh: !!ks[2], gated: !!tok });
    }

    if (req.method !== 'POST') return j({ error: 'POST only' }, 405);
    const route = { '/embed': '/embeddings', '/vlm': '/chat/completions' }[pathname];
    if (!route) return j({ error: 'not found' }, 404);

    const pool = (await Promise.all(['nvidia_nim_primary', 'nvidia_nim_secondary'].map((k) => env.TASTE_SECRETS.get(k)))).filter(Boolean);
    if (!pool.length) return j({ error: 'no NVIDIA key in KV — run put-secrets' }, 500);
    const body = await req.text();

    let last;
    for (let i = 0; i < pool.length; i++) {
      const key = pool[(rr++) % pool.length];
      const r = await fetch(NIM_BASE + route, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body });
      if (r.ok) return new Response(r.body, { headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
      const t = await r.text();
      if (r.status === 429 || r.status >= 500) { last = { status: r.status, detail: t.slice(0, 160) }; continue; } // failover
      return j({ error: `NIM ${r.status}`, detail: t.slice(0, 200) }, r.status);
    }
    return j({ error: 'all keys failed', detail: last }, 502);
  },
};
