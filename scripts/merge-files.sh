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

norm_ext() { print "${1#.}"; }

is_allowed_ext() {
  local path="$1"
  local ext="${path##*.}"
  local e
  for e in "${ALLOWED_EXTS[@]}"; do
    [[ "$ext" == "$(norm_ext "$e")" ]] && return 0
  done
  return 1
}

is_in_ignored_dir() {
  local path="$1"
  local d
  for d in "${IGNORE_DIRS[@]}"; do
    [[ "$path" == "$d/"* || "$path" == */"$d/"* ]] && return 0
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
  # Compute repo-relative root folder path (pure zsh, no python)
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

: > "$output_file"

for rel_path in "${files[@]}"; do
  if [[ -n "$repo_root" ]]; then
    file_abs="$repo_root/$rel_path"
    banner_path="$rel_path"
    if [[ "${rel_root:-.}" != "." ]]; then
      banner_path="${banner_path#$rel_root/}"
    fi
  else
    file_abs="$root_abs/$rel_path"
    banner_path="$rel_path"
  fi

  {
    print "${START_PREFIX}${banner_path}${BANNER_SUFFIX}"
    print ""
    cat -- "$file_abs"
    print ""
    print "${END_PREFIX}${banner_path}${BANNER_SUFFIX}"
    print ""
  } >> "$output_file"
done

print "✅ Wrote ${#files[@]} file(s) into: $output_file"
