import { DocumentWithId } from '../types';
import QueryCache from './query-cache';

export class QueryBuilder<T> implements PromiseLike<DocumentWithId<T>[]> {
  private result: DocumentWithId<T>[] = [];

  private resultPromise?: Promise<DocumentWithId<T>[]>;

  private queryCache: QueryCache<T>;

  private queryKey: string;

  private sortConditions: Array<Record<string, 'asc' | 'desc'>> = [];

  private skipCount: number = 0;

  private limitCount: number = Number.MAX_SAFE_INTEGER;

  private isResolved: boolean = false;

  constructor(
    result: DocumentWithId<T>[] | Promise<DocumentWithId<T>[]>,
    queryCache: QueryCache<T>,
    queryKey: string,
  ) {
    if (result instanceof Promise) {
      this.resultPromise = result;
    } else {
      this.result = result;
      this.isResolved = true;
    }
    this.queryCache = queryCache;
    this.queryKey = queryKey;
  }

  // Resolves the result if it's a promise, otherwise returns the result
  private async resolveResult(): Promise<DocumentWithId<T>[]> {
    if (!this.isResolved && this.resultPromise) {
      this.result = await this.resultPromise;
      this.isResolved = true;
    }
    return this.result;
  }

  public sort(sortConditions?: Record<keyof T, 'asc' | 'desc'> | Record<keyof T, 'asc' | 'desc'>[]): this {
    if (sortConditions) {
      // If sortConditions is an array, use it as is, otherwise wrap it in an array
      this.sortConditions = Array.isArray(sortConditions) ? sortConditions : [sortConditions];
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

  // Executes the query and returns the sorted and paginated results
  public async exec(): Promise<DocumentWithId<T>[]> {
    const resolvedResult = await this.resolveResult();

    // Apply sorting if needed
    if (this.sortConditions.length > 0) {
      resolvedResult.sort((a, b) => {
        let comparisonResult = 0;

        this.sortConditions.forEach((sortObj) => {
          Object.entries(sortObj).forEach(([key, order]) => {
            const aValue = a[key];
            const bValue = b[key];

            // Skip undefined values
            if (aValue === undefined || bValue === undefined) return;

            if (aValue < bValue) {
              comparisonResult = order === 'asc' ? -1 : 1;
              return; // Exit inner loop after determining order
            }
            if (aValue > bValue) {
              comparisonResult = order === 'asc' ? 1 : -1;
              // Exit inner loop after determining order
            }
          });

          // If a comparison has already been made, stop further comparisons
          if (comparisonResult !== 0) {
            // Exit outer loop if already determined
          }
        });

        return comparisonResult;
      });
    }

    // Apply pagination
    const paginatedResult = resolvedResult.slice(this.skipCount, this.skipCount + this.limitCount);

    // Cache the result only if it's different
    if (JSON.stringify(this.result) !== JSON.stringify(paginatedResult)) {
      this.queryCache.set(this.queryKey, paginatedResult);
    }

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

  // Mark the class as Promise-like for chaining purposes
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag](): string {
    return 'Promise';
  }
}

// Proxy to enable chaining and ensure correct promise-like behavior
export function createQueryBuilderProxy<T>(builder: QueryBuilder<T>): QueryBuilder<T> {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          return result instanceof QueryBuilder ? createQueryBuilderProxy(result) : result;
        };
      }

      if (prop === 'then') {
        return (...args: any[]) => builder.then(...args);
      }
      if (prop === 'catch') {
        return (onrejected: (reason: any) => any) => builder.exec().catch(onrejected);
      }

      return builder.exec();
    },
  });
}
