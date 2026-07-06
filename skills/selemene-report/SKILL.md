---
name: selemene-report
description: "Generate Selemene Engine reports from a slash-command. Routes deterministic birth/compatibility/transit reports through the existing @selemene/bridge CLI and narrative witness readings through the packages/witness-pipeline. USE WHEN the user says /selemene-report, selemene report, generate selemene report, birth chart report, compatibility report, transit report, or witness reading. NOT for building new engines, not for replacing the bridge CLI, not for human web UI intake."
origin: project
cluster: selemene
version: 1.0.0
---

# Selemene Report — `/selemene-report`

Generate Selemene Engine reports from a coding-agent context.

This skill is a thin orchestrator over surfaces that already exist in the repo:

- **Deterministic reports** — birth chart, compatibility, transit — via the Rust `noesis-vedic-api` report generator, reached through the `@selemene/bridge` CLI.
- **Narrative witness readings** — solo or dyadic — via `packages/witness-pipeline/src/orchestrator/integrated.ts`.

The skill does not reimplement report logic. It asks for missing inputs, invokes the right existing path, writes a manifest + artifact, and returns the artifact path plus a non-prescriptive witness prompt.

---

## Triggers

Invoke this skill when the user says any of the following, or asks for a Selemene report without specifying a surface:

- `/selemene-report`
- `selemene report`
- `generate selemene report`
- `birth chart report`
- `compatibility report`
- `transit report`
- `witness reading`
- `selemene reading`

## Non-triggers (route elsewhere)

- Building or modifying a Selemene engine → `rust-orchestrator` or `backend-architecture-orchestrator`
- Changing the bridge CLI itself → `createcli` or work directly in `bridges/cli/src/`
- Human-facing web intake → the existing `apps/noesis-web` app; this skill is for agent/terminal use
- PDF/DOCX layout/rendering → `documents` cluster (`docx`, `pdf`, `notebooklm`)

---

## Inputs

The skill accepts a command string and resolves the report type from the first positional argument.

### Deterministic reports

```bash
/selemene-report birth "Name" "1990-01-15T10:30:00+05:30" "Bangalore" \
  [--output-dir ./selemene-reports] [--format text|html|json|pdf]

/selemene-report compatibility \
  --person1 "Name A" "1990-01-15T10:30:00+05:30" "Bangalore" \
  --person2 "Name B" "1992-03-20T14:00:00+05:30" "Mumbai" \
  [--output-dir ./selemene-reports]

/selemene-report transit "Name" "1990-01-15T10:30:00+05:30" "Bangalore" \
  --from 2026-01-01 --to 2026-12-31 \
  [--output-dir ./selemene-reports]
```

### Narrative witness reading

```bash
/selemene-report witness --mode solo --subjects subjects.json \
  [--level L1|L2|L3|L4|L5] [--output-dir ./selemene-reports]
```

`subjects.json` matches the existing `ReportSubjectInput` shape from `packages/witness-pipeline/src/intake/types.ts`:

```json
[
  {
    "role": "primary",
    "name": "Name",
    "birth_date": "1990-01-15",
    "birth_time": "10:30",
    "birth_time_confidence": "exact",
    "birth_location_query": "Bangalore"
  }
]
```

### Environment

The skill reads the same environment the bridge CLI uses:

- `SELEMENE_RUST_URL` (default: `http://localhost:8080`)
- `SELEMENE_TS_URL` (default: `http://localhost:3001`)
- `SELEMENE_API_KEY` (optional)
- `SELEMENE_OUTPUT_DIR` (default: `./selemene-reports`)

It also respects a local `.selemenerc.json` if present, reusing the bridge config file format.

---

## Execution flow

1. **Parse intent** — first positional argument chooses one of `birth`, `compatibility`, `transit`, `witness`.
2. **Validate inputs** — require birth datetime + location for deterministic reports; require `--subjects` JSON for witness.
3. **Resolve backend**
   - Deterministic: call `npx @selemene/bridge generate` first if tool definitions are stale, then `POST` to the relevant Rust OpenAPI report endpoint (`/api/reports/birth`, `/api/reports/compatibility`, `/api/reports/transit`).
   - Witness: call the existing witness-pipeline entry point (see `packages/witness-pipeline/scripts/` for available scripts) with the subjects file and mode.
4. **Write artifacts** — always emit:
   - `{output_dir}/manifest.json`
   - `{output_dir}/{report_type}-{slug}-{timestamp}.{ext}`
5. **Return result** — absolute artifact path + a one-line witness prompt.

---

## Output contract

Every run produces a manifest next to the artifact:

```json
{
  "report_type": "birth|compatibility|transit|witness",
  "created_at": "2026-07-06T13:45:00Z",
  "subject_count": 1,
  "engines_used": ["vedic"],
  "artifact_path": "/abs/path/to/selemene-reports/birth-name-20260706-134500.md",
  "witness_prompt": "What is the one thing from this report that feels most alive right now?"
}
```

For deterministic reports the artifact format is set by `--format`. For witness readings the artifact is markdown by default, matching the source-pack factory output in `packages/witness-pipeline/src/assets/factory.ts`.

---

## Tool reference

The skill ships a thin wrapper in `Tools/` that performs the parse → validate → invoke → write flow.

- `Tools/Report.ts` — main entry, called as `bun run Tools/Report.ts <subcommand> <args>`
- `Tools/lib/resolve-config.ts` — reads `.selemenerc.json` and env vars
- `Tools/lib/write-manifest.ts` — writes the manifest.json contract
- `Tools/lib/prompts.ts` — returns a witness prompt per report type

Do not edit `Tools/` to add new report math. If a report type is missing, extend the backend (Rust or witness-pipeline) first, then add a sub-command mapping here.

---

## Verification checklist

Before claiming a report was generated:

- [ ] The manifest file exists next to the artifact and is valid JSON.
- [ ] The artifact file exists and is non-empty.
- [ ] The backend endpoint or witness-pipeline script returned a success status.
- [ ] The returned path is absolute and readable.

---

## Design notes

- **Hub-and-spoke citizenship.** This skill is an `active-spoke` under the `selemene` cluster. It is enumerated only if the cluster is active; otherwise it resolves on demand via `~/.agents/skill-clusters/skills/selemene-report/SKILL.md`.
- **No duplicate logic.** The skill invokes `@selemene/bridge` and `packages/witness-pipeline`; it does not contain copies of `mergeSpecs`, `generateClaudeTools`, `IntegratedReadingOrchestrator`, or `ReportSection` logic.
- **Non-prescriptive framing.** All returned prompts are mirrors, not advice. This matches the existing witness-pipeline tone.
