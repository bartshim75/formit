#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "SUPABASE_PROJECT_REF env var is required" >&2
  exit 1
fi

supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" --schema public > types/db.ts
echo "wrote types/db.ts"

