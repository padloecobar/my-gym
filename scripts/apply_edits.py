#!/usr/bin/env python3
"""
apply_edits_v1.py

Apply EDITS v1 output to the repo using CLI, safely.

Supports:
- OP: MKDIR (create folders)
- OP: DELETE (delete files or empty folders; for non-empty folders, fails unless --force-delete-dir)
- OP: MOVE (rename/move files or folders)
- FILE blocks: create/replace full file contents

Safety:
- Requires running from inside ROOT
- Refuses to touch paths outside ROOT
- If SCOPE is provided, refuses to touch outside ROOT/SCOPE
- Creates timestamped backups for overwritten/deleted files in .edits_backups/

USAGE EXAMPLES
--------------
# Dry run first:
python3 scripts/apply_edits_v1.py --dry-run edits.txt

# Apply for real:
python3 scripts/apply_edits_v1.py edits.txt

# Prefer git mv/rm when in a git repo (default behavior):
python3 scripts/apply_edits_v1.py edits.txt

# If you want filesystem operations only:
python3 scripts/apply_edits_v1.py --no-git edits.txt
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple


HEADER = "EDITS v1"


@dataclass
class OpMkdir:
    path: str  # abs


@dataclass
class OpDelete:
    path: str  # abs


@dataclass
class OpMove:
    src: str  # abs
    dst: str  # abs


@dataclass
class FileBlock:
    path: str  # abs
    content: str


class ParseError(Exception):
    pass


def run_git(args: List[str], cwd: Path) -> bool:
    try:
        subprocess.run(["git", *args], cwd=str(cwd), check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except Exception:
        return False


def is_git_repo(root: Path) -> bool:
    return (root / ".git").exists()


def ensure_under_root(root: Path, p: Path) -> None:
    try:
        p.relative_to(root)
    except Exception:
        raise ParseError(f"Refusing to touch path outside ROOT:\n  ROOT: {root}\n  PATH: {p}")


def ensure_in_scope(root: Path, scope_rel: str, p: Path) -> None:
    scope_abs = (root / scope_rel).resolve()
    try:
        p.relative_to(scope_abs)
    except Exception:
        raise ParseError(f"Refusing to touch path outside SCOPE:\n  SCOPE: {scope_abs}\n  PATH:  {p}")


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", newline="") as tf:
        tf.write(content)
        tmp = Path(tf.name)
    tmp.replace(path)


def backup_path(root: Path, backup_dir: Path, target: Path, stamp: str) -> Path:
    rel = target.relative_to(root)
    dst = backup_dir / stamp / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    return dst


def parse_edits(text: str) -> Tuple[Path, str, List[OpMkdir], List[OpDelete], List[OpMove], List[FileBlock]]:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != HEADER:
        raise ParseError(f"First line must be exactly: {HEADER}")

    root: Optional[Path] = None
    scope: Optional[str] = None

    mkdirs: List[OpMkdir] = []
    deletes: List[OpDelete] = []
    moves: List[OpMove] = []
    files: List[FileBlock] = []

    i = 1

    re_root = re.compile(r"^ROOT:\s+(.+?)\s*$")
    re_scope = re.compile(r"^SCOPE:\s+(.+?)\s*$")
    re_mkdir = re.compile(r"^OP:\s+MKDIR\s+path=(.+?)\s*$")
    re_del = re.compile(r"^OP:\s+DELETE\s+path=(.+?)\s*$")
    re_move = re.compile(r"^OP:\s+MOVE\s+from=(.+?)\s+to=(.+?)\s*$")

    re_file = re.compile(r"^FILE:\s+(.+?)\s*$")
    re_begin = re.compile(r"^BEGIN\s*$")
    re_end = re.compile(r"^END\s*$")

    def read_block(start_idx: int) -> Tuple[str, int]:
        buf = []
        j = start_idx
        while j < len(lines):
            if re_end.match(lines[j].strip()):
                return "".join(buf), j + 1
            buf.append(lines[j])
            j += 1
        raise ParseError("Missing END for FILE block")

    while i < len(lines):
        s = lines[i].strip()
        if s == "":
            i += 1
            continue

        m = re_root.match(s)
        if m:
            root = Path(m.group(1)).expanduser().resolve()
            i += 1
            continue

        m = re_scope.match(s)
        if m:
            scope = m.group(1).strip()
            i += 1
            continue

        m = re_mkdir.match(s)
        if m:
            mkdirs.append(OpMkdir(path=m.group(1).strip()))
            i += 1
            continue

        m = re_del.match(s)
        if m:
            deletes.append(OpDelete(path=m.group(1).strip()))
            i += 1
            continue

        m = re_move.match(s)
        if m:
            moves.append(OpMove(src=m.group(1).strip(), dst=m.group(2).strip()))
            i += 1
            continue

        m = re_file.match(s)
        if m:
            path = m.group(1).strip()
            i += 1
            if i >= len(lines) or not re_begin.match(lines[i].strip()):
                raise ParseError(f"Missing BEGIN for FILE: {path}")
            i += 1
            content, i = read_block(i)
            files.append(FileBlock(path=path, content=content))
            continue

        raise ParseError(f"Unrecognized line: {s}")

    if root is None:
        raise ParseError("Missing ROOT:")
    if scope is None:
        raise ParseError("Missing SCOPE:")

    return root, scope, mkdirs, deletes, moves, files


def main() -> int:
    ap = argparse.ArgumentParser(description="Apply EDITS v1 to a repo safely.")
    ap.add_argument("edits_file", help="Path to EDITS v1 file (AI output).")
    ap.add_argument("--dry-run", action="store_true", help="Validate only, do not write.")
    ap.add_argument("--no-git", action="store_true", help="Do not use git mv/rm even if repo is git.")
    ap.add_argument("--backup-dir", default=".edits_backups", help="Backup dir under ROOT.")
    ap.add_argument("--allow-outside-scope", action="store_true", help="Allow edits anywhere under ROOT, not just SCOPE.")
    ap.add_argument("--force-delete-dir", action="store_true", help="Allow deleting non-empty directories (DANGEROUS).")
    args = ap.parse_args()

    text = Path(args.edits_file).read_text(encoding="utf-8")
    root, scope_rel, mkdirs, deletes, moves, file_blocks = parse_edits(text)

    cwd = Path(os.getcwd()).resolve()
    try:
        cwd.relative_to(root)
    except Exception:
        raise SystemExit(f"[FATAL] Run from inside ROOT.\n  ROOT: {root}\n  CWD:  {cwd}")

    use_git = (not args.no_git) and is_git_repo(root)
    backup_dir = (root / args.backup_dir).resolve()
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def check_path(abs_str: str) -> Path:
        p = Path(abs_str).expanduser().resolve()
        ensure_under_root(root, p)
        if not args.allow_outside_scope:
            ensure_in_scope(root, scope_rel, p)
        return p

    def backup_if_exists(p: Path) -> None:
        if p.exists() and p.is_file():
            dst = backup_path(root, backup_dir, p, stamp)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)

    # 1) MKDIR
    for op in mkdirs:
        p = check_path(op.path)
        if args.dry_run:
            print(f"[DRYRUN] MKDIR {p}")
        else:
            p.mkdir(parents=True, exist_ok=True)
            print(f"[OK] MKDIR {p}")

    # 2) MOVE
    for op in moves:
        src = check_path(op.src)
        dst = check_path(op.dst)

        if args.dry_run:
            print(f"[DRYRUN] MOVE {src} -> {dst}")
            continue

        if src.exists() and src.is_file():
            backup_if_exists(src)

        # Prefer git mv for proper history
        if use_git:
            # paths passed to git should be repo-relative
            src_rel = src.relative_to(root).as_posix()
            dst_rel = dst.relative_to(root).as_posix()
            if run_git(["mv", src_rel, dst_rel], cwd=root):
                print(f"[GIT] mv {src_rel} -> {dst_rel}")
                continue

        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        print(f"[FS] mv {src} -> {dst}")

    # 3) FILE create/replace
    for fb in file_blocks:
        p = check_path(fb.path)
        action = "CREATE" if not p.exists() else "REPLACE"

        if args.dry_run:
            print(f"[DRYRUN] {action} {p} (bytes={len(fb.content.encode('utf-8'))})")
            continue

        backup_if_exists(p)
        atomic_write(p, fb.content)
        print(f"[OK] {action} {p}")

    # 4) DELETE
    for op in deletes:
        p = check_path(op.path)

        if args.dry_run:
            print(f"[DRYRUN] DELETE {p}")
            continue

        if not p.exists():
            print(f"[OK] DELETE {p} (already missing)")
            continue

        if p.is_file():
            backup_if_exists(p)
            if use_git:
                rel = p.relative_to(root).as_posix()
                if run_git(["rm", "-f", rel], cwd=root):
                    print(f"[GIT] rm {rel}")
                    continue
            p.unlink()
            print(f"[FS] rm {p}")
            continue

        if p.is_dir():
            # Prefer git rm -r if allowed
            if use_git and args.force_delete_dir:
                rel = p.relative_to(root).as_posix()
                if run_git(["rm", "-rf", rel], cwd=root):
                    print(f"[GIT] rm -r {rel}")
                    continue
            # Filesystem delete
            if args.force_delete_dir:
                shutil.rmtree(p)
                print(f"[FS] rmtree {p}")
            else:
                # only delete if empty
                try:
                    p.rmdir()
                    print(f"[FS] rmdir {p}")
                except OSError:
                    raise SystemExit(f"[ERROR] Refusing to delete non-empty dir without --force-delete-dir: {p}")

    print("\nDone.")
    if not args.dry_run:
        print(f"Backups (files only) in: {backup_dir}/{stamp}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
