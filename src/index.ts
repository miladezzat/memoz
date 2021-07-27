import getOneObject from './utils/get-one';
import deleteData from './utils/delete';
import uuid from './utils/uuid';
import update from './utils/update';
import updateOne from './utils/update-one';
import getMany from './utils/get-many';
import deleteOne from './utils/delete-one';

class Memoz {
  private db: any[];

  constructor() {
    this.db = [];
  }

  public create(key:string, value: any) {
    const id = uuid();
    this.db.push({ id, [key]: value });

    return { id, [key]: value };
  }

  public get(query?:any) {
    if (!Object.keys(query || {}).length) {
      return this.db;
    }

    return getMany(query, this.db);
  }

  public getOne(query:any) {
    const result = getOneObject(query, this.db);

    return result;
  }

  public deleteMany(query:any) {
    const results = deleteData(query, this.db);

    this.db = results;

    return { deleted: true, number: this.db.length - results.length };
  }

  public deleteOne(query:any) {
    const deleted = this.getOne(query);
    const results = deleteOne(deleted, this.db);

    this.db = results;

    return { deleted };
  }

  public updateMany(query:any, newData:any) {
    const results = update(query, this.db, newData);

    this.db = results;

    return { updated: true };
  }

  public updateOne(query:any, newData:any) {
    const obj = this.getOne(query);

    const { updated, updatedData } = updateOne(obj, this.db, newData);

    this.db = updatedData;

    return { updated: true, data: updated };
  }
}

export default Memoz;
