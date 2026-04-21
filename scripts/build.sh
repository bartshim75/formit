#!/usr/bin/env bash
# Build script: produce dist/index.html with Supabase env vars injected.
# Required env: SUPABASE_URL, SUPABASE_ANON_KEY.

set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL env var is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY env var is required}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Formit.html"
OUT_DIR="$ROOT/dist"
OUT="$OUT_DIR/index.html"

mkdir -p "$OUT_DIR"

# Escape for safe use inside a double-quoted JS string.
# We only need to handle backslash, double-quote, and line separators.
escape_for_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

URL_ESC="$(escape_for_js "$SUPABASE_URL")"
KEY_ESC="$(escape_for_js "$SUPABASE_ANON_KEY")"

# Use awk for an exact, literal replacement of the sentinel tokens.
awk -v url="$URL_ESC" -v key="$KEY_ESC" '
{
  gsub(/__SUPABASE_URL__/, url)
  gsub(/__SUPABASE_ANON_KEY__/, key)
  print
}
' "$SRC" > "$OUT"

# Sanity: fail the build if any placeholder survived.
if grep -q '__SUPABASE_URL__\|__SUPABASE_ANON_KEY__' "$OUT"; then
  echo "build: placeholders not fully replaced in $OUT" >&2
  exit 1
fi

echo "build: wrote $OUT ($(wc -c < "$OUT") bytes)"
