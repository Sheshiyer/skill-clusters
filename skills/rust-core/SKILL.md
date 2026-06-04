---
name: rust-core
description: "Shared reference for the Rust cluster: the library-vs-application error strategy (thiserror vs anyhow) that everything turns on, type-driven design conventions, the cargo tooling matrix, and the shared guardrails both spokes obey. USE WHEN choosing a Rust error type, shaping a public API, or wiring the cargo/CI toolchain — the decisions both patterns and testing depend on."
cluster: rust
version: 1.0.0
---

# Rust Core

Shared model for the `rust` cluster. Both spokes — `rust-patterns` (write) and `rust-testing`
(verify) — depend on these conventions; keep them consistent here so the two never contradict
each other (e.g. an error type designed in code and asserted in a test).

## 1. The decision this cluster turns on: error strategy

Rust's error story splits on **who consumes the error**, and that single choice ripples into the
API, the call sites, and every test:

```
Library / reusable crate ──> thiserror  (typed enum, #[from], stable variants — callers MATCH on it)
Application / binary ───────> anyhow     (dynamic Result + .context() — callers REPORT it)
```

- **`thiserror`** — derive a structured `#[derive(Error)]` enum at every library boundary. Callers
  (and tests) pattern-match exact variants: `assert!(matches!(err, StorageError::NotFound { .. }))`.
  Use `#[from]` to absorb upstream errors without losing type. → `rust-patterns`
- **`anyhow`** — in binaries and glue code, return `anyhow::Result<T>` and attach `.context(...)`
  /`.with_context(...)` at each `?`. Use `bail!`/`ensure!` for early exits. The trace, not the type,
  is the product. → `rust-patterns`
- **Never** `Box<dyn Error>` in a library, and **never** `unwrap()`/`expect()` on a recoverable
  error in production. `?` is the default; `expect("…")` is allowed only for genuinely-unreachable
  invariants (poisoned mutex, joined thread) with a message that states the invariant.

**Rule:** decide lib-vs-app *first*; it fixes whether downstream code and tests match on variants
or just propagate context. Treat a change of error *strategy* (enum → dynamic, or vice versa) as a
public-API change.

## 2. Type-driven design conventions

The shared stance both spokes assume:

- **Make illegal states unrepresentable** — model variants as enums; match exhaustively, no
  catch-all `_` for business logic (a new variant should force a compile error). → `rust-patterns`
- **Parse, don't validate** — convert unstructured input to typed structs at the boundary; wrap
  primitives in **newtypes** (`UserId(u64)`) so arguments can't be swapped. → `rust-patterns`
- **Borrow, don't clone** — pass `&T`/`&[T]`/`&str`; reach for `Cow` when ownership is conditional.
- **Accept generics, return concrete types**; trait objects (`Box<dyn _>`) only for heterogeneous
  collections / plugins. → `rust-patterns`
- **Minimal `pub` surface** — `pub(crate)` for internal sharing; re-export the public API from
  `lib.rs`. Organize modules **by domain, not by type**.
- **`unsafe`** is a last resort: every block carries a `# Safety` / `// SAFETY:` note proving its
  invariants; never used to dodge the borrow checker.

## 3. Concurrency baseline

- Shared mutable state → `Arc<Mutex<T>>` (treat `lock()` poisoning as an invariant via `expect`).
- Prefer message passing — `mpsc`/`sync_channel` with bounded backpressure; `drop(tx)` to end an
  `rx` iterator.
- Async on **Tokio**; never block the executor (`std::thread::sleep` → `tokio::time::sleep`,
  blocking I/O → `spawn_blocking`). Tests of async code use `#[tokio::test]`. → `rust-patterns`, `rust-testing`

## 4. Cargo / tooling matrix

| Concern | Tool / command | Spoke |
|---|---|---|
| Type-check (fast) | `cargo check` | `rust-patterns` |
| Lints | `cargo clippy -- -D warnings` | `rust-patterns` |
| Format | `cargo fmt --check` | `rust-patterns` |
| Security audit | `cargo audit` | `rust-patterns` |
| Unit / integration / doc tests | `cargo test` (`--lib` / `--test <name>` / `--doc`) | `rust-testing` |
| Parameterized tests | `rstest` | `rust-testing` |
| Property tests | `proptest` | `rust-testing` |
| Mocking | `mockall` (`#[automock]`) | `rust-testing` |
| Benchmarks | `criterion` (`harness = false`) | `rust-testing` |
| Coverage gate | `cargo llvm-cov --fail-under-lines 80` | `rust-testing` |

CI runs them in order: `fmt --check` → `clippy -D warnings` → `cargo test` → coverage gate.

## 5. Version / conventions

- Target a **current stable** toolchain (`dtolnay/rust-toolchain@stable`) with `clippy` + `rustfmt`
  components; `unsafe` examples assume **Rust 2024+** edition semantics.
- Pin dev-tooling versions in CI via `taiki-e/install-action` (e.g. `cargo-llvm-cov`).
- Coverage targets: critical business logic 100%, public API 90%+, general code 80%+, generated/FFI
  excluded.

## 6. Shared guardrails

- **`?` over `unwrap()`** in all library/production code; `expect("invariant")` only for the truly
  unreachable.
- **Library → `thiserror`, application → `anyhow`**; never `Box<dyn Error>` in a library; state any
  change to the error strategy.
- Make illegal states unrepresentable; match exhaustively; newtype your primitives.
- Keep `unsafe` minimal and documented with a `# Safety` comment.
- Expose the narrowest `pub` surface; organize by domain.
- **TDD**: write the failing test first; tests are independent, never `sleep()`, and assert on
  typed error *variants* (`matches!`) rather than panic strings wherever a `Result` is returned.
- Gate merges on `fmt --check`, `clippy -D warnings`, `cargo test`, and the coverage threshold.
