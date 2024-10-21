import { LRUCache } from './lru-cache';
import { DocumentWithId, QueryCacheOptions } from '../types';

export class QueryCache<T> {
  // Create an LRUCache instance that stores string keys and arrays of DocumentWithId<T> as values
  private cache: LRUCache<string, DocumentWithId<T>[]>;

  // Metrics for cache hits and misses
  private cacheHits: number = 0;

  private cacheMisses: number = 0;

  /**
     * Initializes the QueryCache with optional maxSize, TTL, and eviction strategy.
     * @param options - Object containing maxSize, TTL, and eviction strategy.
     */
  constructor(options?: QueryCacheOptions<T>) {
    const { maxSize = 1000, ttl, evictionStrategy = 'LRU' } = options || {};
    this.cache = new LRUCache<string, DocumentWithId<T>[]>({
      maxSize,
      ttl,
      evictionStrategy,
    });
  }

  /**
     * Retrieves a list of documents by the given key from the cache.
     * Tracks cache hits and misses.
     * @param key - The key to retrieve.
     * @returns The array of DocumentWithId<T> associated with the key, or undefined if not found or expired.
     */
  public get(key: string): DocumentWithId<T>[] | undefined {
    const result = this.cache.get(key);
    if (result) {
      this.cacheHits += 1;
    } else {
      this.cacheMisses += 1;
    }
    return result;
  }

  /**
     * Adds or updates a list of documents in the cache.
     * Supports custom TTL for each entry.
     * @param key - The key of the cache entry.
     * @param value - The array of DocumentWithId<T> to cache.
     * @param ttl - Optional TTL for this specific entry, overriding global TTL.
     */
  public set(key: string, value: DocumentWithId<T>[], ttl?: number): void {
    this.cache.set(key, value, ttl); // Allow custom TTL per entry
  }

  /**
     * Invalidates (removes) a cache entry by key, or clears the entire cache if no key is provided.
     * @param key - Optional key to remove from the cache. If not provided, the entire cache is cleared.
     */
  public invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
     * Returns cache hit/miss statistics.
     * @returns An object with hit and miss counts.
     */
  public getStats(): { hits: number; misses: number } {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
    };
  }
}

export default QueryCache;
