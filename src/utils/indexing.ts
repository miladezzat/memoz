import { ConditionNode, DocumentWithId, MEMOZID } from '../types';

export class Indexing<T> {
  private fields: string[];

  private index: Map<string, Set<MEMOZID>>;

  constructor(fields: string[]) {
    this.fields = fields;
    this.index = new Map();
  }

  public addDocument(document: DocumentWithId<T>): void {
    const key = this.getKey(document);
    if (!this.index.has(key)) {
      this.index.set(key, new Set());
    }
      this.index.get(key)!.add(document.id);
  }

  public removeDocument(document: DocumentWithId<T>): void {
    const key = this.getKey(document);
    if (this.index.has(key)) {
        this.index.get(key)!.delete(document.id);
        if (this.index.get(key)!.size === 0) {
          this.index.delete(key);
        }
    }
  }

  public query(query: ConditionNode<Partial<T>>): Set<MEMOZID> {
    const key = this.getKey(query);
    return this.index.has(key) ? this.index.get(key)! : new Set();
  }

  private getKey(document: DocumentWithId<T> | ConditionNode<Partial<T>>): string {
    if ('id' in document) { // Check if document has an 'id' property
      return this.fields.map((field: string) => document[field]).join('_');
    }
    // Handle the case where document is a ConditionNode type
    // (you might throw an error, return an empty string, or handle it differently)
    throw new Error('Unexpected document type for indexing');
  }
}

export default Indexing;
