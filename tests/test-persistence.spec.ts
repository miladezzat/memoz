import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import Memoz from '../src/index';
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

  beforeEach(() => {
    // Initialize Memoz with persistence enabled and the path to the temporary file
    memoz = new Memoz<User>(tempFilePath, true);
  });

  afterEach(() => {
    // Clean up the temporary file after each test
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it('should create and persist one document', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });

    expect(saved).to.be.an('object').with.keys(['id', 'name', 'age']);
    expect(saved.name).to.equal('milad');
    expect(saved.age).to.equal(30);
    expect(isValidMemozId(saved.id)).to.equal(true);

    // Check if the data is persisted to file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, User][];
    expect(persistedData).to.have.lengthOf(1);
  });

  it('should create and persist multiple documents', () => {
    const documents = memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);
    expect(documents).to.have.lengthOf(2);
    expect(isValidMemozId(documents[0].id)).to.equal(true);

    // Check if data is persisted
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, User][];
    expect(persistedData).to.have.lengthOf(2);
  });

  it('should get document by id', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });
    const retrieved = memoz.getById(saved.id);
    expect(retrieved).to.deep.equal(saved);
  });

  it('should get one document by query', () => {
    memoz.createOne({ name: 'milad', age: 30 });
    const result = memoz.getOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] });
    expect(result?.name).to.equal('milad');
  });

  it('should get multiple documents by query', () => {
    memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'melo', age: 25 },
    ]);

    const results = memoz.getMany({
      $or: [
        { field: 'name', operator: '$in', value: ['milad', 'melo'] },
      ],
    });

    expect(results).to.have.lengthOf(2);
  });

  it('should update document by id and persist changes', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });
    const updated = memoz.updateById(saved.id, { name: 'medo', age: 31 });
    expect(updated.name).to.equal('medo');
    expect(updated.age).to.equal(31);

    const persistedData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8')) as [string, User][];
    const updatedDoc = persistedData.find(([docId]) => docId === saved.id);
    expect(updatedDoc?.[1].name).to.equal('medo');
  });

  it('should update one document by query', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });
    const updated = memoz.updateOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] }, { name: 'medo', age: 31 });
    expect(updated.name).to.equal('medo');
    expect(updated.age).to.equal(31);
    expect(updated.id).to.equal(saved.id);
  });

  it('should update many documents by query', () => {
    memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);
    const { updated, n } = memoz.updateMany({ $and: [{ field: 'name', operator: '$in', value: ['milad', 'medo'] }] }, { active: true });
    expect(updated).to.equal(true);
    expect(n).to.equal(2);

    const updatedDocs = memoz.getMany({ $and: [{ field: 'active', value: true, operator: '$eq' }] });
    expect(updatedDocs).to.have.lengthOf(2);
  });

  it('should delete document by id', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });
    const deleted = memoz.deleteById(saved.id);
    expect(deleted?.id).to.equal(saved.id);

    const persistedData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8')) as [string, User][];
    expect(persistedData).to.have.lengthOf(0);
  });

  it('should delete one document by query', () => {
    memoz.createOne({ name: 'milad', age: 30 });
    const deleted = memoz.deleteOne({ $and: [{ field: 'name', value: 'milad', operator: '$eq' }] });
    expect(deleted?.name).to.equal('milad');
  });

  it('should delete multiple documents by query', () => {
    memoz.createMany([
      { name: 'milad', age: 30 },
      { name: 'medo', age: 25 },
    ]);
    const { deleted, n } = memoz.deleteMany({ $and: [{ field: 'name', operator: '$in', value: ['milad', 'medo'] }] });
    expect(deleted).to.equal(true);
    expect(n).to.equal(2);

    const persistedData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8')) as [string, User][];
    expect(persistedData).to.have.lengthOf(0);
  });

  it('should delete all documents', () => {
    memoz.createMany([{ name: 'milad', age: 30 }, { name: 'medo', age: 25 }]);
    const deletedAll = memoz.deleteAll();
    expect(deletedAll.n).to.equal(2);
  });

  it('should count documents', () => {
    memoz.createMany([{ name: 'milad', age: 30 }, { name: 'medo', age: 25 }]);
    const count = memoz.countDocuments();
    expect(count).to.equal(2);
  });

  it('should validate MEMOZID', () => {
    const saved = memoz.createOne({ name: 'milad', age: 30 });
    expect(memoz.isValidId(saved.id)).to.equal(true);
  });
});
