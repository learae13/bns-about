#!/usr/bin/env bash
# Optional: replaces the stand-in portrait mask shapes in class-of/masks/ with
# the real ones from brandnewschool.com. Read-only GET requests to public files;
# nothing on the live site is changed. Images stay as grey placeholders.
#
# Usage (from the project root):  bash scripts/fetch-remote-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
for m in bars cross1 cross2 circle1 square1 square2 flower1 flower2 flower3; do
  if curl -fsSL "https://www.brandnewschool.com/masks/$m.svg" -o "class-of/masks/$m.svg.tmp"; then
    mv "class-of/masks/$m.svg.tmp" "class-of/masks/$m.svg"; echo "✓ $m"
  else
    rm -f "class-of/masks/$m.svg.tmp"; echo "✗ $m (kept stand-in)"
  fi
done
