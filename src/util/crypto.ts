/**
 * Convert binary stream to hex representation.
 *
 * @internal
 */
export function binaryToHex(binary: string): string {
  return binary
    .split("")
    .map((i) => i.codePointAt(0)!)
    .map((i) => i.toString(16).padStart(2, "0"))
    .join("");
}
/**
 * Create a timestamp-wise & entropy-wise 128-bit unique identifier.
 *
 * @internal
 */
export function createUniqueId() {
  const entropy = Math.floor(Math.random() * 4294967296);
  const time = new Date().getTime() % 4294967296;
  const a = (entropy >> 16) & 0xffff;
  const b = entropy & 0xffff;
  const c = (time >> 16) & 0xffff;
  const d = time & 0xffff;
  return String.fromCharCode(
    (a ^ c) & 0xff,
    (a ^ c) >> 8,
    (c ^ b) & 0xff,
    (c ^ b) >> 8,
    (b ^ d) & 0xff,
    (b ^ d) >> 8,
    (d ^ a) & 0xff,
    (d ^ a) >> 8
  );
}
