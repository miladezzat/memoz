import { expect } from 'chai';
import { rejects } from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Memoz } from '../src';
import { ConditionNode, DocumentWithId } from '../src/types';

type User = {
  name: string;
  active?: boolean;
};

function named(name: string): ConditionNode<Partial<User>> {
  return { field: 'name', operator: '$eq', value: name };
}

describe('Persistence and transaction regressions', () => {
  let directory: string;
  let storagePath: string;
  let memoz: Memoz<User>;

  function persistedDocuments(): DocumentWithId<User>[] {
    const entries = JSON.parse(fs.readFileSync(storagePath, 'utf8')) as [string, DocumentWithId<User>][];
    return entries.map(([, document]) => document);
  }

  beforeEach(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memoz-regression-'));
    storagePath = path.join(directory, 'db.json');
    fs.writeFileSync(storagePath, '[]');
    memoz = new Memoz<User>({ storagePath, persistToDisk: true });
    await memoz.ready;
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('finishes writing before an awaited create resolves', async () => {
    const created = await memoz.createOne({ name: 'Durable' });

    expect(persistedDocuments()).to.deep.equal([created]);
  });

  it('persists the final state of concurrent writes', async () => {
    const created = await Promise.all(Array.from({ length: 8 }, (_, index) => memoz.createOne({ name: `User ${index}` })));

    expect(persistedDocuments()).to.deep.equal(created);
  });

  it('preserves committed inserts, updates, and deletes after reopening', async () => {
    const [updated, deleted] = await memoz.createMany([{ name: 'Before' }, { name: 'Deleted' }]);
    await memoz.beginTransaction();
    const changed = await memoz.updateById(updated.id, { name: 'After' });
    await memoz.deleteById(deleted.id);
    const inserted = await memoz.createOne({ name: 'Inserted' });
    await memoz.commitTransaction();

    const reopened = new Memoz<User>({ storagePath, persistToDisk: true });
    expect(await reopened.getMany()).to.deep.equal([changed, inserted]);
    expect(await reopened.getById(deleted.id)).to.equal(undefined);
    expect((await memoz.fuzzySearch('Inserted', ['name'], {})).map(({ item }) => item)).to.deep.equal([inserted]);

    const later = await memoz.createOne({ name: 'Later' });
    expect(persistedDocuments()).to.deep.equal([changed, inserted, later]);
  });

  it('keeps rolled-back changes off disk and persists subsequent writes', async () => {
    const original = await memoz.createOne({ name: 'Original' });
    await memoz.beginTransaction();
    await memoz.updateById(original.id, { name: 'Uncommitted' });
    const discarded = await memoz.createOne({ name: 'Discarded' });
    expect(persistedDocuments()).to.deep.equal([original]);
    await memoz.rollbackTransaction();
    const later = await memoz.createOne({ name: 'Later' });

    const reopened = new Memoz<User>({ storagePath, persistToDisk: true });
    expect(await reopened.getMany()).to.deep.equal([original, later]);
    expect(await reopened.getById(discarded.id)).to.equal(undefined);
    expect((await memoz.fuzzySearch('Later', ['name'], {})).map(({ item }) => item)).to.deep.equal([later]);
  });

  [false, true].forEach((useMutex) => {
    it(`returns and persists all bulk updates before resolving (mutex: ${useMutex})`, async () => {
      const database = new Memoz<User>({ storagePath, persistToDisk: true, useMutex });
      const matching = await database.createMany([{ name: 'Match' }, { name: 'Match' }]);
      const untouched = await database.createOne({ name: 'Other' });
      const expected = matching.map((document) => ({ ...document, active: true }));

      const result = await database.updateMany(named('Match'), { active: true });

      expect(result).to.deep.equal({ updated: true, n: 2, documents: expected });
      expect(await database.getMany(named('Match'))).to.deep.equal(expected);
      expect(persistedDocuments()).to.deep.equal([...expected, untouched]);
    });

    it(`persists bulk deletes before resolving (mutex: ${useMutex})`, async () => {
      const database = new Memoz<User>({ storagePath, persistToDisk: true, useMutex });
      await database.createMany([{ name: 'Match' }, { name: 'Match' }]);
      const untouched = await database.createOne({ name: 'Other' });

      expect(await database.deleteMany(named('Match'))).to.deep.equal({ deleted: true, n: 2 });
      expect(persistedDocuments()).to.deep.equal([untouched]);
    });
  });

  it('persists a query-based single delete before resolving with a mutex', async () => {
    const database = new Memoz<User>({ storagePath, persistToDisk: true, useMutex: true });
    const created = await database.createOne({ name: 'Deleted' });

    expect(await database.deleteOne(named('Deleted'))).to.deep.equal(created);
    expect(persistedDocuments()).to.deep.equal([]);
  });

  it('rejects failed writes and allows a later save to recover', async () => {
    fs.unlinkSync(storagePath);
    fs.mkdirSync(storagePath);

    await rejects(memoz.createOne({ name: 'Failed write' }), { code: 'EISDIR' });

    fs.rmdirSync(storagePath);
    const recovered = await memoz.createOne({ name: 'Recovered' });
    expect(persistedDocuments()).to.deep.include(recovered);
  });

  it('rejects a bulk update when persistence fails', async () => {
    const database = new Memoz<User>({ storagePath, persistToDisk: true, useMutex: true });
    await database.createOne({ name: 'Match' });
    fs.unlinkSync(storagePath);
    fs.mkdirSync(storagePath);

    await rejects(database.updateMany(named('Match'), { active: true }), { code: 'EISDIR' });
  });
});

describe('Query cache regressions', () => {
  let memoz: Memoz<User>;

  beforeEach(() => {
    memoz = new Memoz<User>();
  });

  it('does not return a cached insert after rollback', async () => {
    await memoz.beginTransaction();
    const created = await memoz.createOne({ name: 'Discarded' });
    expect(await memoz.getOne(named('Discarded'))).to.deep.equal(created);
    await memoz.rollbackTransaction();

    expect(await memoz.getOne(named('Discarded'))).to.equal(undefined);
    expect(await memoz.getById(created.id)).to.equal(undefined);
  });

  it('restores queries cached after a transactional update', async () => {
    const original = await memoz.createOne({ name: 'Original' });
    await memoz.beginTransaction();
    await memoz.updateById(original.id, { name: 'Changed' });
    await memoz.getMany(named('Changed'));
    await memoz.rollbackTransaction();

    expect(await memoz.getOne(named('Changed'))).to.equal(undefined);
    expect(await memoz.getOne(named('Original'))).to.deep.equal(original);
  });

  it('does not return cached single or paginated results after deleteAll', async () => {
    await memoz.createMany([{ name: 'Single' }, { name: 'Page' }, { name: 'Page' }]);
    await memoz.getOne(named('Single'));
    await memoz.getMany(named('Page')).limit(1);
    await memoz.deleteAll();

    expect(await memoz.countDocuments()).to.equal(0);
    expect(await memoz.getOne(named('Single'))).to.equal(undefined);
    expect(await memoz.getOne(named('Page'))).to.equal(undefined);
    expect(await memoz.getMany()).to.deep.equal([]);
  });

  it('invalidates the lookup cached by updateOne', async () => {
    const original = await memoz.createOne({ name: 'Original' });
    await memoz.updateOne(named('Original'), { name: 'Changed' });

    expect(await memoz.getOne(named('Original'))).to.equal(undefined);
    expect(await memoz.getOne(named('Changed'))).to.deep.equal({ ...original, name: 'Changed' });
  });

  it('leaves documents unchanged when a bulk update matches nothing', async () => {
    const original = await memoz.createOne({ name: 'Original' });

    expect(await memoz.updateMany(named('Missing'), { active: true })).to.deep.equal({ updated: true, n: 0, documents: [] });
    expect(await memoz.getMany()).to.deep.equal([original]);
  });
});
