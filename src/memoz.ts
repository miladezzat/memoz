import { memozId } from './utils/memoz-id';
import { isObject } from './utils/is-object';
import { isValidMemozId } from './utils/is-valid-memoz-id';
import { QueryCache } from './utils/query-cache';
import { TransactionManager } from './utils/transaction-manager';
import { PersistenceManager } from './utils/persistence-manager';
import { IndexManager } from './utils/index-manager';
import {
  ConditionNode,
  DocumentWithId,
  MEMOZID,
  MemozOptions,
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

  public ready: Promise<void>;

  /**
       *
       * @param memozOptions - Options for the Memoz instance
       * @param memozOptions.filePath - The file path to save the database to -default is in-memory
       * @param memozOptions.persistToDisk - Whether to persist the database to disk - default is false
       */
  constructor(memozOptions: MemozOptions = {}) {
    const { storagePath, persistToDisk = false } = memozOptions;

    this.transactionManager = new TransactionManager(this.db);
    this.persistenceManager = new PersistenceManager(this.db, storagePath, persistToDisk);
    this.indexManager = new IndexManager();
    this.queryCache = new QueryCache();

    this.ready = persistToDisk ? this.persistenceManager.loadFromDisk() : Promise.resolve();
  }

  public async beginTransaction(): Promise<void> {
    await this.ready;
    this.transactionManager.beginTransaction();
  }

  public async commitTransaction(): Promise<void> {
    await this.ready;
    this.transactionManager.commitTransaction();
    await this.persistenceManager.saveToDisk();
  }

  public async rollbackTransaction(): Promise<void> {
    await this.ready;
    this.transactionManager.rollbackTransaction();
  }

  public async createOne(document: T): Promise<DocumentWithId<T>> {
    await this.ready;

    this.queryCache.invalidate();

    if (!isObject(document)) {
      throw new Error('The document must be a valid object');
    }

    const id = memozId();
    const dbDocument: DocumentWithId<T> = { ...document, id };

    const targetDb = this.transactionManager.getCurrentDb(); // Use transactional DB if active
    targetDb.set(id, dbDocument);

    this.indexManager.updateIndexes(dbDocument);
    await this.persistenceManager.saveToDisk();

    return dbDocument;
  }

  public async createMany(documents: T[]): Promise<DocumentWithId<T>[]> {
    await this.ready;
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

    await this.persistenceManager.saveToDisk();

    return createdDocuments;
  }

  public async getById(id: MEMOZID): Promise<DocumentWithId<T> | undefined> {
    await this.ready;
    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    return this.transactionManager.getCurrentDb().get(id);
  }

  public async getOne(query: ConditionNode<Partial<T>>): Promise<DocumentWithId<T> | undefined> {
    await this.ready;
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

  public async getMany(query: ConditionNode<Partial<T>>): Promise<DocumentWithId<T>[]> {
    await this.ready;
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

  public async updateById(id: MEMOZID, newData: Partial<T>): Promise<DocumentWithId<T>> {
    await this.ready;
    this.queryCache.invalidate();

    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const existingObject = await this.getById(id);
    if (!existingObject) {
      throw new Error('This ID does not exist');
    }

    const updatedObject = { ...existingObject, ...newData };
    this.transactionManager.getCurrentDb().set(id, updatedObject);
    this.indexManager.updateIndexes(updatedObject);
    await this.persistenceManager.saveToDisk();

    return updatedObject;
  }

  public async updateOne(query: ConditionNode<Partial<T>>, newData: Partial<T>): Promise<DocumentWithId<T>> {
    await this.ready;
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const existingObject = await this.getOne(query);

    if (!existingObject) {
      throw new Error('No document matches the query');
    }

    const updatedObject = { ...existingObject, ...newData };
    const targetDb = this.transactionManager.getCurrentDb();
    targetDb.set(existingObject.id, updatedObject);
    this.indexManager.updateIndexes(updatedObject); // Update indexes after modifying
    await this.persistenceManager.saveToDisk();

    return updatedObject;
  }

  public async updateMany(query: ConditionNode<Partial<T>>, newData: Partial<T>): Promise<UpdateManyResult<T>> {
    await this.ready;
    this.queryCache.invalidate();

    if (!isObject(query) || !isObject(newData)) {
      throw new Error('Both query and new data must be valid objects');
    }

    const documents = await this.getMany(query);
    documents.forEach((document) => this.updateById(document.id, newData));
    await this.persistenceManager.saveToDisk();

    return { updated: true, n: documents.length, documents };
  }

  public async deleteById(id: MEMOZID): Promise<DocumentWithId<T> | undefined> {
    await this.ready;
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
      await this.persistenceManager.saveToDisk();
    }

    return documentToDelete;
  }

  public async deleteAll(): Promise<{ deleted: boolean; n: number; }> {
    await this.ready;
    const targetDb = this.transactionManager.getCurrentDb();
    const { size } = targetDb;
    targetDb.clear();
    this.indexManager.clear();
    await this.persistenceManager.saveToDisk();

    return { deleted: true, n: size };
  }

  public async deleteOne(query: ConditionNode<Partial<T>>): Promise<DocumentWithId<T> | undefined> {
    await this.ready;
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const objectToDelete = await this.getOne(query);
    if (!objectToDelete) return undefined;

    this.deleteById(objectToDelete.id);
    await this.persistenceManager.saveToDisk();

    return objectToDelete;
  }

  public async deleteMany(query: ConditionNode<Partial<T>>): Promise<{ deleted: boolean; n: number; }> {
    await this.ready;
    this.queryCache.invalidate();

    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const documents = await this.getMany(query);
    documents.forEach((doc) => this.deleteById(doc.id));
    await this.persistenceManager.saveToDisk();

    return { deleted: true, n: documents.length };
  }

  public async countDocuments(query?: ConditionNode<Partial<T>>): Promise<number> {
    await this.ready;

    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return query && Object.keys(query).length ? (await this.getMany(query)).length : this.transactionManager.getCurrentDb().size;
  }

  public static id(): MEMOZID {
    return memozId();
  }

  public static isValidId(id: MEMOZID): boolean {
    return isValidMemozId(id);
  }

  private getFromIndex(query: any): DocumentWithId<T>[] {
    return this.indexManager.getFromIndex(query, this.transactionManager.getCurrentDb());
  }
}

export default Memoz;
