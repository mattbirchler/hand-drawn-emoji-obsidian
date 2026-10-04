import map from "./emoji-map.json";

const MAP: Record<string, string> = map;

export interface EmojiMatch {
  index: number;
  text: string;
  file: string;
}

// The "v" flag needs Chromium 112 or Safari 17. Building the pattern from a
// string keeps older runtimes from failing to parse the whole plugin.
function compile(): RegExp | null {
  try {
    return new RegExp("\\p{RGI_Emoji}", "gv");
  } catch {
    return null;
  }
}

const EMOJI_RE = compile();
// Every emoji has at least one character outside ASCII, so plain text can skip the slow pattern.
const NON_ASCII_RE = /[^\x00-\x7F]/;

export const EMOJI_SUPPORTED = EMOJI_RE !== null;

export function fileFor(emoji: string): string | undefined {
  return MAP[emoji.replace(/️/g, "")];
}

/** Emoji in the text that FrankMoji has artwork for, in order. */
export function findEmoji(text: string): EmojiMatch[] {
  if (!EMOJI_RE || !NON_ASCII_RE.test(text)) return [];
  const found: EmojiMatch[] = [];
  for (const match of text.matchAll(EMOJI_RE)) {
    const file = fileFor(match[0]);
    if (file) found.push({ index: match.index ?? 0, text: match[0], file });
  }
  return found;
}
