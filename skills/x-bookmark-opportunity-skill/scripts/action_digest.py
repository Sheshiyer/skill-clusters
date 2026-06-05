#!/usr/bin/env python3
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
from datetime import datetime, UTC

ITEMS_DIR = Path('/Volumes/madara/2026/twc-vault/processing/x-bookmarks/items')
OUT_DIR = Path('/Volumes/madara/2026/twc-vault/processing/x-bookmarks/reports')
STATE_FILE = Path('/Volumes/madara/2026/twc-vault/processing/x-bookmarks/.state/action-digest-state.json')

KEYWORDS = [
    ("Technology/Engineering", "Type 5", ["github", "repo", "api", "agent", "tool", "open source", "python", "javascript", "typescript", "automation", "openclaw"]),
    ("Health/Wellness", "Type 3", ["health", "sleep", "wellness", "biohack", "hormone"]),
    ("Critical-Thinking/Power-Analysis", "Type 8", ["policy", "power", "control", "system", "governance"]),
    ("Occult/Esoteric-Knowledge", "Type 4", ["occult", "mystic", "esoteric", "ritual", "tarot"]),
    ("Consciousness/Altered-States", "Type 9", ["consciousness", "meditation", "awareness", "psychedelic"]),
]


def read_text(md: Path) -> str:
    t = md.read_text(encoding='utf-8', errors='ignore')
    m = re.search(r"## Text\n\n(.*?)\n\n## Metadata", t, re.S)
    return (m.group(1) if m else t).strip()


def classify(text: str):
    low = text.lower()
    best = ("Knowledge/Research", "Type 5", 0)
    for domain, typ, kws in KEYWORDS:
        score = sum(1 for k in kws if k in low)
        if score > best[2]:
            best = (domain, typ, score)
    return {"domain": best[0], "enneagram": best[1], "score": best[2], "para_bucket": "Resources"}


def effort(text: str) -> str:
    low = text.lower()
    if any(k in low for k in ["architecture", "framework", "platform", "monorepo"]):
        return "2-4h"
    if any(k in low for k in ["script", "tool", "template", "cli", "workflow", "open source"]):
        return "60m"
    return "20m"


def next_steps(text: str):
    low = text.lower()
    steps = []
    if "github" in low or "repo" in low:
        steps.append("Clone/test in sandbox with one real dataset")
    if "api" in low or "agent" in low or "openclaw" in low:
        steps.append("Wrap as a small local automation command in modules/")
    if "open source" in low:
        steps.append("Evaluate license + fit; add to reusable tool stack")
    if not steps:
        steps = ["Run a 20-minute feasibility spike and capture result in chitta-track"]
    return steps[:3]


def lane_for(domain: str) -> str:
    return "vishwakarma-build" if domain.startswith("Technology/") else "chitta-track"


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"seen": []}


def save_state(s):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(s, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-do-now', type=int, default=5)
    ap.add_argument('--max-schedule', type=int, default=5)
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()
    seen = set(state.get("seen", []))

    items = sorted(ITEMS_DIR.glob('*.md'), key=lambda p: p.stat().st_mtime, reverse=True)
    new_items = [p for p in items if p.stem not in seen]

    candidates = []
    for p in new_items:
        text = read_text(p)
        cls = classify(text)
        ef = effort(text)
        candidates.append({
            "tweet_id": p.stem,
            "classification": cls,
            "effort": ef,
            "next_steps": next_steps(text),
            "lane": lane_for(cls["domain"]),
            "why": text[:180].replace('\n', ' ') + ("..." if len(text) > 180 else "")
        })

    do_now = [c for c in candidates if c["effort"] in ("20m", "60m")][: args.max_do_now]
    schedule = [c for c in candidates if c["effort"] == "2-4h"][: args.max_schedule]

    digest = {
        "generated_at": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        "new_count": len(new_items),
        "do_now": do_now,
        "schedule": schedule,
        "parked": candidates[args.max_do_now + args.max_schedule :],
        "channel_plan": {
            "tattva-stream": "pulse only",
            "akashic-records": "daily practical digest",
            "kala-time": "top scheduled candidates",
            "kriya-logs": "telemetry"
        }
    }

    ts = datetime.now().strftime('%Y%m%d-%H%M%S')
    out = OUT_DIR / f'action-digest-{ts}.json'
    out.write_text(json.dumps(digest, indent=2))

    seen.update(p.stem for p in new_items)
    state["seen"] = sorted(seen)
    save_state(state)

    print(json.dumps({"ok": True, "out": str(out), "new_count": len(new_items), "do_now": len(do_now), "schedule": len(schedule)}, indent=2))


if __name__ == '__main__':
    main()
