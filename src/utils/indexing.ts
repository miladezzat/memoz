import { ConditionNode, DocumentWithId, MEMOZID } from '../types';

/**
 * A class that provides indexing functionality for a collection of documents.
 * It allows adding, removing, and querying documents based on specified fields.
 *
 * @template T - The type of the documents being indexed.
 */
export class Indexing<T> {
  /**
   * Fields that are used as keys for indexing the documents.
   * @private
   */
  private fields: (keyof T)[];

  /**
   * A map that stores the index, where keys are strings generated from document fields,
   * and the values are sets of document IDs.
   * @private
   */
  private index: Map<string, Set<MEMOZID>>;

  /**
   * Constructs an instance of the Indexing class.
   *
   * @param {Array<keyof T>} fields - The fields to be used for indexing.
   */
  constructor(fields: (keyof T)[]) {
    this.fields = fields;
    this.index = new Map();
  }

  /**
   * Adds a document to the index.
   *
   * @param {DocumentWithId<T>} document - The document to add to the index.
   * @returns {void}
   */
  public addDocument(document: DocumentWithId<T>): void {
    const key = this.getKey(document);
    if (!this.index.has(key)) {
      this.index.set(key, new Set());
    }
    this.index.get(key)!.add(document.id);
  }

  /**
   * Removes a document from the index.
   *
   * @param {DocumentWithId<T>} document - The document to remove from the index.
   * @returns {void}
   */
  public removeDocument(document: DocumentWithId<T>): void {
    const key = this.getKey(document);
    if (this.index.has(key)) {
      this.index.get(key)!.delete(document.id);
      if (this.index.get(key)!.size === 0) {
        this.index.delete(key);
      }
    }
  }

  /**
   * Queries the index to retrieve a set of document IDs that match the given conditions.
   *
   * @param {ConditionNode<Partial<T>>} query - The query conditions used to search the index.
   * @returns {Set<MEMOZID>} - A set of document IDs that match the query.
   */
  public query(query: ConditionNode<Partial<T>>): Set<MEMOZID> {
    const key = this.getKey(query);
    return this.index.has(key) ? this.index.get(key)! : new Set();
  }

  /**
   * Generates a unique key for indexing based on the specified fields of a document.
   *
   * @private
   * @param {DocumentWithId<T> | ConditionNode<Partial<T>>} document - The document or query condition to generate the key from.
   * @returns {string} - The generated key based on the document's field values.
   * @throws {Error} If the input is not a valid document for indexing.
   */
  private getKey(document: DocumentWithId<T> | ConditionNode<Partial<T>>): string {
    if ('id' in document) {
      return this.fields
        .map((field: keyof T) => String((document as any)[field])) // Use 'any' to cast document property access
        .join('_');
    } if (typeof document === 'object') {
      // Optionally handle condition node queries
      return this.fields
        .map((field: keyof T) => String((document as any)[field] || '')) // Allow partial matching in queries
        .join('_');
    }
    // Handle the case where the input is not a valid document
    throw new Error('Unexpected document type for indexing');
  }
}

export default Indexing;
