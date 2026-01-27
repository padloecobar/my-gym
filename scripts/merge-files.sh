#!/usr/bin/env zsh
set -euo pipefail

# =========================
# Config (edit these)
# =========================
typeset -a ALLOWED_EXTS=( tsx jsx ts js css scss json mjs )
typeset -a IGNORE_DIRS=( node_modules .next )
typeset -a EXTRA_IGNORE_GLOBS=( )
INCLUDE_UNTRACKED=0

START_PREFIX="#### START "
END_PREFIX="#### END "
BANNER_SUFFIX=" ####"

# Static top-of-file message for LLMs
typeset -r TOP_MESSAGE=$'### FILE STRUCTURE (for LLMs)\n\
This file is a concatenation of multiple source files.\n\
\n\
Each file is wrapped like this:\n\
  #### START <ABSOLUTE_PATH> ####\n\
  <file contents>\n\
  #### END <ABSOLUTE_PATH> ####\n\
\n\
Notes:\n\
- The START/END markers always use absolute paths.\n\
- There is a blank line after each START marker and before each END marker.\n\
- Treat each START..END block as the complete content of that one file.\n\
\n\
### BEGIN CONCATENATED FILES\n'
# =========================

usage() {
  print -u2 "Usage: $0 <root_folder> <output_file>"
  print -u2 "Example: $0 ./my-app monolith.txt"
}

if (( $# != 2 )); then
  usage
  exit 2
fi

root_folder="$1"
output_file="$2"

if [[ ! -d "$root_folder" ]]; then
  print -u2 "Error: root folder does not exist: $root_folder"
  exit 1
fi

root_abs="$(cd "$root_folder" && pwd -P)"

repo_root=""
if command -v git >/dev/null 2>&1; then
  repo_root="$(cd "$root_abs" && git rev-parse --show-toplevel 2>/dev/null || true)"
fi

# ---- Extension sets (O(1) lookup) ----
typeset -A ALLOWED=()
typeset -A BLOCKED=()

# Extensions that must NEVER be included (even if added to ALLOWED_EXTS)
typeset -a BLOCKED_EXTS=( md )

# Load ALLOWED from ALLOWED_EXTS
for e in "${ALLOWED_EXTS[@]}"; do
  e="${e#.}"
  e="${e:l}"
  ALLOWED["$e"]=1
done

# Load BLOCKED from BLOCKED_EXTS
for b in "${BLOCKED_EXTS[@]}"; do
  b="${b#.}"
  b="${b:l}"
  BLOCKED["$b"]=1
done

is_allowed_ext() {
  local ext="${1##*.}"
  ext="${ext:l}"

  [[ -n "${BLOCKED[$ext]-}" ]] && return 1
  [[ -n "${ALLOWED[$ext]-}" ]] && return 0
  return 1
}

# Slightly more directory-aware ignore matching
is_in_ignored_dir() {
  local path="$1"
  local d
  for d in "${IGNORE_DIRS[@]}"; do
    # matches ".../d/..." or "d/..." or exactly "d"
    [[ "$path" == (#b)(*/|)"$d"(|/*) ]] && return 0
  done
  return 1
}

matches_extra_ignore() {
  local path="$1"
  local g
  for g in "${EXTRA_IGNORE_GLOBS[@]}"; do
    [[ -z "$g" ]] && continue
    [[ "$path" == ${~g} ]] && return 0
  done
  return 1
}

typeset -a candidates=()

if [[ -n "$repo_root" ]]; then
  # Compute repo-relative root folder path (pure zsh)
  if [[ "$root_abs" == "$repo_root" ]]; then
    rel_root="."
  elif [[ "$root_abs" == "$repo_root/"* ]]; then
    rel_root="${root_abs#$repo_root/}"
  else
    print -u2 "Error: root folder is not inside the git repo."
    print -u2 "  root: $root_abs"
    print -u2 "  repo: $repo_root"
    exit 1
  fi

  if (( INCLUDE_UNTRACKED == 1 )); then
    while IFS= read -r p; do candidates+=("$p"); done \
      < <(cd "$repo_root" && (git ls-files; git ls-files --others --exclude-standard) | sort -u)
  else
    while IFS= read -r p; do candidates+=("$p"); done \
      < <(cd "$repo_root" && git ls-files | sort -u)
  fi

  # keep only files under rel_root (unless rel_root=".")
  if [[ "$rel_root" != "." ]]; then
    typeset -a filtered=()
    local p
    for p in "${candidates[@]}"; do
      [[ "$p" == "$rel_root/"* ]] && filtered+=("$p")
    done
    candidates=("${filtered[@]}")
  fi
else
  # Fallback: no git
  while IFS= read -r p; do
    candidates+=("${p#$root_abs/}")
  done < <(find "$root_abs" -type f -print | sort)
fi

typeset -a files=()

for rel_path in "${candidates[@]}"; do
  [[ -z "$rel_path" ]] && continue

  match_path="$rel_path"
  if [[ -n "$repo_root" && "${rel_root:-.}" != "." ]]; then
    match_path="${match_path#$rel_root/}"
  fi

  is_in_ignored_dir "$match_path" && continue
  matches_extra_ignore "$match_path" && continue
  is_allowed_ext "$match_path" || continue

  files+=("$rel_path")
done

if (( ${#files[@]} == 0 )); then
  print -u2 "No matching files found."
  exit 1
fi

# Write output in one go (faster and cleaner)
{
  print -r -- "$TOP_MESSAGE"

  for rel_path in "${files[@]}"; do
    if [[ -n "$repo_root" ]]; then
      file_abs="$repo_root/$rel_path"
    else
      file_abs="$root_abs/$rel_path"
    fi

    print "${START_PREFIX}${file_abs}${BANNER_SUFFIX}"
    print ""
    cat -- "$file_abs"
    print ""
    print "${END_PREFIX}${file_abs}${BANNER_SUFFIX}"
    print ""
  done
} > "$output_file"

print "✅ Wrote ${#files[@]} file(s) into: $output_file"
