import fs from 'fs';
import path from 'path';
import { MEMOZID, memozId } from './utils/memoz-id';
import { isObject } from './utils/is-object';
import { isValidMemozId } from './utils/is-valid-memoz-id';
import { getOne } from './utils/get-one';
import { getMany } from './utils/get-many';
import { ConditionNode } from './types';

export type DocumentWithId<T> = T & { id: MEMOZID };
export type UpdateManyResult<T> = { updated: boolean; n: number; documents: DocumentWithId<T>[] }
class Memoz<T> {
  private db: Map<MEMOZID, DocumentWithId<T>>;

  private filePath?: string;

  private persistToDisk: boolean;

  constructor(filePath?: string, persistToDisk: boolean = false) {
    this.db = new Map();
    this.filePath = filePath ? path.resolve(filePath) : './data.json';
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
      const entries = JSON.parse(data) as [MEMOZID, DocumentWithId<T>][];
      this.db = new Map(entries);
    }
  }

  public createOne(document: T): DocumentWithId<T> {
    if (!isObject(document)) {
      throw new Error('The document must be a valid object');
    }

    const id = memozId();
    const dbDocument: DocumentWithId<T> = { ...document, id };

    this.db.set(id, dbDocument);
    this.saveToDisk();

    return dbDocument;
  }

  public createMany(documents: T[]): DocumentWithId<T>[] {
    documents.forEach((document) => {
      if (!isObject(document)) {
        throw new Error('The document must be a valid object');
      }
    });

    const createdDocuments = documents.map((document) => this.createOne(document));
    return createdDocuments;
  }

  public getById(id: MEMOZID): DocumentWithId<T> | undefined {
    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    return this.db.get(id);
  }

  public getOne(query: ConditionNode<Partial<T>>): DocumentWithId<T> | undefined {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getOne([...this.db.values()], query);
  }

  public getMany(query: ConditionNode<Partial<T>>): DocumentWithId<T>[] {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    return getMany([...this.db.values()], query);
  }

  public updateById(id: MEMOZID, newData: Partial<T>): DocumentWithId<T> {
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
    this.db.set(id, updatedObject);
    this.saveToDisk();

    return updatedObject;
  }

  public updateOne(query: ConditionNode<Partial<T>>, newData: Partial<T>): DocumentWithId<T> {
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
    this.saveToDisk();

    return updatedObject;
  }

  public updateMany(query: ConditionNode<Partial<T>>, newData: Partial<T>): UpdateManyResult<T> {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (!isObject(newData)) {
      throw new Error('The new data must be a valid object');
    }

    const documents = this.getMany(query);

    documents.forEach((document) => this.updateById(document.id, newData));
    this.saveToDisk();

    return { updated: true, n: documents.length, documents };
  }

  public deleteById(id: MEMOZID): DocumentWithId<T> | undefined {
    if (!isValidMemozId(id)) {
      throw new Error('The ID must be valid');
    }

    const deletedObject = this.getById(id);
    this.db.delete(id);
    this.saveToDisk();

    return deletedObject;
  }

  public deleteOne(query: ConditionNode<Partial<T>>): DocumentWithId<T> | undefined {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const deletedObject = this.getOne(query);
    return deletedObject ? this.deleteById(deletedObject.id) : undefined;
  }

  public deleteMany(query: ConditionNode<Partial<T>>): { deleted: boolean; n: number } {
    if (!isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    const documents = this.getMany(query);

    documents.forEach((document) => this.deleteById(document.id));
    this.saveToDisk();

    return { deleted: true, n: documents.length };
  }

  public deleteAll(): { deleted: boolean; n: number } {
    const size = this.countDocuments();
    this.db.clear();
    this.saveToDisk();

    return { deleted: this.countDocuments() === 0, n: size };
  }

  public countDocuments(query?: ConditionNode<Partial<T>>): number {
    if (query && !isObject(query)) {
      throw new Error('The query must be a valid object');
    }

    if (query && Object.keys(query).length) {
      const documents = this.getMany(query);
      return documents.length;
    }

    return this.db.size;
  }

  // eslint-disable-next-line class-methods-use-this
  public id(): MEMOZID {
    return memozId();
  }

  // eslint-disable-next-line class-methods-use-this
  public isValidId(id: MEMOZID): boolean {
    return isValidMemozId(id);
  }
}

export default Memoz;
