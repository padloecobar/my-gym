#!/usr/bin/env python3

"""
snapshot-tools.py — Utilities for SNAPSHOT v1 concatenated repo dumps.

Snapshot format (simplified):
  SNAPSHOT v1
  ROOT: ...
  SCOPE: ...
  CREATED_UTC: ...
  FILE: /abs/path/to/file
  BEGIN
  <contents>
  END
  FILE: ...

Works on macOS/Linux. Python 3.9+ recommended.
"""

from __future__ import annotations

import argparse
import difflib
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Generator, Iterable, List, Optional, Tuple


@dataclass
class FileBlock:
    path: str                 # absolute path as stored in snapshot
    content: str              # file contents between BEGIN/END
    start_line_in_snapshot: int  # where content starts in the snapshot file (1-indexed)


SNAPSHOT_HEADER_RE = re.compile(r"^SNAPSHOT v1\s*$")
FILE_RE = re.compile(r"^FILE:\s+(.*)\s*$")
BEGIN_RE = re.compile(r"^BEGIN\s*$")
END_RE = re.compile(r"^END\s*$")


def iter_file_blocks(snapshot_path: str) -> Generator[FileBlock, None, None]:
    """
    Stream-parse the snapshot file into FileBlocks without loading everything into memory.
    """
    with open(snapshot_path, "r", encoding="utf-8", errors="replace") as f:
        line_no = 0
        current_path: Optional[str] = None
        in_block = False
        buf: List[str] = []
        content_start_line = 0

        for raw in f:
            line_no += 1
            line = raw.rstrip("\n")

            m = FILE_RE.match(line)
            if m and not in_block:
                current_path = m.group(1)
                continue

            if current_path is not None and BEGIN_RE.match(line) and not in_block:
                in_block = True
                buf = []
                content_start_line = line_no + 1
                continue

            if in_block and END_RE.match(line):
                # emit block
                yield FileBlock(
                    path=current_path or "",
                    content="\n".join(buf) + ("\n" if buf else ""),
                    start_line_in_snapshot=content_start_line,
                )
                # reset
                current_path = None
                in_block = False
                buf = []
                content_start_line = 0
                continue

            if in_block:
                buf.append(line)

        # If file ends while in_block, emit what we have (best effort)
        if in_block and current_path:
            yield FileBlock(
                path=current_path,
                content="\n".join(buf) + ("\n" if buf else ""),
                start_line_in_snapshot=content_start_line,
            )


def list_files(snapshot_path: str) -> List[str]:
    return [fb.path for fb in iter_file_blocks(snapshot_path)]


def get_file(snapshot_path: str, file_path: str) -> Optional[FileBlock]:
    """
    Exact match on the FILE: absolute path stored in snapshot.
    """
    for fb in iter_file_blocks(snapshot_path):
        if fb.path == file_path:
            return fb
    return None


def search_regex(
    snapshot_path: str,
    pattern: str,
    context: int = 3,
    ignore_case: bool = False,
    max_hits_per_file: int = 200,
) -> List[str]:
    """
    Regex search inside file contents. Returns printable strings grouped by file.
    """
    flags = re.MULTILINE
    if ignore_case:
        flags |= re.IGNORECASE

    try:
        rx = re.compile(pattern, flags)
    except re.error as e:
        raise SystemExit(f"Invalid regex: {e}")

    out: List[str] = []
    for fb in iter_file_blocks(snapshot_path):
        lines = fb.content.splitlines()
        hits: List[int] = []
        for idx, line in enumerate(lines, start=1):
            if rx.search(line):
                hits.append(idx)
                if len(hits) >= max_hits_per_file:
                    break

        if not hits:
            continue

        out.append(f"FILE: {fb.path}")
        out.append(f"(showing context={context}, hits={len(hits)})")

        # Merge overlapping context windows
        merged: List[Tuple[int, int, int]] = []
        for h in hits:
            start = max(1, h - context)
            end = min(len(lines), h + context)
            if not merged:
                merged.append((start, end, h))
            else:
                prev_start, prev_end, prev_h = merged[-1]
                if start <= prev_end:
                    merged[-1] = (prev_start, max(prev_end, end), h)
                else:
                    merged.append((start, end, h))

        for start, end, last_hit in merged:
            for ln in range(start, end + 1):
                prefix = ">>" if ln in hits else "  "
                out.append(f"{prefix} {ln:5d} | {lines[ln-1]}")
            out.append("")

        out.append("-" * 80)

    return out


def fuzzy_find_files(
    snapshot_path: str,
    query: str,
    limit: int = 20,
) -> List[Tuple[float, str]]:
    """
    Fuzzy-ish file path search:
    - exact substring matches first (score 1.0)
    - then similarity on basename and full path
    Uses stdlib difflib (no deps).
    """
    q = query.strip().lower()
    if not q:
        return []

    results: List[Tuple[float, str]] = []
    for p in list_files(snapshot_path):
        pl = p.lower()
        if q in pl:
            results.append((1.0, p))
            continue

        base = os.path.basename(pl)
        s1 = difflib.SequenceMatcher(None, q, base).ratio()
        s2 = difflib.SequenceMatcher(None, q, pl).ratio()
        score = max(s1, s2) * 0.95  # keep below true substring matches
        if score >= 0.55:
            results.append((score, p))

    results.sort(key=lambda x: x[0], reverse=True)
    return results[:limit]


def export_snapshot(snapshot_path: str, out_dir: str, strip_prefix: Optional[str] = None) -> int:
    """
    Write snapshot files out to a folder so you can use rg/IDE normally.
    strip_prefix: if provided, this absolute prefix will be removed from FILE: paths.
                  Example: "/Users/pavelkulikou/Projects/my-gym/gym-app/"
    """
    out_root = Path(out_dir)
    out_root.mkdir(parents=True, exist_ok=True)

    count = 0
    for fb in iter_file_blocks(snapshot_path):
        rel = fb.path
        if strip_prefix and rel.startswith(strip_prefix):
            rel = rel[len(strip_prefix):]
        rel = rel.lstrip("/")

        target = out_root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(fb.content, encoding="utf-8")
        count += 1

    return count


def main() -> None:
    ap = argparse.ArgumentParser(prog="snapshot-tools.py", description="Tools for SNAPSHOT v1 project dumps.")
    ap.add_argument("snapshot", help="Path to snapshot file (e.g., project.txt)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="List file paths in snapshot")
    p_list.add_argument("--limit", type=int, default=0, help="Limit output lines (0 = no limit)")

    p_get = sub.add_parser("get", help="Print file contents by exact FILE: path")
    p_get.add_argument("path", help="Exact path as stored in FILE: header")
    p_get.add_argument("--head", type=int, default=0, help="Print only first N lines")
    p_get.add_argument("--tail", type=int, default=0, help="Print only last N lines")

    p_search = sub.add_parser("search", help="Regex search file contents with context")
    p_search.add_argument("regex", help="Regex pattern")
    p_search.add_argument("-C", "--context", type=int, default=3, help="Context lines around hits")
    p_search.add_argument("-i", "--ignore-case", action="store_true", help="Case-insensitive search")

    p_ff = sub.add_parser("ff", help="Fuzzy-ish find file paths by query")
    p_ff.add_argument("query", help="Query string")
    p_ff.add_argument("--limit", type=int, default=20, help="Max results")

    p_export = sub.add_parser("export", help="Export snapshot into a folder")
    p_export.add_argument("out_dir", help="Output directory")
    p_export.add_argument("--strip-prefix", default=None, help="Remove this prefix from FILE paths")

    args = ap.parse_args()

    if args.cmd == "list":
        files = list_files(args.snapshot)
        if args.limit and args.limit > 0:
            files = files[: args.limit]
        print("\n".join(files))
        return

    if args.cmd == "get":
        fb = get_file(args.snapshot, args.path)
        if not fb:
            raise SystemExit(f"Not found: {args.path}")
        lines = fb.content.splitlines()
        if args.head and args.head > 0:
            lines = lines[: args.head]
        if args.tail and args.tail > 0:
            lines = lines[-args.tail :]
        print("\n".join(lines))
        return

    if args.cmd == "search":
        results = search_regex(
            args.snapshot,
            args.regex,
            context=args.context,
            ignore_case=args.ignore_case,
        )
        if not results:
            print("No matches.")
            return
        print("\n".join(results))
        return

    if args.cmd == "ff":
        hits = fuzzy_find_files(args.snapshot, args.query, limit=args.limit)
        if not hits:
            print("No matches.")
            return
        for score, path in hits:
            print(f"{score:0.3f}\t{path}")
        return

    if args.cmd == "export":
        n = export_snapshot(args.snapshot, args.out_dir, strip_prefix=args.strip_prefix)
        print(f"Exported {n} files to {args.out_dir}")
        return


if __name__ == "__main__":
    main()
