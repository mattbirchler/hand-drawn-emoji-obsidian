import { describe, expect, it } from "vitest";
import { fileFor, findEmoji } from "../src/match";

describe("findEmoji", () => {
  it("finds emoji and their positions", () => {
    expect(findEmoji("hi 😀 there 🎉")).toEqual([
      { index: 3, text: "😀", file: "grinning-face" },
      { index: 12, text: "🎉", file: "party-popper" },
    ]);
  });

  it("returns nothing for plain text", () => {
    expect(findEmoji("Just words, 123 #tag *bold*")).toEqual([]);
  });

  it("keeps skin tone and joined sequences whole", () => {
    const found = findEmoji("👍🏽 and 🧑‍💻");
    expect(found.map((m) => m.text)).toEqual(["👍🏽", "🧑‍💻"]);
  });

  it("leaves text-style symbols alone unless they ask for emoji style", () => {
    expect(findEmoji("© 2026")).toEqual([]);
    expect(findEmoji("©️ 2026").map((m) => m.file)).toEqual(["copyright"]);
  });

  it("skips emoji FrankMoji has no artwork for", () => {
    expect(findEmoji("🇺🇸")).toEqual([]);
  });
});

describe("fileFor", () => {
  it("ignores variation selectors", () => {
    expect(fileFor("❤️")).toBe(fileFor("❤"));
    expect(fileFor("❤️")).toBe("red-heart");
  });
});
