# Integrated Product-Flow Audit

Use this reference when a React Native task is about whether a whole app flow works, not
only whether a screen looks correct. The goal is to compare the product/agent contract
against the implemented route, state, API, persistence, and UX recovery paths.

## Inputs to Collect

- Product truth: specs, agent files, domain contracts, launch checklists, support/safety rules.
- Route inventory: app router files, stacks, tabs, modal routes, redirects, deep links.
- State authorities: providers, stores, React Query/SWR caches, secure storage, local bootstrap.
- Data surfaces: API hooks, route handlers, adapters, fixtures, demo fallbacks, reset paths.
- Verification surfaces: validators, simulator scripts, e2e docs, live smoke checks, release gates.

## Audit Workflow

1. Define the contract: actors, entry gates, happy-path outcome, safety/consent boundaries,
   money/token rules, and what must be live rather than simulated.
2. Draw the route graph: first-run, signed-out, signed-in, role-specific, modal, deep-link, and
   error exits. Note loops and dead ends.
3. Trace state authority: for each product fact, identify the single production source and every
   local/cache/fixture fallback. Flag competing authorities.
4. Trace the data path: screen -> hook/provider -> API -> cache/fallback -> persistence -> reset
   or recovery. Mark where user-visible UI can diverge from server truth.
5. Check UX states: loading, empty, error, offline, denied access, partial success, retry, back
   navigation, and success confirmation. Include role-specific and deep-link entry.
6. Classify gaps:
   - P0: blocks launch contract, safety/consent, auth, payment/token, or role access.
   - P1: user-visible mismatch, misleading fallback, incomplete recovery, or broken handoff.
   - P2: polish, copy clarity, non-blocking density, or secondary affordance.
7. Verify with the narrowest credible proof: static validator, type/lint, simulator route script,
   API smoke, or live staging check. Do not treat mock-only success as production proof.

## Output Shape

- Flow contract: one paragraph naming the actor, entry, exit, data authority, and hard boundary.
- Current implementation: concise route/state/API trace with file references.
- Gaps: ordered P0/P1/P2 list, each tied to the contract and the affected route.
- Next implementation batch: small scoped fixes that reduce product risk first.
- Verification: commands or manual checks that prove each fixed gap.

## Klear Karma Adapter

For the Klear Karma React Native app, start with these local sources before judging UI polish:

- Mirror/agent truth: `agents/mirror/*`.
- MVP launch flows: `specs/004-mvp-100-user-launch/*`.
- Token economy: `specs/006-token-system/*`.
- Expo app routes: `expo/app/**`.
- Client state and APIs: `expo/providers/**`, `expo/lib/**`, `expo/hooks/**`.
- Server routes and validators: `api/src/routes/**`, `api/scripts/**`, `expo/scripts/**`.

Treat Mirror, consent/safety, invite/OTP handoff, token wallet, practitioner verification,
booking/payment, conversations, and post-session reviews as linked flow axes. A screen can look
finished while still failing the product contract if one of those axes uses a hidden fixture,
stale local state, missing recovery UI, or an unverified server handoff.
