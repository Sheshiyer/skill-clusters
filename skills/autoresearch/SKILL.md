---
name: autoresearch
description: Use when the user wants Karpathy-style autonomous experiment loops, overnight research runs, or iterative keep-or-discard testing.
cluster: quality-eval
version: 1.0.0
origin: folded from agent skills library (quality-eval overlap)
---

# autoresearch

Use this skill when the user wants an agent to run repeated experiments with a strict keep-or-discard loop instead of a one-shot answer.

## Choose the mode

### Mode 1: Upstream code experiments

Use this when the user wants the original Karpathy workflow.

1. Work in a local clone of the `autoresearch` repo (set `AUTORESEARCH_DIR` or ask the user for the path).
2. Read:
   - `<autoresearch-repo>/README.md`
   - `<autoresearch-repo>/program.md`
3. Follow the repo's constraints exactly:
   - only edit `train.py`
   - do not modify `prepare.py`
   - keep `results.tsv` untracked
   - use a branch named `autoresearch/<tag>`
4. Treat the first run as the baseline.
5. For each experiment, change one idea, run it, log the metric, and keep or discard based on results.

Use this mode only if the machine and repo are actually ready for it. The upstream repo assumes a real training environment and is not a generic business-research framework by default.

### Mode 2: Thoughtseed business research loop

Use this when the user wants the same experiment pattern applied to:

- positioning
- offer design
- CTA language
- audience segmentation
- pricing hypotheses
- workflow benchmarking
- content resonance

Read `references/thoughtseed-business-loop.md` before running this mode.

## Working rules

- Change one meaningful variable per experiment.
- Define the decision metric before you run the experiment.
- Log every run, including failures and reversions.
- If the change improves the chosen metric or removes complexity at equal performance, keep it.
- If the result is worse or ambiguous, revert and try a cleaner idea.
- Prefer bounded batches such as 5, 10, or 20 iterations unless the user explicitly asks for open-ended overnight execution.

## Output expectations

Always leave behind:

- the experiment goal
- the baseline
- the experiment log
- the winning changes
- the discarded ideas
- the recommended next batch

## Local paths

Resolve these per environment rather than hardcoding:

- Upstream repo: local clone of the `autoresearch` repo (e.g. `$AUTORESEARCH_DIR`).
- Business-loop workspace: the user's project/ops directory for Mode 2 (ask if unset).
