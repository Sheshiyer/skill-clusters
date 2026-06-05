# feedback/ — the closed-loop signal (Phase 5)

This directory holds the **capability-wing half of the closed loop**. conducty closes its loop in
the Obsidian vault (Failure Patterns → next Plan, narrative); PAI closes its loop in user-learning;
this closes the **skill-cluster** loop with queryable, structured data.

## loop-log.jsonl  (git-ignored — runtime state, per-environment)

Append-only, one conductor cycle per line, written by `scripts/loop-feedback.mjs --record`. Each
record captures: clusters dispatched, deferred clusters activated, escalated (unresolved/low-conf)
tasks, classifier overrides / phantom rejections / bad-skills, and the ship-battery verdict.

## How the loop closes

```
spec-kit tasks.md
   → resolve-task.mjs (classifier proposes, resolver validates)   ──┐
   → ship-battery.mjs (fail-closed gate)                            │  --record
   → loop-feedback.mjs --record  (append a cycle to loop-log.jsonl) ─┘
   → loop-feedback.mjs --rollup  (aggregate → the next Plan reads it)
```

The rollup turns history into **behavior change** (otherwise "it's just a log"):

| Signal in the rollup | Action it drives |
|---|---|
| a **deferred** cluster used a lot | promote it to `active` in `profiles.json` |
| high **classifier-override** rate | the keyword resolver is noisy there — retune scoring |
| repeated **phantom** proposals | a cluster the classifier keeps wanting — author it |
| a **gate** that fails every cycle | a real process weak point — harden it |

Run `node scripts/loop-feedback.mjs --rollup` to see the current signal.
