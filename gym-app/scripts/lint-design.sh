#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Fail on raw hex colors outside token/metadata files.
if rg -n "#[0-9a-fA-F]{3,8}" app \
  -g '!globals.css' \
  -g '!manifest.ts' \
  -g '!layout.tsx'; then
  echo "Design lint failed: raw hex colors found outside token files." >&2
  exit 1
fi

# Fail on deprecated .btn usage in TSX.
if rg -n -P "className=.*(?<!-)\\bbtn\\b" app -g '*.tsx'; then
  echo "Design lint failed: deprecated .btn class usage found." >&2
  exit 1
fi
