// Reads FrankMoji SVGs out of the zip that ships inside main.js.
//
// Only the zip's directory is parsed up front. Each SVG is inflated the first
// time it is needed and handed out as a blob URL, so memory use follows the
// emoji a vault really uses instead of the whole 14 MB set.

import { inflateSync } from "fflate";

interface Entry {
  offset: number;
  compressedSize: number;
  method: number;
}

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const STORED = 0;
const DEFLATED = 8;

export class EmojiPack {
  private bytes: Uint8Array | null = null;
  private entries = new Map<string, Entry>();
  private urls = new Map<string, string>();

  constructor(private load: () => Uint8Array) {}

  /** Blob URL for an emoji file name such as "grinning-face". */
  urlFor(file: string): string | undefined {
    const cached = this.urls.get(file);
    if (cached) return cached;
    const svg = this.read(`${file}.svg`);
    if (!svg) return undefined;
    const url = URL.createObjectURL(new Blob([svg as BlobPart], { type: "image/svg+xml" }));
    this.urls.set(file, url);
    return url;
  }

  read(name: string): Uint8Array | undefined {
    if (!this.bytes) {
      this.bytes = this.load();
      this.readDirectory(this.bytes);
    }
    const entry = this.entries.get(name);
    if (!entry) return undefined;
    const bytes = this.bytes;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const nameLength = view.getUint16(entry.offset + 26, true);
    const extraLength = view.getUint16(entry.offset + 28, true);
    const start = entry.offset + 30 + nameLength + extraLength;
    const data = bytes.subarray(start, start + entry.compressedSize);
    if (entry.method === STORED) return data;
    if (entry.method === DEFLATED) return inflateSync(data);
    return undefined;
  }

  destroy(): void {
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
    this.entries.clear();
    this.bytes = null;
  }

  private readDirectory(bytes: Uint8Array): void {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (end >= 0 && view.getUint32(end, true) !== END_OF_DIRECTORY) end--;
    if (end < 0) throw new Error("FrankMoji emoji pack is not a valid zip");

    const count = view.getUint16(end + 10, true);
    let position = view.getUint32(end + 16, true);
    const decoder = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (view.getUint32(position, true) !== DIRECTORY_ENTRY) break;
      const nameLength = view.getUint16(position + 28, true);
      const extraLength = view.getUint16(position + 30, true);
      const commentLength = view.getUint16(position + 32, true);
      const name = decoder.decode(bytes.subarray(position + 46, position + 46 + nameLength));
      this.entries.set(name, {
        offset: view.getUint32(position + 42, true),
        compressedSize: view.getUint32(position + 20, true),
        method: view.getUint16(position + 10, true),
      });
      position += 46 + nameLength + extraLength + commentLength;
    }
  }
}
