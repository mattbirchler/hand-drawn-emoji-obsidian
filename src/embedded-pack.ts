import packBase64 from "../build/emoji.zip";

export function loadEmbeddedPack(): Uint8Array {
  const binary = atob(packBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
