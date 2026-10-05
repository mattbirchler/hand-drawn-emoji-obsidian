#!/bin/sh
# Builds the plugin and copies it into a vault for testing.
# Usage: tools/install-dev.sh [vault path]   (defaults to ~/Obsidian/Birchler-alt)
set -e
cd "$(dirname "$0")/.."
vault="${1:-$HOME/Obsidian/Birchler-alt}"
dest="$vault/.obsidian/plugins/hand-drawn-emoji"
npm run build
mkdir -p "$dest"
cp main.js manifest.json styles.css "$dest/"
echo "Installed to $dest"
