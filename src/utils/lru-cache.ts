export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();

  private maxSize: number;

  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    this.maxSize = maxSize;
  }

  /**
     * Moves the given key to the end of the cache to mark it as recently used.
     * @param key - The key to reorder.
     */
  private reorder(key: K): void {
    const value = this.cache.get(key)!;
    this.cache.delete(key); // Remove the entry
    this.cache.set(key, value); // Re-insert to update the position
  }

  /**
     * Retrieves a value from the cache by its key.
     * @param key - The key to retrieve.
     * @returns The value associated with the key, or undefined if not found.
     */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move the key to the end to mark it as recently used
    this.reorder(key);
    return this.cache.get(key);
  }

  /**
     * Adds or updates a value in the cache.
     * If the cache exceeds the max size, the least recently used item is removed.
     * @param key - The key of the item.
     * @param value - The value to store.
     */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.reorder(key); // Update position of the existing entry
    } else if (this.cache.size === this.maxSize) {
      // Remove the oldest entry (first entry in the Map)
      const oldestKey = this.cache.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
     * Deletes an entry from the cache.
     * @param key - The key of the entry to delete.
     * @returns True if the entry was found and deleted, false otherwise.
     */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
     * Clears the entire cache.
     */
  clear(): void {
    this.cache.clear();
  }

  /**
     * Returns the current size of the cache.
     */
  get size(): number {
    return this.cache.size;
  }

  /**
     * Checks if a key exists in the cache.
     * @param key - The key to check.
     * @returns True if the key exists, false otherwise.
     */
  has(key: K): boolean {
    return this.cache.has(key);
  }
}

export default LRUCache;
