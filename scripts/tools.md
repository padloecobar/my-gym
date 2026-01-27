# tools.md

Two scripts in this repo can generate a “monolithic snapshot” of your code for pasting into LLMs (or archiving). They both produce a single text file that concatenates many source files with clear boundary markers.

---

## 1) Zsh script: repo-to-monolith (START/END banners)

### What it does
Takes a folder and writes one output file that contains the contents of selected files, wrapped like:

```txt

#### START /absolute/path/to/file

<file contents>

#### END /absolute/path/to/file

```

A static “how to parse this” message is written at the very top of the output (LLM-friendly).

### Usage
```sh
./your_zsh_script.zsh <root_folder> <output_file>
````

### Positional arguments

* `root_folder`
  Folder to snapshot. Can be inside a git repo or not.
* `output_file`
  Output file path (created/overwritten).

### Behavior notes

* If `git` is available and `root_folder` is inside a git repo:

  * Uses `git ls-files` (tracked files) to decide what files exist.
  * Optional inclusion of untracked files depends on config.
* If not in a git repo (or git missing):

  * Falls back to scanning with `find`.

### Configuration (edit inside script)

At the top of the script:

* `ALLOWED_EXTS` (array)
  Extensions allowed (case-insensitive). Example:

  ```zsh
  typeset -a ALLOWED_EXTS=( tsx jsx ts js css scss json mjs )
  ```

* `BLOCKED_EXTS` (array)
  Extensions never included even if listed in `ALLOWED_EXTS`. Default blocks markdown:

  ```zsh
  typeset -a BLOCKED_EXTS=( md )
  ```

* `IGNORE_DIRS` (array)
  Folder names to ignore wherever they appear in the path:

  ```zsh
  typeset -a IGNORE_DIRS=( node_modules .next )
  ```

* `EXTRA_IGNORE_GLOBS` (array)
  Extra ignore patterns using zsh globs. Examples:

  ```zsh
  typeset -a EXTRA_IGNORE_GLOBS=( "**/*.test.ts" "**/*.snap" )
  ```

* `INCLUDE_UNTRACKED` (`0` or `1`)
  When in a git repo:

  * `0`: include tracked files only
  * `1`: include tracked + untracked (excluding standard gitignored)

* Banner formatting:

  * `START_PREFIX` (default `#### START `)
  * `END_PREFIX` (default `#### END `)
  * `BANNER_SUFFIX` (default ` ####`)

### Examples

Snapshot a Next.js app folder into `monolith.txt`:

```sh
./your_zsh_script.zsh ./my-app monolith.txt
```

Snapshot the repo root:

```sh
./your_zsh_script.zsh . snapshot.txt
```

### Output is best for

* Quick “paste to LLM” bundles
* Lightweight snapshots without managing many CLI flags

---

## 2) Python script: `snapshot_repo_v1.py` (SNAPSHOT v1 format)

### What it does

Creates a single text file with:

* Header metadata (ROOT/SCOPE/timestamp)
* A series of file blocks with absolute file paths and contents

Output format:

```
### FILE STRUCTURE (for LLMs)
...instructions...

SNAPSHOT v1
ROOT: /abs/path/to/repo
SCOPE: my-app
CREATED_UTC: 2026-01-26T02:12:00Z
FILES_INCLUDED: 123

FILE: /abs/path/to/repo/my-app/app/page.tsx
BEGIN
<file contents...>
END
```

### Usage

```sh
python3 scripts/snapshot_repo_v1.py [options]
```

### Options (all CLI args)

#### `--root`

Repo root directory (absolute path is computed internally).

* Default: `.`
* Example:

  ```sh
  --root "$PWD"
  ```

#### `--scope`

Scope folder relative to `--root`.

* Default: `.`
* Example:

  ```sh
  --scope "my-app"
  ```

#### `--include` (repeatable)

Glob include patterns. If omitted, includes all files under `--scope` (except excludes / filters).

Important matching notes:

* Patterns are matched against:

  1. repo-relative paths (relative to `--root`)
  2. scope-relative paths (relative to `--scope`)
     This makes common patterns work whether you write `**/*.tsx` or `app/**`.

Examples:

```sh
--include "**/*.ts" --include "**/*.tsx" --include "**/*.css"
--include "my-app/app/**" --include "my-app/components/**"
--include "app/**" --include "components/**"
```

#### `--exclude` (repeatable)

Glob exclude patterns (matched against repo-relative paths).
Defaults already exclude common heavy folders like `.git`, `node_modules`, `.next`, `dist`, etc.

Examples:

```sh
--exclude "**/generated/**"
--exclude "**/*.snap"
```

#### `--max-bytes`

Skip files larger than this many bytes.

* Default: `700000` (700 KB)

Example:

```sh
--max-bytes 200000
```

#### `--out`

Output snapshot file path.

* Required unless `--dry-run` is used.

Example:

```sh
--out snapshot.txt
```

#### `--dry-run`

Print which files would be included and exit without writing output.

Example:

```sh
--dry-run
```

### Behavior notes

* Text-only: the script skips files that do not decode as UTF-8 (using a probe).
* Large files are skipped based on `--max-bytes`.
* The scanner prunes common heavy directories early (performance boost).

### Examples

Snapshot a whole module folder:

```sh
python3 scripts/snapshot_repo_v1.py \
  --root "$PWD" \
  --scope "my-app" \
  --include "**/*.ts" --include "**/*.tsx" --include "**/*.css" \
  --exclude "**/node_modules/**" --exclude "**/.next/**" \
  --out snapshot.txt
```

Snapshot only specific subfolders inside `my-app`:

```sh
python3 scripts/snapshot_repo_v1.py \
  --root "$PWD" \
  --scope "my-app" \
  --include "app/**" \
  --include "components/**" \
  --include "lib/**" \
  --out snapshot.txt
```

Dry run:

```sh
python3 scripts/snapshot_repo_v1.py \
  --root "$PWD" --scope "my-app" \
  --include "**/*.tsx" \
  --dry-run
```

### Output is best for

* More controlled snapshots (include/exclude via CLI)
* Reproducible “v1” format that’s easy to parse programmatically

---

## Which one should you use?

* Use the **Zsh script** when you want a fast, simple “bundle these files” tool and you’re okay editing config in the script.
* Use the **Python script** when you want a more configurable CLI with include/exclude patterns, size limits, and dry-run.

---

## LLM parsing tips

When you paste either output to an LLM:

* Tell it to treat each file block as authoritative.
* Ask it to propose changes by referencing file paths and showing exact edits.
* If you want patch-style output, ask for unified diffs per file.

Example prompt to pair with a snapshot:

> “Read this snapshot. Propose improvements. For each change, output a unified diff per file path.”

