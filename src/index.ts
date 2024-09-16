/* eslint-disable class-methods-use-this */
import fs from 'fs';
import path from 'path';
import uuid from './utils/uuid';
import isObject from './utils/is-object';
import isValidUUid from './utils/is-valid-uuid';
import getOne from './utils/get-one';
import getMany from './utils/get-many';

class Memoz {
  private db: Map<string, any>;

  private filePath?: string;

  private persistToDisk: boolean;

  constructor(filePath?: string, persistToDisk: boolean = false) {
    this.db = new Map();
    this.filePath = filePath ? path.resolve(filePath) : './data.json'; // Use path.resolve for robust path handling
    this.persistToDisk = persistToDisk;

    if (this.persistToDisk && this.filePath) {
      this.loadFromDisk();
    }
  }

  private saveToDisk() {
    if (this.persistToDisk && this.filePath) {
      const data = JSON.stringify(Array.from(this.db.entries()));
      fs.writeFileSync(this.filePath, data, 'utf8');
    }
  }

  private loadFromDisk() {
    if (this.persistToDisk && this.filePath && fs.existsSync(this.filePath)) {
      const data = fs.readFileSync(this.filePath, 'utf8');
      const entries = JSON.parse(data) as [string, any][];
      this.db = new Map(entries);
    }
  }

  public createOne(document: any): any {
    if (!isObject(document)) {
      throw new Error('The document must be a valid object');
    }

    const id = uuid();
    const dbDocument = { ...document, id };

    this.db.set(id, dbDocument);
    this.saveToDisk(); // Save to disk if persistence is enabled

    return dbDocument;
  }

  public createMany(documents: any[]): any[] {
    documents.forEach((document) => {
      if (!isObject(document)) {
        throw new Error('The document must be a valid object');
      }
    });

    const createdDocuments = documents.map((document) => this.createOne(document));
    return createdDocuments;
  }

  public getById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('The ID must be valid');
    }

    return this.db.get(id);
  }

  public getOne(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getOne(query, [...this.db.values()]);
  }

  public getMany(query: any): any[] {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getMany(query, [...this.db.values()]);
  }

  public updateById(id: string, newData: any): any {
    if (!isValidUUid(id)) {
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
    this.db.set(id, updatedObject);
    this.saveToDisk(); // Save to disk if persistence is enabled

    return updatedObject;
  }

  public updateOne(query: any, newData: any): any {
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
    this.db.set(existingObject.id, updatedObject);
    this.saveToDisk(); // Save to disk if persistence is enabled

    return updatedObject;
  }

  public updateMany(query: any, newData: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const documents = this.getMany(query);

    documents.forEach((document) => this.updateById(document.id, newData));
    this.saveToDisk(); // Save to disk if persistence is enabled

    return { updated: true, n: documents.length, documents };
  }

  public deleteById(id: string): any {
    if (!isValidUUid(id)) {
      throw new Error('The ID must be valid');
    }

    const deletedObject = this.getById(id);
    this.db.delete(id);
    this.saveToDisk(); // Save to disk if persistence is enabled

    return deletedObject;
  }

  public deleteOne(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const deletedObject = this.getOne(query);
    return this.deleteById(deletedObject.id);
  }

  public deleteMany(query: any): any {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const documents = this.getMany(query);

    documents.forEach((document) => this.deleteById(document.id));
    this.saveToDisk(); // Save to disk if persistence is enabled

    const sizeAfterDeleted = this.countDocuments(query);
    return { deleted: sizeAfterDeleted === 0, n: documents.length };
  }

  public deleteAll(): any {
    const size = this.countDocuments();
    this.db.clear();
    this.saveToDisk(); // Save to disk if persistence is enabled

    return { deleted: this.countDocuments() === 0, n: size };
  }

  public countDocuments(query?: any): number {
    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (query && Object.keys(query).length) {
      const documents = this.getMany(query);
      return documents.length;
    }

    return this.db.size;
  }

  public id(): string {
    return uuid();
  }

  public isValidId(id: string): boolean {
    return isValidUUid(id);
  }
}

export default Memoz;
