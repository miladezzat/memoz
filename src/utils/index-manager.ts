// utils/index-manager.ts
import { DocumentWithId, MEMOZID } from '../types';
import Indexing from './indexing';

export class IndexManager<T> {
  private indexes: Map<string, Indexing<T>> = new Map();

  public updateIndexes(doc: DocumentWithId<T>): void {
    this.indexes.forEach((index) => {
      index.addDocument(doc);
    });
  }

  public getIndex(fields: string[]): Indexing<T> | undefined {
    return this.indexes.get(fields.join('_'));
  }

  public getFromIndex(query: any, db: Map<MEMOZID, DocumentWithId<T>>): DocumentWithId<T>[] {
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

  public clear() {
    return this.indexes.clear();
  }
}

export default IndexManager;
