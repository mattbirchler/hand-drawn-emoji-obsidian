// Zips emoji/ into build/emoji.zip, which esbuild inlines into main.js.
// The SVGs go in unmodified, along with the FrankMoji license file.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "emoji");
const names = readdirSync(source)
  .filter((name) => name.endsWith(".svg") || name === "LICENSE.txt")
  .sort();

// A fixed timestamp keeps the zip byte-for-byte identical between builds.
const mtime = new Date("2026-01-01T00:00:00Z");
const files = {};
for (const name of names) {
  files[name] = [readFileSync(join(source, name)), { level: 9, mtime }];
}

const zip = zipSync(files);
mkdirSync(join(root, "build"), { recursive: true });
writeFileSync(join(root, "build", "emoji.zip"), zip);
console.log(`Packed ${names.length} files into build/emoji.zip (${(zip.length / 1e6).toFixed(1)} MB)`);
