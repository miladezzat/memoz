/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @template T
 * @param {T[]} array - The array to split into chunks.
 * @param {number} size - The size of each chunk.
 * @returns {T[][]} - An array of chunks.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default chunkArray;
