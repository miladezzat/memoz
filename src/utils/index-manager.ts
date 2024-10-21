// utils/index-manager.ts
import { ConditionNode, DocumentWithId, MEMOZID } from '../types';
import { Indexing } from './indexing';

/**
 * The `IndexManager` class manages indexing for documents of type `T`.
 * It provides functionalities to update indexes with new documents,
 * retrieve indexes based on fields, query documents using indexes, and clear all indexes.
 *
 * @template T - The document type.
 */
export class IndexManager<T> {
  /**
     * A map that stores indexes by field names.
     * The key is a string formed by joining field names with an underscore.
     */
  private indexes: Map<string, Indexing<T>> = new Map();

  /**
     * Updates all existing indexes by adding the provided document.
     *
     * @param {DocumentWithId<T>} doc - The document to add to the indexes.
     */
  public updateIndexes(doc: DocumentWithId<T>): void {
    this.indexes.forEach((index) => {
      index.addDocument(doc);
    });
  }

  /**
     * Retrieves an index based on the specified fields.
     *
     * @param {string[]} fields - The array of field names used to identify the index.
     * @returns {Indexing<T> | undefined} - The index for the specified fields, or undefined if not found.
     */
  public getIndex(fields: string[]): Indexing<T> | undefined {
    return this.indexes.get(fields.join('_'));
  }

  /**
    * Retrieves documents from the index based on the query object.
    * If an index exists for the query fields, it uses that index to fetch documents from the database.
    *
    * @param {ConditionNode<Partial<T>>} query - The query object containing conditions for fields and values to search for.
    * @param {Map<MEMOZID, DocumentWithId<T>>} db - A Map representing the database of documents.
    * @returns {DocumentWithId<T>[]} - An array of documents that match the query.
    */
  public getFromIndex(query: ConditionNode<Partial<T>>, db: Map<MEMOZID, DocumentWithId<T>>): DocumentWithId<T>[] {
    const results: Set<DocumentWithId<T>> = new Set();
    const index = this.getIndex(Object.keys(query));
    if (index) {
      const indexedIds = index.query(query);
      indexedIds.forEach((id) => {
        const doc = db.get(id); // Access the db Map passed as an argument
        if (doc) results.add(doc);
      });
    }
    return [...results];
  }

  /**
     * Clears all indexes managed by the `IndexManager`.
     *
     * @returns {void}
     */
  public clear(): void {
    return this.indexes.clear();
  }
}

export default IndexManager;
