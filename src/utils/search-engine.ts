import { FuzzySearchOptions } from '../types';

/**
 * Removes accents from characters in a string.
 * This function converts accented characters (diacritics) to their base form.
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Unicode normalization + regex to strip accents
}

export class SearchEngine<T> {
  private db: Map<string, T>; // Generic database using a Map

  private levenshteinCache: Map<string, number>; // Cache for Levenshtein Distance

  private normalizationCache: Map<string, string>; // Cache for normalized values

  private resultLimit: number | null; // Store the limit for results

  constructor(db: Map<string, T>) {
    this.db = db;
    this.levenshteinCache = new Map<string, number>();
    this.normalizationCache = new Map<string, string>();
    this.resultLimit = null; // Default limit to null (no limit)
  }

  /**
   * Normalize the string by lowercasing, removing accents, and trimming whitespace.
   * Extended to remove punctuation and accents. Cached for performance.
   */
  private static normalizeWithCache(text: string, cache: Map<string, string>): string {
    if (!cache.has(text)) {
      const normalized = removeAccents(text.toLowerCase().trim()).replace(/[^\w\s]|_/g, '');
      cache.set(text, normalized);
    }
    return cache.get(text)!;
  }

  /**
   * Tokenizes the input string into words or terms.
   * Supports n-grams and can be expanded to apply stemming/lemmatization.
   */
  private static tokenize(text: string, n: number = 1): string[] {
    const words = text.split(/\s+/); // Splits by whitespace

    // Generate n-grams if requested
    if (n > 1) {
      const nGrams: string[] = [];
      for (let i = 0; i <= words.length - n; i += 1) {
        nGrams.push(words.slice(i, i + n).join(' '));
      }
      return nGrams;
    }

    return words;
  }

  /**
   * Optimized Levenshtein Distance implementation
   * Uses two rows instead of a full matrix to save memory
   */
  private levenshteinDistance(a: string, b: string, maxDistance: number): number {
    const cacheKey = JSON.stringify([a, b]);

    if (this.levenshteinCache.has(cacheKey)) {
      return this.levenshteinCache.get(cacheKey)!;
    }

    if (Math.abs(a.length - b.length) > maxDistance) {
      return maxDistance + 1; // Early exit if difference exceeds maxDistance
    }

    let prevRow = Array(a.length + 1).fill(0);
    let currRow = Array(a.length + 1).fill(0);

    for (let i = 0; i <= a.length; i += 1) prevRow[i] = i;

    for (let i = 1; i <= b.length; i += 1) {
      currRow[0] = i;

      for (let j = 1; j <= a.length; j += 1) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          prevRow[j] + 1, // Deletion
          currRow[j - 1] + 1, // Insertion
          prevRow[j - 1] + cost, // Substitution
        );
      }

      // Swap rows
      [prevRow, currRow] = [currRow, prevRow];
    }

    const result = prevRow[a.length];
    this.levenshteinCache.set(cacheKey, result);
    return result;
  }

  /**
   * Main search function which performs fuzzy search based on the search term.
   * @param searchTerm - The term the user is searching for.
   * @param fields - The fields to search within the objects.
   * @param options - Options to configure max distance, field weights, n-grams, etc.
   * @returns Array of results with relevance score.
   */
  public search(
    searchTerm: string,
    fields: (keyof T)[],
    options: FuzzySearchOptions = { maxDistance: 2, nGramSize: 1 },
  ): { item: T; score: number }[] {
    const normalizedSearchTerm = SearchEngine.normalizeWithCache(searchTerm, this.normalizationCache);
    const searchTokens = SearchEngine.tokenize(normalizedSearchTerm, options.nGramSize);
    const results: { item: T; score: number }[] = [];

    const {
      maxDistance = 2,
      fieldWeights = {},
      nGramSize = 1,
      scoringStrategy = 'default',
      customScoringFn,
    } = options;

    Array.from(this.db.values()).forEach((item) => {
      let score = 0;

      fields.forEach((field) => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          const normalizedFieldValue = SearchEngine.normalizeWithCache(fieldValue, this.normalizationCache);
          const fieldTokens = SearchEngine.tokenize(normalizedFieldValue, nGramSize);
          const fieldWeight = fieldWeights[field as string] || 1;

          searchTokens.forEach((token) => {
            fieldTokens.forEach((fieldToken) => {
              const distance = this.levenshteinDistance(token, fieldToken, maxDistance);

              if (distance <= maxDistance) {
                // Custom scoring logic
                switch (scoringStrategy) {
                  case 'default':
                    score += (maxDistance - distance) * fieldWeight;
                    break;

                  case 'tokenCount':
                    score += fieldWeight; // Score based on the number of matching tokens
                    break;

                  case 'custom':
                    if (customScoringFn) {
                      score += customScoringFn(token, fieldToken, distance, fieldWeight, options);
                    }
                    break;

                  default:
                    score += (maxDistance - distance) * fieldWeight;
                }
              }
            });
          });
        }
      });

      if (score > 0) {
        results.push({ item, score });
      }
    });

    // Sort results by highest score
    const sortedResults = results.sort((a, b) => b.score - a.score);

    // Apply limit if set
    return this.resultLimit ? sortedResults.slice(0, this.resultLimit) : sortedResults;
  }

  /**
   * Sets a limit on the number of results returned.
   * @param limit - The maximum number of results to return. default max number of results
   * @returns The SearchEngine instance for chaining.
   */
  public limit(limit: number = Number.MAX_SAFE_INTEGER): SearchEngine<T> {
    this.resultLimit = limit;
    return this;
  }
}

export default SearchEngine;
