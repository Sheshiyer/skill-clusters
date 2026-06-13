#!/Library/Frameworks/Python.framework/Versions/3.13/bin/python3.13
"""Generate MVP planning assets via notebooklm-py.

Requires prior auth:
  notebooklm login

Example:
  ./generate_assets_notebooklm.py \
    --title "MVP Research - Billing" \
    --source "https://example.com/competitor" \
    --source ./notes/problem-statement.md \
    --asset report --asset mind-map --asset data-table --asset quiz \
    --output-dir ./outputs/mvp-billing
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from notebooklm import NotebookLMClient, ReportFormat, QuizDifficulty, QuizQuantity


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate MVP assets using notebooklm-py")
    parser.add_argument("--title", required=True, help="Notebook title when creating a notebook")
    parser.add_argument("--notebook-id", help="Use an existing notebook instead of creating one")
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        help="Source URL or local file path. Repeat for multiple sources.",
    )
    parser.add_argument(
        "--asset",
        action="append",
        choices=["report", "mind-map", "data-table", "quiz", "flashcards"],
        default=None,
        help="Assets to generate (repeatable)",
    )
    parser.add_argument("--language", default="en", help="Artifact language")
    parser.add_argument("--output-dir", required=True, help="Directory for generated files")
    parser.add_argument("--timeout", type=float, default=1200, help="Wait timeout in seconds")
    parser.add_argument(
        "--report-format",
        choices=["briefing_doc", "study_guide", "blog_post", "custom"],
        default="briefing_doc",
    )
    parser.add_argument("--report-prompt", default=None, help="Custom report prompt (optional)")
    parser.add_argument(
        "--quiz-difficulty",
        choices=["easy", "medium", "hard"],
        default="medium",
    )
    parser.add_argument(
        "--quiz-quantity",
        choices=["fewer", "standard", "more"],
        default="standard",
    )
    return parser.parse_args()


def _is_url(s: str) -> bool:
    return s.startswith("http://") or s.startswith("https://")


async def _wait_and_check(client: NotebookLMClient, notebook_id: str, task_id: str, timeout: float):
    status = await client.artifacts.wait_for_completion(notebook_id, task_id, timeout=timeout)
    if status.status.lower() not in {"completed", "complete", "done", "success"}:
        raise RuntimeError(
            f"Artifact generation failed or incomplete (task_id={task_id}, status={status.status}, error={status.error})"
        )
    return status


async def run(args: argparse.Namespace) -> dict[str, Any]:
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    assets = args.asset or ["report", "mind-map", "data-table"]

    report_format_map = {
        "briefing_doc": ReportFormat.BRIEFING_DOC,
        "study_guide": ReportFormat.STUDY_GUIDE,
        "blog_post": ReportFormat.BLOG_POST,
        "custom": ReportFormat.CUSTOM,
    }
    quiz_diff_map = {
        "easy": QuizDifficulty.EASY,
        "medium": QuizDifficulty.MEDIUM,
        "hard": QuizDifficulty.HARD,
    }
    quiz_qty_map = {
        "fewer": QuizQuantity.FEWER,
        "standard": QuizQuantity.STANDARD,
        "more": QuizQuantity.MORE,
    }

    async with await NotebookLMClient.from_storage() as client:
        # Notebook selection
        if args.notebook_id:
            notebook_id = args.notebook_id
            notebook_title = (await client.notebooks.get(notebook_id)).title
        else:
            nb = await client.notebooks.create(args.title)
            notebook_id = nb.id
            notebook_title = nb.title

        added_sources = []
        failed_sources = []
        for src in args.source:
            try:
                if _is_url(src):
                    s = await client.sources.add_url(notebook_id, src, wait=True, wait_timeout=min(args.timeout, 600))
                else:
                    p = Path(src).expanduser().resolve()
                    if not p.exists():
                        raise FileNotFoundError(f"Source file not found: {src}")
                    if p.suffix.lower() in {".md", ".mdx", ".txt"}:
                        text_content = p.read_text(encoding="utf-8", errors="ignore")
                        s = await client.sources.add_text(
                            notebook_id,
                            title=p.name,
                            content=text_content,
                            wait=True,
                            wait_timeout=min(args.timeout, 600),
                        )
                    else:
                        s = await client.sources.add_file(notebook_id, p, wait=True, wait_timeout=min(args.timeout, 600))
                added_sources.append({"id": s.id, "title": s.title, "status": str(s.status), "input": src})
            except Exception as e:
                failed_sources.append({"input": src, "error": str(e)})

        if not added_sources:
            raise RuntimeError(
                "No sources were successfully added. "
                "Check source formats and auth/session state."
            )

        outputs: dict[str, str] = {}

        if "report" in assets:
            gen = await client.artifacts.generate_report(
                notebook_id,
                report_format=report_format_map[args.report_format],
                language=args.language,
                custom_prompt=args.report_prompt,
            )
            await _wait_and_check(client, notebook_id, gen.task_id, args.timeout)
            out = out_dir / "notebooklm-report.md"
            await client.artifacts.download_report(notebook_id, str(out))
            outputs["report"] = str(out)

        if "mind-map" in assets:
            mind_map = await client.artifacts.generate_mind_map(notebook_id)
            out = out_dir / "notebooklm-mind-map.json"
            out.write_text(json.dumps(mind_map, indent=2), encoding="utf-8")
            outputs["mind-map"] = str(out)

        if "data-table" in assets:
            gen = await client.artifacts.generate_data_table(notebook_id, language=args.language)
            await _wait_and_check(client, notebook_id, gen.task_id, args.timeout)
            out = out_dir / "notebooklm-data-table.csv"
            await client.artifacts.download_data_table(notebook_id, str(out))
            outputs["data-table"] = str(out)

        if "quiz" in assets:
            gen = await client.artifacts.generate_quiz(
                notebook_id,
                difficulty=quiz_diff_map[args.quiz_difficulty],
                quantity=quiz_qty_map[args.quiz_quantity],
            )
            await _wait_and_check(client, notebook_id, gen.task_id, args.timeout)
            out = out_dir / "notebooklm-quiz.md"
            await client.artifacts.download_quiz(notebook_id, str(out), output_format="markdown")
            outputs["quiz"] = str(out)

        if "flashcards" in assets:
            gen = await client.artifacts.generate_flashcards(
                notebook_id,
                difficulty=quiz_diff_map[args.quiz_difficulty],
                quantity=quiz_qty_map[args.quiz_quantity],
            )
            await _wait_and_check(client, notebook_id, gen.task_id, args.timeout)
            out = out_dir / "notebooklm-flashcards.md"
            await client.artifacts.download_flashcards(notebook_id, str(out), output_format="markdown")
            outputs["flashcards"] = str(out)

        manifest = {
            "notebook": {"id": notebook_id, "title": notebook_title},
            "sources": added_sources,
            "failed_sources": failed_sources,
            "assets": outputs,
        }

        manifest_path = out_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        return manifest


def main() -> None:
    args = parse_args()
    try:
        result = asyncio.run(run(args))
        print(json.dumps(result, indent=2))
    except Exception as exc:
        msg = str(exc)
        if "Authentication expired" in msg or "storage_state.json" in msg:
            msg += "\nHint: run `notebooklm login` first."
        raise SystemExit(msg)


if __name__ == "__main__":
    main()
