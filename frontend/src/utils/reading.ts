export function normalizeReading(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}
