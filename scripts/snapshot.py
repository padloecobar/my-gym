#!/usr/bin/env python3
"""
snapshot_repo_v1.py

Create a monolithic “snapshot” text file containing:
- repo ROOT (absolute)
- SCOPE (relative subdir under ROOT)
- a list of text files with ABSOLUTE PATH + full contents

This snapshot is meant to be pasted/uploaded to an AI so it can propose edits.
"""

from __future__ import annotations

import argparse
import fnmatch
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional


HEADER = "SNAPSHOT v1"

# LLM-friendly structure message (written into output)
STRUCTURE_MESSAGE = """\
### FILE STRUCTURE (for LLMs)
This snapshot is a concatenation of multiple source files.

Parsing rules:
- The file begins with a header section:
    SNAPSHOT v1
    ROOT: <absolute repo root>
    SCOPE: <relative scope under root>
    CREATED_UTC: <timestamp>

- Then there are zero or more file blocks, each shaped exactly like:
    FILE: <absolute path>
    BEGIN
    <file contents...>
    END

Notes:
- Only treat text between BEGIN and END as the file contents.
- Paths in FILE: are absolute.
- File blocks are independent; do not assume implicit continuation across blocks.

### BEGIN SNAPSHOT
"""

DEFAULT_EXCLUDES = [
    "**/.git/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/.cache/**",
    "**/.DS_Store",
    "**/*.md"
]

# Directory names to prune during scanning (performance win)
PRUNE_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".cache",
}


@dataclass(frozen=True)
class SnapshotFile:
    abs_path: Path
    rel_path_posix: str
    content: str


def matches_any(path_posix: str, patterns: List[str]) -> bool:
    return any(fnmatch.fnmatch(path_posix, pat) for pat in patterns)


def normalize_patterns(patterns: List[str]) -> List[str]:
    """
    Keep user patterns glob-style, but make common forms friendlier.
    - If user writes "app/**" while scope="my-app", they probably meant repo-relative.
    - We don't rewrite aggressively; we just keep as-is and also allow matching against scope-relative.
    """
    return [p.strip() for p in patterns if p and p.strip()]


def is_text_utf8(path: Path, probe: int = 8192) -> bool:
    """
    Stronger than NUL-byte check: try decoding a probe as UTF-8.
    """
    try:
        b = path.read_bytes()[:probe]
    except Exception:
        return False
    try:
        b.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def iter_files_pruned(scope_abs: Path) -> Iterable[Path]:
    """
    Walk files under scope, pruning heavy dirs early.
    Using Path.rglob("*") gives no pruning hook, so we do a manual DFS.
    """
    stack = [scope_abs]
    while stack:
        cur = stack.pop()
        try:
            for child in cur.iterdir():
                if child.is_dir():
                    if child.name in PRUNE_DIR_NAMES:
                        continue
                    stack.append(child)
                elif child.is_file():
                    yield child
        except PermissionError:
            continue


def main() -> int:
    ap = argparse.ArgumentParser(description="Create a monolithic repo snapshot (SNAPSHOT v1).")
    ap.add_argument("--root", default=".", help="Repo root directory (default: .)")
    ap.add_argument("--scope", default=".", help="Scope folder relative to root (default: .)")
    ap.add_argument(
        "--include",
        action="append",
        default=[],
        help="Glob include (repeatable). If empty, includes all under scope.",
    )
    ap.add_argument("--exclude", action="append", default=[], help="Glob exclude (repeatable).")
    ap.add_argument("--max-bytes", type=int, default=700_000, help="Skip files larger than this many bytes.")
    ap.add_argument("--out", help="Output snapshot file (required unless --dry-run).")
    ap.add_argument("--dry-run", action="store_true", help="Print included files and exit.")
    args = ap.parse_args()

    root = Path(args.root).expanduser().resolve()
    scope_rel = Path(args.scope)
    scope_abs = (root / scope_rel).resolve()

    if not root.exists():
        raise SystemExit(f"[FATAL] ROOT not found: {root}")
    if not scope_abs.exists():
        raise SystemExit(f"[FATAL] SCOPE not found: {scope_abs}")

    includes: List[str] = normalize_patterns(args.include)
    excludes: List[str] = DEFAULT_EXCLUDES + normalize_patterns(args.exclude)

    files: List[SnapshotFile] = []

    for p in iter_files_pruned(scope_abs):
        # Match patterns against repo-relative posix path
        try:
            rel_repo = p.relative_to(root).as_posix()
        except ValueError:
            # Shouldn't happen if scope is under root, but keep it safe.
            continue

        if matches_any(rel_repo, excludes):
            continue

        # Includes are intended as repo-relative globs in the examples.
        # Additionally, allow matching against scope-relative to be forgiving.
        if includes:
            rel_scope = p.relative_to(scope_abs).as_posix()
            if not (matches_any(rel_repo, includes) or matches_any(rel_scope, includes)):
                continue

        try:
            size = p.stat().st_size
        except OSError:
            continue
        if size > args.max_bytes:
            continue

        if not is_text_utf8(p):
            continue

        try:
            content = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        files.append(SnapshotFile(abs_path=p, rel_path_posix=rel_repo, content=content))

    files.sort(key=lambda x: x.rel_path_posix)

    if args.dry_run:
        print(f"[DRYRUN] ROOT:  {root}")
        print(f"[DRYRUN] SCOPE: {scope_rel.as_posix()}")
        print(f"[DRYRUN] Files: {len(files)}")
        for f in files:
            print(f"  {f.rel_path_posix}")
        return 0

    if not args.out:
        raise SystemExit("[FATAL] --out is required unless --dry-run")

    out = Path(args.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with out.open("w", encoding="utf-8", newline="") as fp:
        fp.write(STRUCTURE_MESSAGE)
        fp.write(f"{HEADER}\n")
        fp.write(f"ROOT: {root.as_posix()}\n")
        fp.write(f"SCOPE: {scope_rel.as_posix()}\n")
        fp.write(f"CREATED_UTC: {created}\n")
        fp.write(f"FILES_INCLUDED: {len(files)}\n\n")

        for f in files:
            fp.write(f"FILE: {f.abs_path.as_posix()}\n")
            fp.write("BEGIN\n")
            fp.write(f.content)
            if not f.content.endswith("\n"):
                fp.write("\n")
            fp.write("END\n\n")

    print(f"[OK] Snapshot written: {out}")
    print(f"[OK] Files included: {len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
