// utils/query-cache.ts
import LRUCache from './lru-cache';
import { DocumentWithId } from '../types';

export class QueryCache<T> {
  private cache: LRUCache<string, DocumentWithId<T>[]> = new LRUCache(1000);

  public get(key: string): DocumentWithId<T>[] | undefined {
    return this.cache.get(key);
  }

  public set(key: string, value: DocumentWithId<T>[]): void {
    this.cache.set(key, value);
  }

  public invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export default QueryCache;
