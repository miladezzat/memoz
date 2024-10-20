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
import Mutex from './utils/mutex';
import chunkArray from './utils/helper';
import { createQueryBuilderProxy, QueryBuilder } from './utils/get-many-query-builder';

/**
 * The Memoz class is an in-memory document store with optional persistence to disk.
 * It supports transactional operations, querying, indexing, and caching.
 *
 * @template T - The type of documents being stored.
 */
export class Memoz<T> {
  /**
   * In-memory database storing documents keyed by MEMOZID.
   * @private
   * @type {Map<MEMOZID, DocumentWithId<T>>}
   */
  private db: Map<MEMOZID, DocumentWithId<T>> = new Map();

  /**
   * Manages transactions for the database.
   * @private
   * @type {TransactionManager<T>}
   */
  private transactionManager: TransactionManager<T>;

  /**
   * Manages persistence of the database to disk.
   * @private
   * @type {PersistenceManager<T>}
   */
  private persistenceManager: PersistenceManager<T>;

  /**
   * Manages indexing for efficient querying.
   * @private
   * @type {IndexManager<T>}
   */
  private indexManager: IndexManager<T>;

  /**
   * Caches query results for performance optimization.
   * @private
   * @type {QueryCache<DocumentWithId<T>>}
   */
  private queryCache: QueryCache<DocumentWithId<T>>;

  /**
   * A promise that resolves when the database is ready for use.
   * @public
   * @type {Promise<void>}
   */
  public ready: Promise<void>;

  private mutex: Mutex | null = null; // Nullable mutex (null if not used)

  /**
 *
 * @param memozOptions - Options for the Memoz instance
 * @param memozOptions.filePath - The file path to save the database to -default is in-memory
 * @param memozOptions.persistToDisk - Whether to persist the database to disk - default is false
 * @param memozOptions.useMutex - Whether to use a mutex for thread safety - default is false
 */
  constructor(memozOptions: MemozOptions = {}) {
    const { storagePath, useMutex = false, persistToDisk = false } = memozOptions;
    if (useMutex) {
      this.mutex = new Mutex(); // Only initialize mutex if enabled
    }

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

  /**
   * Inserts a new document into the database, assigning it a unique ID, and updating relevant indexes and cache.
   * This method handles transactional operations and ensures that the document is saved persistently to disk.
   *
   * @template T - The type of the document being inserted.
   * @param {T} document - The document to insert into the database.
   * @returns {Promise<DocumentWithId<T>>} - A promise that resolves to the document with an added unique ID.
   *
   * @throws {Error} If the provided document is not a valid object.
   *
   * @example
   * const newDocument = await db.createOne({ name: 'Sample Document' });
   *
   * @remarks
   * This method uses a mutex to prevent race conditions in concurrent environments.
   * If a transaction is active, the document is inserted into the transactional database.
   */
  public async createOne(document: T): Promise<DocumentWithId<T>> {
    const operation = async () => {
      await this.ready;

      // Invalidate cache before inserting the document
      this.queryCache.invalidate();

      // Ensure the document is a valid object
      if (!isObject(document)) {
        throw new Error('The document must be a valid object');
      }

      // Generate a unique ID for the document
      const id = memozId();
      const dbDocument: DocumentWithId<T> = { ...document, id };

      // Use transactional database if available
      const targetDb = this.transactionManager.getCurrentDb();
      targetDb.set(id, dbDocument);

      // Update indexes for the new document
      this.indexManager.updateIndexes(dbDocument);

      // Persist the document to disk
      await this.persistenceManager.saveToDisk();

      // Return the newly created document with its ID
      return dbDocument;
    };

    // Execute the operation with mutex lock if available
    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
 * Inserts multiple documents into the database in batches, assigning each one a unique ID,
 * and updating relevant indexes and cache. This method handles transactional operations
 * and ensures that documents are saved persistently to disk in chunks to avoid performance issues.
 *
 * @template T - The type of the documents being inserted.
 * @param {T[]} documents - The array of documents to insert into the database.
 * @param {number} [batchSize=100] - The maximum number of documents to process in each batch.
 * @returns {Promise<DocumentWithId<T>[]>} - A promise that resolves to an array of documents, each with a unique ID assigned.
 *
 * @throws {Error} If any document in the provided array is not a valid object.
 *
 * @example
 * const newDocuments = await db.createMany([{ name: 'Doc 1' }, { name: 'Doc 2' }], 50);
 *
 * @remarks
 * This method processes documents in batches to avoid performance bottlenecks.
 * The batch size is configurable, with a default of 100 documents per batch.
 */
  public async createMany(documents: T[], batchSize: number = 100): Promise<DocumentWithId<T>[]> {
    const operation = async () => {
      await this.ready;

      // Invalidate cache before inserting the documents
      this.queryCache.invalidate();

      // Validate all documents first to avoid partial batch processing
      documents.forEach((document) => {
        if (!isObject(document)) {
          throw new Error('Each document must be a valid object');
        }
      });

      // Chunk documents into batches and process each batch
      const allCreatedDocuments: DocumentWithId<T>[] = [];

      const chunks = chunkArray(documents, batchSize);

      // Process each chunk with async/await in sequence
      await chunks.reduce(async (prevPromise, chunk) => {
        await prevPromise; // Ensure sequential execution of batches

        const createdDocuments = chunk.map((document) => {
          const id = memozId(); // Generate unique ID for each document
          return { ...document, id };
        });

        // Insert each document in the current chunk into the database
        createdDocuments.forEach((doc) => {
          const targetDb = this.transactionManager.getCurrentDb();
          targetDb.set(doc.id, doc); // Set document in DB
          this.indexManager.updateIndexes(doc); // Update index for each document
        });

        // Persist chunk to disk
        await this.persistenceManager.saveToDisk();

        // Collect all created documents
        allCreatedDocuments.push(...createdDocuments);
      }, Promise.resolve()); // Start the chain with an immediately resolved Promise

      // Return all the created documents with IDs
      return allCreatedDocuments;
    };

    // Execute the operation with mutex lock if available
    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
   * Retrieves a document from the database using its unique identifier (MEMOZID).
   *
   * @template T - The type of the document being retrieved.
   * @param {MEMOZID} id - The unique identifier of the document to retrieve.
   * @returns {Promise<DocumentWithId<T> | undefined>} - A promise that resolves to the
   * document with the specified ID if found, or undefined if no document matches the ID.
   *
   * @throws {Error} If the provided ID is not valid.
   *
   * @example
   * const document = await db.getById('some-valid-id');
   * if (document) {
   *   console.log('Document found:', document);
   * } else {
   *   console.log('No document found with that ID.');
   * }
   *
   * @remarks
   * Ensure that the provided ID follows the expected MEMOZID format.
   */
  public async getById(id: MEMOZID): Promise<DocumentWithId<T> | undefined> {
    await this.ready;

    // Validate the provided ID
    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    // Retrieve the document from the current database
    return this.transactionManager.getCurrentDb().get(id);
  }

  /**
 * Retrieves a single document from the database that matches the provided query.
 *
 * This method first checks the query cache for a result. If a cached result is found, it returns that.
 * If no cached result exists, it checks the index for matching documents. If none are found,
 * it retrieves the document directly from the database.
 *
 * @template T - The type of the document being retrieved.
 * @param {ConditionNode<Partial<T>>} query - The query condition used to find the document.
 * @returns {Promise<DocumentWithId<T> | undefined>} - A promise that resolves to the document that matches the query,
 * or undefined if no document is found.
 *
 * @throws {Error} If the query is not a valid object.
 *
 * @example
 * const document = await db.getOne({ name: 'Example Document' });
 * if (document) {
 *   console.log('Document found:', document);
 * } else {
 *   console.log('No document found matching the query.');
 * }
 *
 * @remarks
 * Ensure that the provided query object is structured correctly to match documents in the database.
 */
  public async getOne(query: ConditionNode<Partial<T>>): Promise<DocumentWithId<T> | undefined> {
    await this.ready;

    const queryKey = JSON.stringify(query);
    const cachedResult = this.queryCache.get(queryKey);

    if (cachedResult) {
      return cachedResult[0]; // Return the first cached result if available
    }

    // Validate the provided query
    if (!isObject(query)) {
      throw new Error('Invalid query: The query must be a valid object');
    }

    const indexedResults = this.getFromIndex(query);
    const result = indexedResults.length > 0 ? indexedResults[0] : getOne([...this.transactionManager.getCurrentDb().values()], query);

    if (result) {
      this.queryCache.set(queryKey, [result]); // Cache the result for future use
    }
    return result; // Return the retrieved document or undefined if not found
  }

  /**
 * Retrieves multiple documents from the database that match the provided query.
 * Supports sorting, pagination, and caching with chainable methods.
 *
 * @param {ConditionNode<Partial<T>>} query - The query condition to match documents.
 * @returns {QueryBuilder<DocumentWithId<T>>} - A QueryBuilder instance with chaining support.
 */
/**
 * Retrieves multiple documents from the database that match the provided query.
 * Supports sorting, pagination, and caching with chainable methods.
 *
 * @param {ConditionNode<Partial<T>>} [query] - The optional query condition to match documents.
 * @returns {QueryBuilder<DocumentWithId<T>>} - A QueryBuilder instance with chaining support.
 */
public getMany(query?: ConditionNode<Partial<T>>): QueryBuilder<DocumentWithId<T>> {
    const operation = async (): Promise<DocumentWithId<T>[]> => {
      await this.ready;
  
      const queryKey = query ? JSON.stringify(query) : 'default-query-key';
  
      if (query && !isObject(query)) {
        throw new Error('Invalid query: The query must be a valid object');
      }
  
      let initialResult: DocumentWithId<T>[];
  
      // If query is provided, use it, otherwise return all documents
      if (query) {
        initialResult = this.getFromIndex(query).length > 0
          ? this.getFromIndex(query)
          : getMany([...this.transactionManager.getCurrentDb().values()], query);
      } else {
        // Fetch all documents if no query is provided
        initialResult = [...this.transactionManager.getCurrentDb().values()];
      }
  
      this.queryCache.set(queryKey, initialResult);
      return initialResult;
    };
  
    const resultsPromise = operation();
  
    // Return the QueryBuilder with the promise result
    return createQueryBuilderProxy(new QueryBuilder<DocumentWithId<T>>(resultsPromise, this.queryCache, query ? JSON.stringify(query) : 'default-query-key'));
  }
  

  /**
 * Updates an existing object by its ID with the provided new data.
 *
 * This method retrieves the object associated with the given ID, merges it with the
 * new data, updates the database, reindexes the object, and persists the changes to disk.
 *
 * @template T - The type of the object being updated.
 * @param {MEMOZID} id - The unique identifier of the object to update.
 * @param {Partial<T>} newData - The partial object containing the new data to update the object with.
 * @returns {Promise<DocumentWithId<T>>} - A promise that resolves to the updated object with its ID.
 * @throws {Error} If the provided ID is not valid.
 * @throws {Error} If the new data is not a valid object.
 * @throws {Error} If the object with the provided ID does not exist.
 *
 * @example
 * const updatedObject = await updateById('someId', { name: 'Updated Name' });
 * console.log(updatedObject);
 */
  public async updateById(id: MEMOZID, newData: Partial<T>): Promise<DocumentWithId<T>> {
    const operation = async () => {
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
    };

    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
 * Updates a single document in the database based on the provided query and new data.
 *
 * @param {ConditionNode<Partial<T>>} query - The query used to find the document to update.
 * @param {Partial<T>} newData - The new data to merge with the existing document.
 * @returns {Promise<DocumentWithId<T>>} - A promise that resolves to the updated document.
 * @throws {Error} - Throws an error if the query or newData is not a valid object, or if no document matches the query.
 */
  public async updateOne(query: ConditionNode<Partial<T>>, newData: Partial<T>): Promise<DocumentWithId<T>> {
    const operation = async () => {
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
    };

    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
 * Updates multiple documents in the database based on the provided query and new data.
 *
 * @param {ConditionNode<Partial<T>>} query - The query used to find the documents to update.
 * @param {Partial<T>} newData - The new data to merge with the existing documents.
 * @returns {Promise<UpdateManyResult<T>>} - A promise that resolves to an object containing update results, including:
 *   - `updated`: A boolean indicating if the update was successful.
 *   - `n`: The number of documents that were updated.
 *   - `documents`: An array of the updated documents.
 * @throws {Error} - Throws an error if either the query or newData is not a valid object.
 */
  public async updateMany(query: ConditionNode<Partial<T>>, newData: Partial<T>): Promise<UpdateManyResult<T>> {
    const operation = async () => {
      await this.ready;
      this.queryCache.invalidate();

      if (!isObject(query) || !isObject(newData)) {
        throw new Error('Both query and new data must be valid objects');
      }

      const documents = await this.getMany(query);
      documents.forEach((document) => this.updateById(document.id, newData));
      await this.persistenceManager.saveToDisk();

      return { updated: true, n: documents.length, documents };
    };

    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
 * Deletes a document from the database based on the provided ID.
 *
 * @param {MEMOZID} id - The ID of the document to be deleted. Must be a valid ID.
 * @returns {Promise<DocumentWithId<T> | undefined>} - A promise that resolves to the deleted document, or undefined if no document was found with the given ID.
 * @throws {Error} - Throws an error if the provided ID is not valid.
 */
  public async deleteById(id: MEMOZID): Promise<DocumentWithId<T> | undefined> {
    const operation = async () => {
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
    };
    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
     * Deletes all documents from the database.
     *
     * @returns {Promise<{ deleted: boolean; n: number; }>} - A promise that resolves to an object containing:
     *   - `deleted`: A boolean indicating that the deletion was successful.
     *   - `n`: The number of documents that were deleted.
     */
  public async deleteAll(): Promise<{ deleted: boolean; n: number; }> {
    const operation = async () => {
      await this.ready;
      const targetDb = this.transactionManager.getCurrentDb();
      const { size } = targetDb;
      targetDb.clear();
      this.indexManager.clear();
      await this.persistenceManager.saveToDisk();

      return { deleted: true, n: size };
    };

    return this.mutex ? this.mutex.lock(operation) : operation();
  }

  /**
 * Deletes a single document from the database based on the provided query.
 *
 * @param {ConditionNode<Partial<T>>} query - The query used to find the document to delete. Must be a valid object.
 * @returns {Promise<DocumentWithId<T> | undefined>} - A promise that resolves to the deleted document, or undefined if no document was found matching the query.
 * @throws {Error} - Throws an error if the query is not a valid object.
 */
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

  /**
 * Deletes multiple documents from the database based on the provided query.
 *
 * @param {ConditionNode<Partial<T>>} query - The query used to find the documents to delete. Must be a valid object.
 * @returns {Promise<{ deleted: boolean; n: number; }>} - A promise that resolves to an object containing:
 *   - `deleted`: A boolean indicating that the deletion was successful.
 *   - `n`: The number of documents that were deleted.
 * @throws {Error} - Throws an error if the query is not a valid object.
 */
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

  /**
 * Counts the number of documents in the database, optionally filtered by a query.
 *
 * @param {ConditionNode<Partial<T>>} [query] - An optional query to filter the documents to count. Must be a valid object if provided.
 * @returns {Promise<number>} - A promise that resolves to the number of documents matching the query, or the total number of documents if no query is provided.
 * @throws {Error} - Throws an error if the query is provided and is not a valid object.
 */
  public async countDocuments(query?: ConditionNode<Partial<T>>): Promise<number> {
    await this.ready;

    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return query && Object.keys(query).length ? (await this.getMany(query)).length : this.transactionManager.getCurrentDb().size;
  }

  /**
 * Generates and returns a new unique identifier (MEMOZID).
 *
 * @returns {MEMOZID} - A newly generated unique identifier.
 */
  public static id(): MEMOZID {
    return memozId();
  }

  /**
 * Validates whether the provided ID is a valid MEMOZID.
 *
 * @param {MEMOZID} id - The ID to validate.
 * @returns {boolean} - Returns true if the ID is valid, otherwise false.
 */
  public static isValidId(id: MEMOZID): boolean {
    return isValidMemozId(id);
  }

  private getFromIndex(query: any): DocumentWithId<T>[] {
    return this.indexManager.getFromIndex(query, this.transactionManager.getCurrentDb());
  }
}

export default Memoz;
