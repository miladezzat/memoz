import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { Memoz } from '../src/index';
import { isValidMemozId } from '../src/utils/is-valid-memoz-id';

// Define a model for testing
type User = {
  name: string;
  age?: number;
  active?: boolean;
};

describe('Memoz Functionality with Persistence', () => {
  const tempFilePath = path.resolve(__dirname, 'test-db.json'); // Path to the temporary file
  let memoz: Memoz<User>;
  // eslint-disable-next-line no-undef
  let timeoutId: NodeJS.Timeout;

  function checkPersistence(length = 1): void {
    timeoutId = setTimeout(() => {
      if (fs.existsSync(tempFilePath)) {
        const fileData = fs.readFileSync(tempFilePath, 'utf8');

        const persistedData = JSON.parse(fileData) as [string, User][];
        expect(persistedData).to.have.lengthOf(length);
      }
    }, 3000);
  }

  beforeEach(() => {
    memoz = new Memoz<User>({ storagePath: tempFilePath, persistToDisk: true });
  });

  afterEach(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  after(() => {
    setTimeout(() => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }, 6000);
  });

  it('should create and persist one document', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    expect(saved).to.be.an('object').with.keys(['id', 'name', 'age']);
    expect(saved.name).to.equal('milad');
    expect(saved.age).to.equal(30);
    expect(isValidMemozId(saved.id)).to.equal(true);
    checkPersistence();
  });

  it('should create and persist multiple documents', async () => {
    const documents = await memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);
    expect(documents).to.have.lengthOf(2);
    expect(isValidMemozId(documents[0].id)).to.equal(true);

    checkPersistence(2);
  });

  it('should get document by id', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    const retrieved = await memoz.getById(saved.id);
    expect(retrieved).to.deep.equal(saved);
  });

  it('should get one document by query', async () => {
    await memoz.createOne({ name: 'milad', age: 30 });
    const result = await memoz.getOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] });
    expect(result?.name).to.equal('milad');
  });

  it('should get multiple documents by query', async () => {
    await memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'melo', age: 25 },
    ]);

    const results = await memoz.getMany({
      $or: [
        { field: 'name', operator: '$in', value: ['milad', 'melo'] },
      ],
    });

    expect(results).to.have.lengthOf(2);
  });

  it('should update document by id and persist changes', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    const updated = await memoz.updateById(saved.id, { name: 'medo', age: 31 });

    expect(updated.name).to.be.equal('medo');
    expect(updated.age).to.equal(31);
  });

  it('should update one document by query', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    const updated = await memoz.updateOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] }, { name: 'medo', age: 31 });
    expect(updated.name).to.equal('medo');
    expect(updated.age).to.equal(31);
    expect(updated.id).to.equal(saved.id);
  });

  it('should update many documents by query', async () => {
    await memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);
    const { updated, n } = await memoz.updateMany({ $and: [{ field: 'name', operator: '$in', value: ['milad', 'medo'] }] }, { active: true });
    expect(updated).to.equal(true);
    expect(n).to.equal(2);

    const updatedDocs = await memoz.getMany({ $and: [{ field: 'active', value: true, operator: '$eq' }] });
    expect(updatedDocs).to.have.lengthOf(2);
  });

  it('should delete document by id', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    const deleted = await memoz.deleteById(saved.id);
    expect(deleted?.id).to.equal(saved.id);
    checkPersistence(0);
  });

  it('should delete one document by query', async () => {
    await memoz.createOne({ name: 'milad', age: 30 });
    const deleted = await memoz.deleteOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] });
    expect(deleted?.name).to.equal('milad');
  });

  it('should delete multiple documents by query', async () => {
    await memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);

    const { deleted, n } = await memoz.deleteMany({ $and: [{ field: 'name', operator: '$in', value: ['milad', 'medo'] }] });
    expect(deleted).to.equal(true);
    expect(n).to.equal(2);

    checkPersistence(0);
  });

  it('should delete all documents', async () => {
    await memoz.createMany([{ name: 'milad', age: 30 }, { name: 'medo', age: 25 }]);
    const deletedAll = await memoz.deleteAll();
    expect(deletedAll.n).to.equal(2);
  });

  it('should count documents', async () => {
    await memoz.createMany([{ name: 'milad', age: 30 }, { name: 'medo', age: 25 }]);
    const count = await memoz.countDocuments();
    expect(count).to.equal(2);
  });

  it('should validate MEMOZID', async () => {
    const saved = await memoz.createOne({ name: 'milad', age: 30 });
    expect(Memoz.isValidId(saved.id)).to.equal(true);
  });
});
