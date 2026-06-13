# NotebookLM Integration (unofficial Python module)

This skill is wired to `notebooklm-py` via:
- `generate_assets_notebooklm.py`
- `prefill_templates_from_assets.py`
- `run_mvp_pipeline.py` (one-command wrapper)

## Prerequisites

1. Install module/CLI (already present in this environment):
   - `notebooklm --version`
2. Authenticate:
   - `notebooklm login`
3. Verify auth:
   - `notebooklm list --json`

## What the script generates

Given sources (URLs/files), it can generate:
- `report` → `notebooklm-report.md`
- `mind-map` → `notebooklm-mind-map.json`
- `data-table` → `notebooklm-data-table.csv`
- `quiz` → `notebooklm-quiz.md`
- `flashcards` → `notebooklm-flashcards.md`

It also writes `manifest.json` with notebook ID, sources, and artifact paths.

## Recommended one-command pipeline

```bash
./run_mvp_pipeline.py \
  --project-dir /path/to/project \
  --owner "<Owner>" \
  --asset report --asset mind-map --asset data-table
```

This auto-discovers key project files, generates NotebookLM assets, then pre-fills PRD/backlog/decision docs.

## Manual generation command (advanced)

```bash
./generate_assets_notebooklm.py \
  --title "MVP Research - <project>" \
  --source "https://example.com/market-report" \
  --source ./problem-statement.md \
  --asset report --asset mind-map --asset data-table \
  --output-dir ./outputs/<project>
```

## Using existing notebooks

```bash
./generate_assets_notebooklm.py \
  --title "ignored-when-notebook-id-used" \
  --notebook-id <notebook_uuid> \
  --source ./new-input.md \
  --asset report \
  --output-dir ./outputs/<project>
```

## Auto-prefill templates from generated assets

After assets are generated:

```bash
./prefill_templates_from_assets.py \
  --assets-dir ./outputs/<project> \
  --templates-dir . \
  --output-dir ./outputs/<project>/prefilled \
  --project "<Project Name>" \
  --owner "<Owner>"
```

This creates:
- `PRDTemplate.prefilled.md`
- `BacklogScoringTemplate.prefilled.md`
- `DecisionLogTemplate.prefilled.md`

## How to use outputs with this skill templates

1. Generate NotebookLM assets (report/mind-map/data-table)
2. Run `prefill_templates_from_assets.py`
3. Review and refine the prefilled docs for final decision quality
4. Track Go/No-Go/Pivot outcomes in decision log

## Troubleshooting

- Auth/session issues: run `notebooklm login` again.
- Long generation times: increase `--timeout` (e.g., `--timeout 1800`).
- Missing source file: ensure path exists and is readable.
