import { memozId } from './utils/memoz-id';
import { isObject } from './utils/is-object';
import { isValidMemozId } from './utils/is-valid-memoz-id';
import { QueryCache } from './utils/query-cache';
import { TransactionManager } from './utils/transaction-manager';
import { PersistenceManager } from './utils/persistence-manager';
import { IndexManager } from './utils/index-manager';
import {
  ConditionNode,
  DocumentWithId, MEMOZID,
  UpdateManyResult,
} from './types';
import getOne from './utils/get-one';
import getMany from './utils/get-many';

export class Memoz<T> {
  private db: Map<MEMOZID, DocumentWithId<T>> = new Map();

  private transactionManager: TransactionManager<T>;

  private persistenceManager: PersistenceManager<T>;

  private indexManager: IndexManager<T>;

  private queryCache: QueryCache<T>;

  constructor(filePath?: string, persistToDisk: boolean = false, stayALive: boolean = false) {
    this.transactionManager = new TransactionManager(this.db);
    this.persistenceManager = new PersistenceManager(filePath, this.db, persistToDisk);
    this.indexManager = new IndexManager();
    this.queryCache = new QueryCache();

    if (persistToDisk) {
      this.persistenceManager.loadFromDiskLazy()
        .then(() => {
          if (stayALive) {
            this.persistenceManager.schedulePeriodicFlush();
          }
        });
    }
  }

  // Transaction Methods
  public beginTransaction(): void {
    this.transactionManager.beginTransaction();
  }

  public commitTransaction(): void {
    this.transactionManager.commitTransaction();
    this.persistenceManager.scheduleSaveToDisk();
  }

  public rollbackTransaction(): void {
    this.transactionManager.rollbackTransaction();
  }

  public getFromIndex(query: any): DocumentWithId<T>[] {
    return this.indexManager.getFromIndex(query, this.transactionManager.getCurrentDb());
  }

  public createOne(document: T): DocumentWithId<T> {
    this.queryCache.invalidate();

    if (!isObject(document)) {
      throw new Error('The document must be a valid object');
    }

    const id = memozId();
    const dbDocument: DocumentWithId<T> = { ...document, id };

    const targetDb = this.transactionManager.getCurrentDb(); // Use transactional DB if active
    targetDb.set(id, dbDocument);

    this.indexManager.updateIndexes(dbDocument);
    this.persistenceManager.scheduleSaveToDisk();

    return dbDocument;
  }

  public createMany(documents: T[]): DocumentWithId<T>[] {
    this.queryCache.invalidate();

    documents.forEach((document) => {
      if (!isObject(document)) {
        throw new Error('The document must be a valid object');
      }
    });

    const createdDocuments = documents.map((document) => {
      const id = memozId();
      return { ...document, id };
    });

    const targetDb = this.transactionManager.getCurrentDb(); // Use transactional DB if active
    createdDocuments.forEach((doc) => {
      targetDb.set(doc.id, doc);
      this.indexManager.updateIndexes(doc);
    });

    this.persistenceManager.scheduleSaveToDisk();

    return createdDocuments;
  }

  public getById(id: MEMOZID): DocumentWithId<T> | undefined {
    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    return this.transactionManager.getCurrentDb().get(id);
  }

  public getOne(query: ConditionNode<Partial<T>>): DocumentWithId<T> | undefined {
    const queryKey = JSON.stringify(query);
    const cachedResult = this.queryCache.get(queryKey);
    if (cachedResult) {
      return cachedResult[0];
    }

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const indexedResults = this.getFromIndex(query);
    const result = indexedResults.length > 0 ? indexedResults[0] : getOne([...this.transactionManager.getCurrentDb().values()], query);

    if (result) {
      this.queryCache.set(queryKey, [result]);
    }
    return result;
  }

  public getMany(query: ConditionNode<Partial<T>>): DocumentWithId<T>[] {
    const queryKey = JSON.stringify(query);
    const cachedResults = this.queryCache.get(queryKey);
    if (cachedResults) {
      return cachedResults;
    }

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const result = this.getFromIndex(query).length > 0
      ? this.getFromIndex(query)
      : getMany([...this.transactionManager.getCurrentDb().values()], query);

    this.queryCache.set(queryKey, result);
    return result;
  }

  public updateById(id: MEMOZID, newData: Partial<T>): DocumentWithId<T> {
    this.queryCache.invalidate();

    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const existingObject = this.getById(id);
    if (!existingObject) {
      throw new Error('This ID does not exist');
    }

    const updatedObject = { ...existingObject, ...newData };
    this.transactionManager.getCurrentDb().set(id, updatedObject);
    this.indexManager.updateIndexes(updatedObject);
    this.persistenceManager.scheduleSaveToDisk();

    return updatedObject;
  }

  public updateOne(query: ConditionNode<Partial<T>>, newData: Partial<T>): DocumentWithId<T> {
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const existingObject = this.getOne(query);

    if (!existingObject) {
      throw new Error('No document matches the query');
    }

    const updatedObject = { ...existingObject, ...newData };
    const targetDb = this.transactionManager.getCurrentDb();
    targetDb.set(existingObject.id, updatedObject);
    this.indexManager.updateIndexes(updatedObject); // Update indexes after modifying
    this.persistenceManager.scheduleSaveToDisk();

    return updatedObject;
  }

  public updateMany(query: ConditionNode<Partial<T>>, newData: Partial<T>): UpdateManyResult<T> {
    this.queryCache.invalidate();

    if (!isObject(query) || !isObject(newData)) {
      throw new Error('Both query and new data must be valid objects');
    }

    const documents = this.getMany(query);
    documents.forEach((document) => this.updateById(document.id, newData));
    this.persistenceManager.scheduleSaveToDisk();

    return { updated: true, n: documents.length, documents };
  }

  public deleteById(id: MEMOZID): DocumentWithId<T> | undefined {
    this.queryCache.invalidate();

    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    const targetDb = this.transactionManager.getCurrentDb();
    const documentToDelete = targetDb.get(id);

    if (documentToDelete) {
      // Update indexes efficiently
      this.indexManager.updateIndexes(documentToDelete);

      // Remove the document from the main database
      targetDb.delete(id);
      this.persistenceManager.scheduleSaveToDisk();
    }

    return documentToDelete;
  }

  public deleteAll(): { deleted: boolean; n: number } {
    const targetDb = this.transactionManager.getCurrentDb();
    const { size } = targetDb;
    targetDb.clear();
    this.indexManager.clear();
    this.persistenceManager.scheduleSaveToDisk();

    return { deleted: true, n: size };
  }

  public deleteOne(query: ConditionNode<Partial<T>>): DocumentWithId<T> | undefined {
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const objectToDelete = this.getOne(query);
    if (!objectToDelete) return undefined;

    this.deleteById(objectToDelete.id);

    return objectToDelete;
  }

  public deleteMany(query: ConditionNode<Partial<T>>): { deleted: boolean; n: number } {
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const documents = this.getMany(query);
    documents.forEach((doc) => this.deleteById(doc.id));
    this.persistenceManager.scheduleSaveToDisk();

    return { deleted: true, n: documents.length };
  }

  public countDocuments(query?: ConditionNode<Partial<T>>): number {
    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return query && Object.keys(query).length ? this.getMany(query).length : this.transactionManager.getCurrentDb().size;
  }

  public static id(): MEMOZID {
    return memozId();
  }

  public static isValidId(id: MEMOZID): boolean {
    return isValidMemozId(id);
  }
}

export default Memoz;
