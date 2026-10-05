#!/bin/sh
# Renders assets/hero.html to assets/hero.png (3200x1800, 16:9).
# Usage: tools/render-hero.sh [path to a Chromium binary]
# Defaults to the newest headless shell that Playwright has downloaded.
set -e
cd "$(dirname "$0")/.."
chrome="${1:-$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell | tail -1)}"
"$chrome" --headless --hide-scrollbars --window-size=1600,900 \
  --force-device-scale-factor=2 --screenshot="$PWD/assets/hero.png" \
  "file://$PWD/assets/hero.html"
echo "Wrote assets/hero.png"
