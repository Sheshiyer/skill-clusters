#!/usr/bin/env python3
"""Prefill MVP templates from NotebookLM-generated assets.

Inputs (from generate_assets_notebooklm.py output dir):
- notebooklm-report.md
- notebooklm-data-table.csv (optional)
- notebooklm-mind-map.json (optional)
- manifest.json (optional)

Outputs:
- PRDTemplate.prefilled.md
- BacklogScoringTemplate.prefilled.md
- DecisionLogTemplate.prefilled.md
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Prefill MVP templates from NotebookLM assets")
    p.add_argument("--assets-dir", required=True, help="Directory containing NotebookLM output files")
    p.add_argument("--templates-dir", default=".", help="Directory containing template markdown files")
    p.add_argument("--output-dir", default=None, help="Directory for prefilled outputs (default: <assets-dir>/prefilled)")
    p.add_argument("--project", default=None, help="Project name override")
    p.add_argument("--owner", default="TBD", help="Default owner/maintainer value")
    return p.parse_args()


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _sanitize_cell(value: str) -> str:
    return value.replace("|", "/").strip()


def parse_report(report_text: str) -> dict[str, Any]:
    lines = report_text.splitlines()

    title = "NotebookLM MVP Report"
    for ln in lines:
        if ln.startswith("# "):
            title = ln[2:].strip()
            break

    # Headings and bullets
    headings = [re.sub(r"^#{1,6}\s+", "", ln).strip() for ln in lines if re.match(r"^#{2,6}\s+", ln)]
    bullets = [re.sub(r"^\s*[-*]\s+", "", ln).strip() for ln in lines if re.match(r"^\s*[-*]\s+", ln)]

    # First meaningful paragraph
    paragraph = ""
    for ln in lines:
        if ln.strip() and not ln.startswith("#") and not re.match(r"^\s*[-*]\s+", ln):
            paragraph = ln.strip()
            break

    # Candidate opportunities from bullets/headings
    candidates = []
    for item in bullets + headings:
        t = re.sub(r"\s+", " ", item).strip(" .")
        if 8 <= len(t) <= 140 and t.lower() not in {c.lower() for c in candidates}:
            candidates.append(t)
        if len(candidates) >= 8:
            break

    if not candidates:
        candidates = ["Define core MVP user flow", "Implement priority must-have capability", "Instrument key activation events"]

    return {
        "title": title,
        "summary": paragraph or "Source-backed insights were generated from NotebookLM assets.",
        "headings": headings[:8],
        "bullets": bullets[:12],
        "opportunities": candidates,
    }


def parse_csv_rows(csv_path: Path) -> list[dict[str, str]]:
    if not csv_path.exists():
        return []
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            cleaned = {k: _sanitize_cell(v or "") for k, v in row.items() if k}
            if any(cleaned.values()):
                rows.append(cleaned)
            if len(rows) >= 8:
                break
        return rows


def infer_project_name(manifest: dict[str, Any] | None, override: str | None, report_title: str) -> str:
    if override:
        return override
    if manifest and manifest.get("notebook", {}).get("title"):
        return str(manifest["notebook"]["title"])
    return report_title


def render_prd(template: str, project: str, owner: str, insights: dict[str, Any], csv_rows: list[dict[str, str]]) -> str:
    today = date.today().isoformat()
    opportunities = insights["opportunities"]

    replaced = template
    replacements = {
        "- PRD Version:": "- PRD Version: 0.1",
        "- Owner:": f"- Owner: {owner}",
        "- Contributors:": "- Contributors: Product, Engineering, Design, Ops",
        "- Last Updated:": f"- Last Updated: {today}",
        "- Related Decision Log IDs:": "- Related Decision Log IDs: DEC-001, DEC-002",
        "- Problem statement:": f"- Problem statement: {insights['summary']}",
        "- Who is affected:": "- Who is affected: Primary target users experiencing the current workflow friction.",
        "- Current workaround:": "- Current workaround: Manual or fragmented process with inconsistent outcomes.",
        "- Business impact:": "- Business impact: Slower adoption, lower conversion, and higher execution overhead.",
        "- Opportunity size (qualitative/quantitative):": "- Opportunity size (qualitative/quantitative): Medium-to-high if core flow is simplified and instrumented.",
        "- North-star metric:": "- North-star metric: Activation rate for first successful end-to-end task.",
        "- Leading metrics (2-4):": "- Leading metrics (2-4): Time-to-value, completion rate, week-1 retention, task success rate.",
        "- Baseline values:": "- Baseline values: TBD (collect in sprint 1 instrumentation).",
        "- MVP success threshold (done when):": "- MVP success threshold (done when): Target activation threshold is achieved for defined user segment.",
        "- Non-goals:": "- Non-goals: Nice-to-have automations, broad edge-case coverage, non-critical redesign.",
        "- Primary user persona:": "- Primary user persona: Operator/manager executing repeatable workflow under time constraints.",
        "- Secondary persona(s):": "- Secondary persona(s): Team lead, executive stakeholder.",
        "- Jobs-to-be-done:": "- Jobs-to-be-done: Complete core workflow quickly, reliably, and with measurable outcomes.",
        "- Top pain points:": "- Top pain points: Unclear steps, fragmented tools, weak feedback loops.",
        "- Core user journey:": "- Core user journey: Discover value → set up quickly → complete first successful run → iterate.",
        "- Edge cases:": "- Edge cases: Incomplete input data, dependency delays, authorization failures.",
        "- UX acceptance criteria:": "- UX acceptance criteria: Users can finish core flow in minimal steps without external guidance.",
        "- Hypothesis:": "- Hypothesis: Reducing core flow friction and clarifying outcomes will improve activation.",
        "- Timebox:": "- Timebox: 1 sprint (2 weeks)",
        "- Success criteria:": "- Success criteria: Improvement in activation leading metrics and positive qualitative feedback.",
        "- Failure criteria:": "- Failure criteria: No measurable uplift after controlled rollout.",
        "- Decision date:": f"- Decision date: {today}",
        "- Sprint mapping (2-week cadence):": "- Sprint mapping (2-week cadence): Sprint 1 discovery+POC, Sprint 2 MVP build, Sprint 3 hardening.",
        "- Milestones:": "- Milestones: POC gate, MVP feature-complete, launch readiness review.",
        "- Rollback plan:": "- Rollback plan: Feature-flagged release with immediate rollback to stable path.",
        "- Launch checklist:": "- Launch checklist: QA pass, analytics validation, stakeholder sign-off, support docs ready.",
    }

    for old, new in replacements.items():
        replaced = replaced.replace(old, new)

    # In/Out scope bullets
    in_scope = "\n".join([f"- {x}" for x in opportunities[:3]])
    out_scope = "\n".join([
        "- Advanced integrations not required for first user value",
        "- Enterprise edge-case handling beyond MVP segment",
        "- Non-essential UX polish work",
    ])
    replaced = replaced.replace("### In Scope (MVP)\n- ", f"### In Scope (MVP)\n{in_scope}")
    replaced = replaced.replace("### Out of Scope (This Cycle)\n- ", f"### Out of Scope (This Cycle)\n{out_scope}")

    # Assumptions/dependencies rows
    assumption = opportunities[0] if opportunities else "Core flow simplification drives measurable activation gains"
    replaced = replaced.replace(
        "| A-1 |  |  |  | Unvalidated |",
        f"| A-1 | {_sanitize_cell(assumption)} | M | Validate via POC + surveys | Unvalidated |",
    )
    replaced = replaced.replace(
        "| D-1 |  |  |  |  |",
        "| D-1 | Analytics event tracking pipeline | Engineering | Cannot measure success accurately | Instrument early in sprint 1 |",
    )

    # Functional requirements rows
    fr_rows = []
    for i, item in enumerate(opportunities[:3], start=1):
        fr_rows.append(f"| FR-{i} | {_sanitize_cell(item)} | {'Must' if i == 1 else 'Should'} | User can complete this flow with testable success criteria |")
    fr_block = "\n".join(fr_rows)
    replaced = replaced.replace("| FR-1 |  | Must |  |", fr_block)

    # Data events
    event_rows = [
        "| mvp_flow_started | User starts core workflow | user_id, segment, source | Product | Activation funnel |",
        "| mvp_flow_completed | User completes core workflow | user_id, duration, outcome | Engineering | Completion rate |",
        "| mvp_value_realized | User reaches first value moment | user_id, value_type | Product | Time-to-value |",
    ]
    replaced = replaced.replace("|  |  |  |  |  |", "\n".join(event_rows))

    # Risk row
    replaced = replaced.replace(
        "| R-1 |  |  |  |  |  |",
        "| R-1 | Market | Problem framing may not match top customer pain | High | Validate via interviews/surveys before full build | Product |",
    )

    # Open questions from CSV/report
    questions = []
    if csv_rows:
        questions.append("Which CSV-identified segment should be prioritized first?")
    if insights["headings"]:
        questions.append(f"Which report theme should drive Sprint 1 focus: {insights['headings'][0]}?")
    questions.append("What is the minimum acceptable activation lift for go-live?")
    replaced = replaced.replace("## 13. Open Questions\n- ", "## 13. Open Questions\n" + "\n".join(f"- {q}" for q in questions))

    # Header
    replaced = f"# {project} — Prefilled PRD\n\n" + replaced
    return replaced


def render_backlog(template: str, insights: dict[str, Any], csv_rows: list[dict[str, str]]) -> str:
    opportunities = insights["opportunities"][:5]

    # augment from csv first column-like fields
    for row in csv_rows[:5]:
        if len(opportunities) >= 7:
            break
        vals = [v for v in row.values() if v]
        if vals:
            candidate = vals[0][:120]
            if candidate.lower() not in {o.lower() for o in opportunities}:
                opportunities.append(candidate)

    rows = []
    for i, op in enumerate(opportunities, start=1):
        value = 5 - min(i - 1, 3)
        effort = 2 + ((i - 1) % 3)
        reach = 800 - (i - 1) * 100
        impact = 2 if i <= 2 else 1
        confidence = 80 - (i - 1) * 5
        rice_effort = max(1, effort)
        rice_score = round((reach * impact * (confidence / 100)) / rice_effort, 2)
        quadrant = "Quick Win" if value >= 4 and effort <= 3 else "Strategic Bet"
        kano = "Must-have" if i <= 2 else "Performance"
        moscow = "Must" if i <= 2 else "Should"
        rows.append(
            f"| OP-{i:02d} | {_sanitize_cell(op)} | Reduce friction in core journey | {value} | {effort} | {quadrant} | {reach} | {impact} | {confidence} | {rice_effort} | {rice_score} | {kano} | {moscow} | Unvalidated | {'H' if i==1 else 'M'} | Cross-team dependency check required | {'POC' if i==1 else 'Keep'} |"
        )

    replaced = template.replace(
        "| OP-01 |  |  |  |  |  |  |  |  |  |  | Must-have / Performance / Delighter | Must / Should / Could / Won’t | Validated / Unvalidated | H/M/L |  | Keep / Drop / POC |",
        "\n".join(rows),
    )

    replaced = replaced.replace(
        "| EX-01 |  |  |  |  |",
        "| EX-01 | Advanced automation bundle | Not required for first user value | Activation baseline achieved for 2 sprints | Next planning cycle |",
    )
    first_initiative = _sanitize_cell(opportunities[0] if opportunities else "Core MVP flow")
    replaced = replaced.replace(
        "| POC-01 |  |  |  |  |  |  |  | Go / No-Go / Pivot |",
        f"| POC-01 | {first_initiative} | Adoption and feasibility uncertainty | Simplified flow improves activation metrics | 2 weeks | Activation + completion lift vs baseline | Product + Eng | {date.today().isoformat()} | Go / No-Go / Pivot |",
    )
    return replaced


def render_decision_log(template: str, project: str, owner: str, insights: dict[str, Any]) -> str:
    today = date.today().isoformat()
    focus = _sanitize_cell(insights["opportunities"][0] if insights["opportunities"] else "Core MVP flow")

    replaced = template
    replaced = replaced.replace("- Project:", f"- Project: {project}")
    replaced = replaced.replace("- Maintainer:", f"- Maintainer: {owner}")
    replaced = replaced.replace("- Last Updated:", f"- Last Updated: {today}")

    replaced = replaced.replace(
        "### DEC-001 — [Decision Title]",
        f"### DEC-001 — Prioritize {focus} as MVP must-have",
    )
    replaced = replaced.replace("- Date:", f"- Date: {today}", 1)
    replaced = replaced.replace("- Owner:", f"- Owner: {owner}", 1)
    replaced = replaced.replace(
        "- Context:",
        "- Context: Initial synthesis of NotebookLM report indicates highest impact in core workflow simplification.",
        1,
    )
    replaced = replaced.replace(
        "- Decision:",
        "- Decision: Treat this capability as Must-have for MVP and gate release readiness on its acceptance tests.",
        1,
    )
    replaced = replaced.replace(
        "- Rationale:",
        "- Rationale: Highest expected value with manageable effort and strong strategic alignment.",
        1,
    )

    # Fill DEC-002 similarly (replace second occurrences)
    replaced = replaced.replace(
        "### DEC-002 — [Decision Title]",
        "### DEC-002 — Enforce POC gate before committing full roadmap",
    )
    second_date_idx = replaced.find("- Date:", replaced.find("### DEC-002"))
    if second_date_idx != -1:
        replaced = replaced[:second_date_idx] + f"- Date: {today}" + replaced[second_date_idx + len("- Date:"):]

    second_owner_idx = replaced.find("- Owner:", replaced.find("### DEC-002"))
    if second_owner_idx != -1:
        replaced = replaced[:second_owner_idx] + f"- Owner: {owner}" + replaced[second_owner_idx + len("- Owner:"):]

    second_context_idx = replaced.find("- Context:", replaced.find("### DEC-002"))
    if second_context_idx != -1:
        repl = "- Context: Top risks require evidence before locking downstream scope and commitments."
        replaced = replaced[:second_context_idx] + repl + replaced[second_context_idx + len("- Context:"):]

    second_decision_idx = replaced.find("- Decision:", replaced.find("### DEC-002"))
    if second_decision_idx != -1:
        repl = "- Decision: Run a 2-week POC and proceed only on Go criteria with explicit no-go fallback."
        replaced = replaced[:second_decision_idx] + repl + replaced[second_decision_idx + len("- Decision:"):]

    second_rationale_idx = replaced.find("- Rationale:", replaced.find("### DEC-002"))
    if second_rationale_idx != -1:
        repl = "- Rationale: Reduces wasted build effort and improves confidence in roadmap sequencing."
        replaced = replaced[:second_rationale_idx] + repl + replaced[second_rationale_idx + len("- Rationale:"):]

    return replaced


def main() -> None:
    args = parse_args()

    assets_dir = Path(args.assets_dir).expanduser().resolve()
    templates_dir = Path(args.templates_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else assets_dir / "prefilled"

    report_path = assets_dir / "notebooklm-report.md"
    csv_path = assets_dir / "notebooklm-data-table.csv"
    manifest_path = assets_dir / "manifest.json"

    if not report_path.exists():
        raise SystemExit(f"Missing required report file: {report_path}")

    prd_tpl = templates_dir / "PRDTemplate.md"
    backlog_tpl = templates_dir / "BacklogScoringTemplate.md"
    decision_tpl = templates_dir / "DecisionLogTemplate.md"
    for req in [prd_tpl, backlog_tpl, decision_tpl]:
        if not req.exists():
            raise SystemExit(f"Missing template file: {req}")

    report_text = _read(report_path)
    csv_rows = parse_csv_rows(csv_path)

    manifest = None
    if manifest_path.exists():
        try:
            manifest = json.loads(_read(manifest_path))
        except json.JSONDecodeError:
            manifest = None

    insights = parse_report(report_text)
    project = infer_project_name(manifest, args.project, insights["title"])

    prd = render_prd(_read(prd_tpl), project, args.owner, insights, csv_rows)
    backlog = render_backlog(_read(backlog_tpl), insights, csv_rows)
    decision_log = render_decision_log(_read(decision_tpl), project, args.owner, insights)

    prd_out = output_dir / "PRDTemplate.prefilled.md"
    backlog_out = output_dir / "BacklogScoringTemplate.prefilled.md"
    decision_out = output_dir / "DecisionLogTemplate.prefilled.md"

    _write(prd_out, prd)
    _write(backlog_out, backlog)
    _write(decision_out, decision_log)

    result = {
        "assets_dir": str(assets_dir),
        "output_dir": str(output_dir),
        "generated": {
            "prd": str(prd_out),
            "backlog": str(backlog_out),
            "decision_log": str(decision_out),
        },
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
