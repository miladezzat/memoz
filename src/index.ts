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

  public createMany(documents:any[]): any[] {
    documents.map((document) => {
      if (!isObject(document)) {
        throw new Error('the document must be a valid object');
      }

      return document;
    });

    return documents.map((document) => this.createOne(document));
  }

  public getById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('the document must be a valid object');
    }

    return this.db.get(id);
  }

  public getOne(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getOne(query, [...this.db.values()]);
  }

  public getMany(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getMany(query, [...this.db.values()]);
  }

  public updateById(id:string, newData:any) {
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

  public updateOne(query:any, newData: any) {
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

  public updateMany(query:any, newData:any) {
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

  public deleteById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('the document must be a valid object');
    }

    const deletedObject: any = this.getById(id);
    this.db.delete(id);

    return deletedObject;
  }

  public deleteOne(query:any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const deletedObject: any = this.getOne(query);

    return this.deleteById(deletedObject.id);
  }

  public deleteMany(query:any) {
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

  public deleteAll() {
    const size = this.countDocuments();

    this.db.clear();

    if (this.countDocuments()) {
      return { deleted: false, n: size };
    }

    return { deleted: true, n: size };
  }

  public countDocuments(query?:any) {
    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (query && Object.keys(query)) {
      const documents:any[] = this.getMany(query);
      return documents.length;
    }

    return this.db.size;
  }

  // eslint-disable-next-line class-methods-use-this
  public id():string {
    return uuid();
  }

  // eslint-disable-next-line class-methods-use-this
  public isValidUUID(id:string):boolean {
    return isValidUUid(id);
  }
}

export default Memoz;
