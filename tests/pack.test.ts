import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import map from "../src/emoji-map.json";
import { EmojiPack } from "../src/pack";

const pack = new EmojiPack(() => new Uint8Array(readFileSync("build/emoji.zip")));

describe("EmojiPack", () => {
  it("returns the original SVG bytes", () => {
    const svg = pack.read("grinning-face.svg");
    expect(svg).toBeDefined();
    expect(Buffer.from(svg!).equals(readFileSync("emoji/grinning-face.svg"))).toBe(true);
  });

  it("has artwork for every mapped emoji", () => {
    const missing = Object.values(map).filter((file) => !pack.read(`${file}.svg`));
    expect(missing).toEqual([]);
  });

  it("carries the FrankMoji license", () => {
    const license = new TextDecoder().decode(pack.read("LICENSE.txt"));
    expect(license).toContain("Frank Rausch");
  });

  it("returns undefined for unknown files", () => {
    expect(pack.read("not-an-emoji.svg")).toBeUndefined();
  });
});
