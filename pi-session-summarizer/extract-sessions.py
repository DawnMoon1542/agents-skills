#!/usr/bin/env python3
"""
Extract first user messages from pi agent session files within a date range.
Outputs JSON grouped by session directory (project).

Usage:
    python3 extract-sessions.py --from 2026-05-01 --to 2026-05-18
    python3 extract-sessions.py --from 2026-05-01 --to 2026-05-18 --output /tmp/result.json
"""
import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime


def extract_first_user_message(filepath: str) -> tuple[str, str, str] | None:
    """Return (timestamp_iso, cwd, first_user_text) or None."""
    try:
        with open(filepath) as f:
            ts: str = ""
            cwd: str = ""
            for line in f:
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                t = rec.get("type")
                if t == "session":
                    ts = rec.get("timestamp", "")
                    cwd = rec.get("cwd", "")
                elif t == "message" and rec.get("message", {}).get("role") == "user":
                    content = rec["message"].get("content", [])
                    text = "".join(
                        c.get("text", "") for c in content if c.get("type") == "text"
                    )
                    return ts, cwd, text.strip()
    except Exception:
        pass
    return None


def parse_session_date(filename: str) -> str:
    """Extract YYYY-MM-DD from session filename like 2026-05-08T09-09-08-183Z_....jsonl"""
    return filename[:10]


def main():
    parser = argparse.ArgumentParser(
        description="Extract first user messages from pi agent session files."
    )
    parser.add_argument("--from", dest="date_from", required=True, help="Start date YYYY-MM-DD")
    parser.add_argument("--to", dest="date_to", required=True, help="End date YYYY-MM-DD")
    parser.add_argument(
        "--sessions-dir",
        default=os.path.expanduser("~/.pi/agent/sessions"),
        help="Sessions root directory",
    )
    parser.add_argument("--output", help="Output JSON file path (default: stdout)")
    args = parser.parse_args()

    results: dict[str, list[dict]] = defaultdict(list)
    date_from = args.date_from
    date_to = args.date_to

    for dirpath, _, filenames in os.walk(args.sessions_dir):
        for fname in sorted(filenames):
            if not fname.endswith(".jsonl") or fname == "subagents.jsonl":
                continue
            session_date = parse_session_date(fname)
            if not (date_from <= session_date <= date_to):
                continue
            fullpath = os.path.join(dirpath, fname)
            info = extract_first_user_message(fullpath)
            if info is None:
                continue

            ts, cwd, text = info
            project = os.path.basename(dirpath)
            results[project].append({
                "file": fname,
                "timestamp": ts,
                "cwd": cwd,
                "text": text,
            })

    total = sum(len(v) for v in results.values())
    output = {
        "date_range": {"from": date_from, "to": date_to},
        "total_sessions": total,
        "total_projects": len(results),
        "projects": {
            name: entries
            for name, entries in sorted(results.items(), key=lambda x: -len(x[1]))
        },
    }

    json_text = json.dumps(output, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, "w") as f:
            f.write(json_text)
        print(f"Output written to {args.output} ({total} sessions, {len(results)} projects)")
    else:
        sys.stdout.write(json_text)


if __name__ == "__main__":
    main()
