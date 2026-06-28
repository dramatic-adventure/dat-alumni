// Minimal ambient types for heic-convert (ships no types of its own).
// Only the single-image conversion form we use is declared.
declare module "heic-convert" {
  interface HeicConvertOptions {
    /** Raw HEIC/HEIF bytes. */
    buffer: Buffer | ArrayBuffer | Uint8Array;
    /** Output format. */
    format: "JPEG" | "PNG";
    /** JPEG quality 0–1 (ignored for PNG). */
    quality?: number;
  }
  function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
