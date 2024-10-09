// Shard.ts

import { DocumentWithId } from '../types';

export class Shard<T> {
  private db: Map<string, DocumentWithId<T>> = new Map();

  // Add user to this shard
  public addDocument(doc: DocumentWithId<T>): void {
    this.db.set(doc.id, doc);
  }

  // Get all documents
  public getDocuments(): DocumentWithId<T>[] {
    return Array.from(this.db.values());
  }

  // Partition documents by a specific field, e.g., age
  public partitionDocumentsBy(field: keyof T): { [key: string]: DocumentWithId<T>[] } {
    const partitions: { [key: string]: DocumentWithId<T>[] } = {};

    this.getDocuments().forEach((doc) => {
      const key = String(doc[field]);
      if (!partitions[key]) {
        partitions[key] = [];
      }
      partitions[key].push(doc);
    });

    return partitions;
  }

  public getById(id: string): DocumentWithId<T> | undefined {
    return this.db.get(id);
  }

  public deleteById(id: string): DocumentWithId<T> | undefined {
    const doc = this.db.get(id);
    if (doc) {
      this.db.delete(id);
    }
    return doc;
  }

  public clear(): void {
    this.db.clear();
  }
}

export default Shard;
