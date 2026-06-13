#!/usr/bin/env python3
"""Run end-to-end MVP planning pipeline.

Pipeline:
1) Generate NotebookLM assets from project sources
2) Prefill PRD/backlog/decision templates

Example:
  ./run_mvp_pipeline.py \
    --project-dir /path/to/repo \
    --owner "PM" \
    --asset report --asset mind-map --asset data-table
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run NotebookLM + template prefill MVP pipeline")
    p.add_argument("--project-dir", required=True, help="Target project folder for source discovery")
    p.add_argument("--title", default=None, help="Notebook title override")
    p.add_argument("--project-name", default=None, help="Project display name override")
    p.add_argument("--owner", default="TBD", help="Owner for prefilled docs")
    p.add_argument(
        "--asset",
        action="append",
        choices=["report", "mind-map", "data-table", "quiz", "flashcards"],
        default=None,
        help="Assets to generate (repeatable)",
    )
    p.add_argument("--language", default="en")
    p.add_argument("--timeout", type=float, default=1200)
    p.add_argument(
        "--max-sources",
        type=int,
        default=6,
        help="Maximum auto-discovered sources to feed into NotebookLM",
    )
    p.add_argument(
        "--source",
        action="append",
        default=[],
        help="Additional source URL/file path (repeatable)",
    )
    p.add_argument(
        "--output-root",
        default=None,
        help="Root output directory (default: <skill-dir>/outputs/<project-name-slug>)",
    )
    return p.parse_args()


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, text=True, capture_output=True)


def ensure_notebooklm_auth() -> None:
    check = run(["notebooklm", "list", "--json"])
    if check.returncode != 0:
        raise SystemExit(
            "NotebookLM auth check failed. Run `notebooklm login` then retry.\n"
            f"stderr: {check.stderr.strip()}"
        )


def discover_sources(project_dir: Path, max_sources: int) -> list[str]:
    candidates = []

    # Priority files
    priority = [
        project_dir / "README.md",
        project_dir / "tasks" / "README.md",
    ]
    for p in priority:
        if p.exists() and p.is_file():
            candidates.append(str(p))

    # Additional markdown + key manifests
    patterns = ["**/*.md", "**/*.mdx", "**/*.txt", "**/*.pdf", "**/*.docx"]
    skip_parts = {".git", "node_modules", "dist", "build", ".next", ".turbo", "coverage", "audit-output"}

    for pattern in patterns:
        for p in project_dir.glob(pattern):
            if not p.is_file():
                continue
            if any(part in skip_parts for part in p.parts):
                continue
            if str(p) not in candidates:
                candidates.append(str(p))
            if len(candidates) >= max_sources:
                return candidates[:max_sources]

    return candidates[:max_sources]


def slugify(name: str) -> str:
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-")
    while "--" in out:
        out = out.replace("--", "-")
    return out or "project"


def main() -> None:
    args = parse_args()
    skill_dir = Path(__file__).resolve().parent
    project_dir = Path(args.project_dir).expanduser().resolve()

    if not project_dir.exists() or not project_dir.is_dir():
        raise SystemExit(f"Invalid --project-dir: {project_dir}")

    project_name = args.project_name or project_dir.name
    title = args.title or f"MVP Research - {project_name}"
    assets = args.asset or ["report", "mind-map", "data-table"]

    output_root = Path(args.output_root).expanduser().resolve() if args.output_root else (skill_dir / "outputs" / slugify(project_name))
    assets_dir = output_root / "assets"
    prefilled_dir = output_root / "prefilled"
    assets_dir.mkdir(parents=True, exist_ok=True)
    prefilled_dir.mkdir(parents=True, exist_ok=True)

    ensure_notebooklm_auth()

    sources = discover_sources(project_dir, args.max_sources)
    for s in args.source:
        sources.append(s)

    # de-duplicate while preserving order
    dedup_sources = []
    seen = set()
    for s in sources:
        if s not in seen:
            dedup_sources.append(s)
            seen.add(s)
    sources = dedup_sources

    if not sources:
        raise SystemExit("No sources discovered. Provide --source explicitly.")

    gen_script = skill_dir / "generate_assets_notebooklm.py"
    prefill_script = skill_dir / "prefill_templates_from_assets.py"

    gen_cmd = [
        str(gen_script),
        "--title",
        title,
        "--output-dir",
        str(assets_dir),
        "--language",
        args.language,
        "--timeout",
        str(args.timeout),
    ]
    for a in assets:
        gen_cmd += ["--asset", a]
    for s in sources:
        gen_cmd += ["--source", s]

    gen = run(gen_cmd)
    if gen.returncode != 0:
        raise SystemExit(
            "Asset generation failed.\n"
            f"cmd: {' '.join(gen_cmd)}\n"
            f"stderr: {gen.stderr.strip()}\n"
            f"stdout: {gen.stdout.strip()}"
        )

    prefill_cmd = [
        str(prefill_script),
        "--assets-dir",
        str(assets_dir),
        "--templates-dir",
        str(skill_dir),
        "--output-dir",
        str(prefilled_dir),
        "--project",
        project_name,
        "--owner",
        args.owner,
    ]

    pre = run(prefill_cmd)
    if pre.returncode != 0:
        raise SystemExit(
            "Template prefill failed.\n"
            f"cmd: {' '.join(prefill_cmd)}\n"
            f"stderr: {pre.stderr.strip()}\n"
            f"stdout: {pre.stdout.strip()}"
        )

    summary = {
        "project_dir": str(project_dir),
        "project_name": project_name,
        "sources_used": sources,
        "assets_dir": str(assets_dir),
        "prefilled_dir": str(prefilled_dir),
        "generator_stdout": gen.stdout.strip(),
        "prefill_stdout": pre.stdout.strip(),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
