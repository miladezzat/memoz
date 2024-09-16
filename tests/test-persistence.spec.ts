/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import Memoz from '../src/index';
import isValidUUid from '../src/utils/is-valid-uuid';

describe('Functionality with Persistence', () => {
  const tempFilePath = path.resolve(__dirname, 'test-db.json'); // Path to the temporary file
  let memoz: Memoz;

  beforeEach(() => {
    // Initialize Memoz with persistence enabled and the path to the temporary file
    memoz = new Memoz(tempFilePath, true);
  });

  afterEach(() => {
    // Clean up the temporary file after each test
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it('should write in array and persist to file', () => {
    const saved = memoz.createOne({ name: 'milad' });

    expect(saved).to.be.an('object').with.keys(['id', 'name']);
    const { id, name } = saved;
    expect(id).to.be.a('string').and.length(46);
    expect(name).to.be.a('string').and.equal('milad');
    expect(isValidUUid(saved.id)).to.equal(true);

    // Check if the data is persisted to file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, any][];
    expect(persistedData).to.have.lengthOf(1);
    const [persistedId, persistedDoc] = persistedData[0];
    expect(isValidUUid(persistedId)).to.be.a('boolean').and.equal(true);
    expect(persistedDoc).to.deep.equal({ id, name });
  });

  it('should write many and persist to file', () => {
    memoz.deleteAll();
    const documents = memoz.createMany([{ name: 'milad' }, { name: 'medo' }]);

    expect(documents).to.be.an('array').with.length.greaterThan(0);
    const { name, id } = documents[0];
    expect(name).to.be.a('string');
    expect(isValidUUid(id)).to.be.a('boolean').and.equal(true);

    // Check if the data is persisted to file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, any][];
    expect(persistedData).to.have.lengthOf(2);
  });

  it('should update one by id and persist changes', () => {
    const saved = memoz.createOne({ name: 'milad' });
    const updatedObject = memoz.updateById(saved.id, { name: 'medo' });

    expect(updatedObject).to.be.an('object').and.have.keys(['name', 'id']);
    const { name, id } = updatedObject;
    expect(name).to.be.a('string').and.equal('medo');
    expect(id).to.be.a('string').and.equal(saved.id);

    // Check if the changes are persisted to file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, any][];
    const updatedDoc = persistedData.find(([docId]) => docId === id);
    expect(updatedDoc).to.not.be.undefined;
    const [, persistedDoc] = updatedDoc!;
    expect(persistedDoc.name).to.equal('medo');
  });

  it('should delete one and reflect in file', () => {
    memoz.deleteAll();
    const saved = memoz.createOne({ name: 'milad' });
    const deletedObject = memoz.deleteOne({ name: 'milad' });

    expect(deletedObject).to.be.an('object').with.keys(['name', 'id']);
    const { name, id } = deletedObject;

    expect(name).to.be.a('string').and.equal('milad');
    expect(id).to.be.a('string').and.equal(saved.id);
    expect(isValidUUid(id)).to.equal(true);

    // Check if the data is removed from file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    const persistedData = JSON.parse(fileData) as [string, any][];
    expect(persistedData).to.not.deep.include([id, { id, name }]);
  });

  it('should delete all and reflect in file', () => {
    memoz.createOne({ name: 'milad' });
    memoz.createOne({ name: 'medo' });
    const deletedAll = memoz.deleteAll();

    expect(deletedAll).to.be.an('object').and.have.keys(['deleted', 'n']);
    const { deleted, n } = deletedAll;
    expect(deleted).to.be.a('boolean').and.equal(true);
    expect(n).to.be.a('number');

    // Check if all data is removed from file
    const fileData = fs.readFileSync(tempFilePath, 'utf8');
    expect(fileData).to.equal('[]'); // File should be empty
  });
});
