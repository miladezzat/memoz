import { DocumentWithId } from '../types';
import QueryCache from './query-cache';

export class QueryBuilder<T> implements PromiseLike<DocumentWithId<T>[]> {
  private result: DocumentWithId<T>[] = [];

  private resultPromise?: Promise<DocumentWithId<T>[]>;

  private queryCache: QueryCache<T>;

  private queryKey: string;

  private sortConditions: Array<{ [key: string]: 'asc' | 'desc' }> = [];

  private skipCount: number = 0;

  private limitCount: number = Number.MAX_SAFE_INTEGER;

  constructor(result: DocumentWithId<T>[] | Promise<DocumentWithId<T>[]>, queryCache: QueryCache<T>, queryKey: string) {
    // Handle both resolved arrays and promises
    if (result instanceof Promise) {
      this.resultPromise = result;
    } else {
      this.result = result;
    }
    this.queryCache = queryCache;
    this.queryKey = queryKey;
  }

  // This function resolves the result whether it's a promise or already an array
  private async resolveResult(): Promise<DocumentWithId<T>[]> {
    if (this.resultPromise) {
      this.result = await this.resultPromise;
    }
    return this.result;
  }

  public sort(sortConditions?: { [key: string]: 'asc' | 'desc' }[]): this {
    if (sortConditions) {
      this.sortConditions = sortConditions;
    }
    return this;
  }

  public skip(skipCount: number): this {
    this.skipCount = skipCount;
    return this;
  }

  public limit(limitCount: number): this {
    this.limitCount = limitCount;
    return this;
  }

  // Execute the query and return the results
  public async exec(): Promise<DocumentWithId<T>[]> {
    await this.resolveResult(); // Wait for the result if it's a promise

    if (this.sortConditions.length > 0) {
      this.result.sort((a, b) => this.sortConditions.reduce((acc, sortObj) => {
        if (acc !== 0) return acc;

        return Object.entries(sortObj).reduce((innerAcc, [key, order]) => {
          if (innerAcc !== 0) return innerAcc;

          if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
          if (a[key] > b[key]) return order === 'asc' ? 1 : -1;

          return 0;
        }, 0);
      }, 0));
    }

    const paginatedResult = this.result.slice(this.skipCount, this.skipCount + this.limitCount);
    this.queryCache.set(this.queryKey, paginatedResult);
    return paginatedResult;
  }

  public then<TResult1 = DocumentWithId<T>[], TResult2 = never>(
    onfulfilled?: (value: DocumentWithId<T>[]) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?: (reason: any) => TResult | PromiseLike<TResult>,
  ): Promise<DocumentWithId<T>[] | TResult> {
    return this.exec().catch(onrejected);
  }

  public finally(onfinally?: () => void): Promise<DocumentWithId<T>[]> {
    return this.exec().finally(onfinally);
  }

  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Promise';
  }
}

export function createQueryBuilderProxy<T>(builder: QueryBuilder<T>): QueryBuilder<T> {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      // If accessing a function (like sort, skip, limit) or a known property, return it as normal
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          // If the function returns the QueryBuilder itself (for chaining), continue chaining
          if (result instanceof QueryBuilder) {
            return createQueryBuilderProxy(result); // Ensure chaining works with the proxy
          }
          return result;
        };
      }

      // Handle promise-like behavior
      if (prop === 'then') {
        return (...args: any[]) => builder.then(...args);
      }
      if (prop === 'catch') {
        return (onrejected: (reason: any) => any) => builder.exec().catch(onrejected);
      }

      // Fallback to exec if accessing unrecognized property
      return builder.exec();
    },
  });
}
