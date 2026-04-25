/**
 * Media processing utilities — edge-compatible, no native addons.
 *
 * Sharp has been removed. Images are stored as-is (original file) in R2.
 * Variant generation and resizing are deferred to a future Cloudflare Images
 * integration or external processing step.
 *
 * sniffMime  — magic-byte MIME detection, pure JS
 * sha256Hex  — SHA-256 checksum via Web Crypto API (edge-safe)
 */

export type SniffedMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

/**
 * Detects MIME type from the first bytes of a file buffer.
 * Accepts Buffer or Uint8Array.
 */
export function sniffMime(buffer: Uint8Array): SniffedMime | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WebP: "RIFF....WEBP"
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50   // P
  ) {
    return "image/webp";
  }
  // PDF: "%PDF"
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  ) {
    return "application/pdf";
  }
  return null;
}

/**
 * SHA-256 checksum using the Web Crypto API.
 * Works on Cloudflare Workers, Deno, Node 16+, browsers.
 */
export async function sha256Hex(buffer: Uint8Array): Promise<string> {
  // new Uint8Array(buffer) copies into a fresh ArrayBuffer — required by
  // SubtleCrypto's TypeScript overloads which reject ArrayBufferLike.
  const hashBuf = await crypto.subtle.digest("SHA-256", new Uint8Array(buffer));
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
