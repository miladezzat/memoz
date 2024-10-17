import { expect } from 'chai';
import { Memoz } from '../src/index';

type SampleDocument = {
  name: string;
  age: number;
};

describe('Memoz Transactions', () => {
  let memoz: Memoz<SampleDocument>;

  beforeEach(() => {
    // Initialize Memoz before each test
    memoz = new Memoz<SampleDocument>();
  });

  it('should begin a transaction', async () => {
    await memoz.beginTransaction();
    expect(() => memoz.commitTransaction()).to.not.throw();
  });

  it('should commit a transaction', async () => {
    await memoz.beginTransaction();
    const doc: SampleDocument = { name: 'John Doe', age: 30 };
    const createdDoc = await memoz.createOne(doc);

    await memoz.commitTransaction();

    const fetchedDoc = await memoz.getById(createdDoc.id);

    expect(fetchedDoc).to.deep.equal(createdDoc); // Use deep.equal for object comparison
  });

  it('should rollback a transaction', async () => {
    await memoz.beginTransaction();
    const doc: SampleDocument = { name: 'Jane Doe', age: 25 };

    const createdDoc = await memoz.createOne(doc);
    await memoz.rollbackTransaction();
    const fetchedDoc = await memoz.getById(createdDoc.id);

    expect(fetchedDoc).to.be.equal(undefined); // Should not exist
  });

  it('should maintain state between transactions', async () => {
    await memoz.beginTransaction();
    const doc1 = await memoz.createOne({ name: 'Alice', age: 28 });
    await memoz.commitTransaction();

    await memoz.beginTransaction();
    const doc2 = await memoz.createOne({ name: 'Bob', age: 35 });
    await memoz.commitTransaction();

    // Verify both documents exist
    const fetchedDoc1 = await memoz.getById(doc1.id);
    const fetchedDoc2 = await memoz.getById(doc2.id);

    expect(fetchedDoc1).to.deep.equal(doc1); // Use deep.equal for object comparison
    expect(fetchedDoc2).to.deep.equal(doc2);
  });
});
