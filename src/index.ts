import uuid from './utils/uuid';
import isObject from './utils/is-object';
import isValidUUid from './utils/is-valid-uuid';
import getOne from './utils/get-one';
import getMany from './utils/get-many';

/**
 * @description memoz is an in-memory database that persists on disk.
 * The data model is key-value, but many different kind of values are supported:
 * Strings, Lists, Sets, Sorted Sets, Hashes, Streams, HyperLogLogs, Bitmaps.
 */
class Memoz {
  private db: any;

  /**
   * @description initialization the db
   */
  constructor() {
    this.db = new Map();
  }

  /**
   *
   * @param document must be a javascript object with keys value pair
   * @returns {Object}
   */
  public createOne(document:any): any {
    if (!isObject(document)) {
      throw new Error('the document must be a valid object');
    }

    const id = uuid();

    const dbDocument = { ...document, id };

    this.db.set(id, dbDocument);

    return dbDocument;
  }

  /**
   *
   * @param documents must be ant array of a javascript object with keys value pair
   * @returns {Object}
   */
  public createMany(documents:any[]): any[] {
    documents.map((document) => {
      if (!isObject(document)) {
        throw new Error('the document must be a valid object');
      }

      return document;
    });

    return documents.map((document) => this.createOne(document));
  }

  /**
   *
   * @param id this must be a valid id
   * @returns {Object}
   */
  public getById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('the document must be a valid object');
    }

    return this.db.get(id);
  }

  /**
   *
   * @param query this a javascript object
   * @returns {Object}
   *
   * @description get one document based on query conditions
   */
  public getOne(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getOne(query, [...this.db.values()]);
  }

  /**
   *
   * @param query this is a javascript object
   * @returns {Object}
   *
   * @description get all documents that match the query
   */
  public getMany(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getMany(query, [...this.db.values()]);
  }

  /**
   *
   * @param id this must be a valid id
   * @param newData this must be an object with key value pair
   * @returns {Object}
   *
   * @description this update document by id
   */
  public updateById(id:string, newData:any): any {
    if (!isValidUUid(id)) {
      throw new Error('the document must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const oneObject = this.getById(id);

    if (!oneObject) {
      throw new Error('This id not exists');
    }

    const newObject = { ...oneObject, ...newData };

    this.db.set(id, newObject);

    return newObject;
  }

  /**
 *
 * @param query must be a javascript object
 * @param newData must be a javascript object
 * @returns {Object}
 *
 * @description this update the first document thar match the query
 */
  public updateOne(query:any, newData: any):any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const oneObject = this.getOne(query);

    if (!oneObject) {
      throw new Error('This query not match anything');
    }

    const newObject = { ...oneObject, ...newData };

    this.db.set(oneObject.id, newObject);

    return newObject;
  }

  /**
   *
   * @param query must be a javascript object
   * @param newData must be a javascript object
   * @returns {Object}
   *
   * @description this update all documents that match the query
   */
  public updateMany(query:any, newData:any):any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    let documents = this.getMany(query);

    documents = documents.map((document:any) => this.updateById(document.id, newData));

    return { updated: true, n: documents.length, documents };
  }

  /**
   *
   * @param id must be a valid id
   * @returns {Object}
   *
   * @description this delete a documents by its id
   */
  public deleteById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('the document must be a valid object');
    }

    const deletedObject: any = this.getById(id);
    this.db.delete(id);

    return deletedObject;
  }

  /**
   *
   * @param query must be a javascript object
   * @returns {Object}
   *
   * @description this must be delete the first document match the query
   */
  public deleteOne(query:any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const deletedObject: any = this.getOne(query);

    return this.deleteById(deletedObject.id);
  }

  /**
   *
   * @param query must be a javascript object
   * @returns {Object}
   *
   * @description this delete all documents that match the query
   */
  public deleteMany(query:any) :any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }
    const documents = this.getMany(query);

    documents.map((document:any) => this.deleteById(document.id));

    const sizeAfterDeleted = this.countDocuments(query);

    if (sizeAfterDeleted) {
      return { deleted: false };
    }

    return { deleted: true, n: documents.length };
  }

  /**
   *
   * @returns {Object}
   *
   * @description this delete all documents
   */
  public deleteAll():any {
    const size = this.countDocuments();

    this.db.clear();

    if (this.countDocuments()) {
      return { deleted: false, n: size };
    }

    return { deleted: true, n: size };
  }

  /**
   *
   * @param query must be a javascript object, optional
   * @returns {Number}
   *
   * @description this return the number of documents in database based on query or the whole size
   */
  public countDocuments(query?:any): number {
    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (query && Object.keys(query)) {
      const documents:any[] = this.getMany(query);
      return documents.length;
    }

    return this.db.size;
  }

  /**
   *
   * @returns {String}
   *
   * @description this create a unique id
   */
  // eslint-disable-next-line class-methods-use-this
  public id():string {
    return uuid();
  }

  /**
   *
   * @param id string
   * @returns {Boolean}
   *
   * @description this return true if id is valid id
   */
  // eslint-disable-next-line class-methods-use-this
  public isValidId(id:string):boolean {
    return isValidUUid(id);
  }
}

export default Memoz;
