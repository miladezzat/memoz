type EvictionStrategy = 'LRU' | 'FIFO';

export interface LRUCacheOptions<K, V> {
    maxSize: number;
    ttl?: number;
    onEvict?: (key: K, value: V) => void;
    evictionStrategy?: EvictionStrategy;
    stayAlive?: boolean;
}
export class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiry?: number }> = new Map();

  private maxSize: number;

  private ttl?: number;

  private onEvict?: (key: K, value: V) => void;

  private evictionStrategy: EvictionStrategy;

  private stayAlive?: boolean;

  private hitCount: number = 0;

  private missCount: number = 0;

  private cleanupInterval: number = 60000; // 1 minute cleanup interval

  // eslint-disable-next-line no-undef
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: LRUCacheOptions<K, V>) {
    const {
      maxSize,
      ttl, onEvict,
      evictionStrategy = 'LRU',
      stayAlive = false,
    } = options;

    if (maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.onEvict = onEvict;
    this.evictionStrategy = evictionStrategy;
    if (stayAlive) {
      this.startCleanup();
    }
  }

  private reorder(key: K): void {
    if (this.evictionStrategy === 'LRU') {
      const entry = this.cache.get(key);
      if (!entry) return;
      this.cache.delete(key); // Remove the entry
      this.cache.set(key, entry); // Re-insert to update the position
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private isExpired(entry: { value: V; expiry?: number }): boolean {
    if (entry.expiry === undefined) return false;
    return performance.now() > entry.expiry;
  }

  private cleanupExpiredEntries(): void {
    const now = performance.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.expiry !== undefined && now > entry.expiry) {
        this.cache.delete(key);
        if (this.onEvict) {
          this.onEvict(key, entry.value);
        }
      }
    });
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      this.cleanupTimer = setInterval(() => this.cleanupExpiredEntries(), this.cleanupInterval);
    }
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount += 1;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.missCount += 1;
      return undefined;
    }

    this.hitCount += 1;
    this.reorder(key);
    return entry.value;
  }

  set(key: K, value: V, ttl?: number): void {
    if (this.cache.has(key)) {
      this.reorder(key);
    } else if (this.cache.size === this.maxSize) {
      let oldestKey: K | undefined;

      if (this.evictionStrategy === 'LRU') {
        // Get the first key for LRU strategy
        oldestKey = this.cache.keys().next().value;
      } else if (this.evictionStrategy === 'FIFO') {
        // Get the oldest key for FIFO strategy
        oldestKey = [...this.cache.keys()].shift();
      }

      if (oldestKey !== undefined) {
        const oldestEntry = this.cache.get(oldestKey);
        this.cache.delete(oldestKey);
        if (this.onEvict && oldestEntry) {
          this.onEvict(oldestKey, oldestEntry.value);
        }
      }
    }

    // Avoid nested ternaries by using simple conditionals
    let expiry: number | undefined;
    if (ttl !== undefined) {
      expiry = performance.now() + ttl;
    } else if (this.ttl !== undefined) {
      expiry = performance.now() + this.ttl;
    }

    this.cache.set(key, { value, expiry });
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries())
      .filter(([, entry]) => !this.isExpired(entry))
      .map(([key, entry]) => [key, entry.value]);
  }

  serialize(): string {
    const entries = this.entries();
    return JSON.stringify(entries);
  }

  deserialize(serializedCache: string): void {
    const entries: [K, V][] = JSON.parse(serializedCache);
    this.cache.clear();
    entries.forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  get hitRate(): number {
    const total = this.hitCount + this.missCount;
    return total === 0 ? 0 : this.hitCount / total;
  }

  get missRate(): number {
    const total = this.hitCount + this.missCount;
    return total === 0 ? 0 : this.missCount / total;
  }

  async getAsync(key: K, fetchFn: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    const result = await fetchFn();
    this.set(key, result);
    return result;
  }
}

export default LRUCache;
