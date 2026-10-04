#!/usr/bin/env python3
"""Generate src/emoji-map.json: emoji sequence (without U+FE0F) -> FrankMoji filename.

FrankMoji files are named after the CLDR short name of each emoji, so we slugify
the names in Unicode's emoji-test.txt and keep the ones that have a matching SVG.
"""
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_DIR = os.path.join(ROOT, "emoji")
OVERRIDES = {"keycap: #": "keycap-hash", "keycap: *": "keycap-asterisk"}


def slug(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = name.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")


files = {f[:-4] for f in os.listdir(SVG_DIR) if f.endswith(".svg")}
mapping = {}
with open(os.path.join(ROOT, "tools", "emoji-test.txt"), encoding="utf-8") as f:
    for line in f:
        if line.startswith("#") or ";" not in line:
            continue
        codepoints, rest = line.split(";", 1)
        name = re.sub(r"^.*?E\d+\.\d+ ", "", rest.split("#", 1)[1].strip())
        key = "".join(chr(int(c, 16)) for c in codepoints.split() if c != "FE0F")
        file = OVERRIDES.get(name, slug(name))
        if file in files:
            mapping[key] = file

unused = files - set(mapping.values())
with open(os.path.join(ROOT, "src", "emoji-map.json"), "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, separators=(",", ":"))
    f.write("\n")
print(f"{len(mapping)} emoji mapped, {len(unused)} SVGs unused: {sorted(unused)}")
