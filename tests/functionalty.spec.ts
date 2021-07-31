import { expect } from 'chai';
import Memoz from '../src/index';
import isValidUUid from '../src/utils/is-valid-uuid';

describe('Functionality', () => {
  const memoz = new Memoz();

  it('should write in array', () => {
    const saved = memoz.createOne({ name: 'milad' });

    expect(saved).to.be.an('object').with.keys(['id', 'name']);
    const { id, name } = saved;
    expect(id).to.be.a('string').and.length(46);
    expect(name).to.be.a('string').and.equal('milad');
    expect(isValidUUid(saved.id)).to.equal(true);
  });

  it('should write many ', () => {
    memoz.deleteAll();
    const documents = memoz.createMany([{ name: 'milad' }, { name: 'medo' }]);

    expect(documents).to.be.an('array').with.length.greaterThan(0);
    const { name, id } = documents[0];
    expect(name).to.be.a('string');
    expect(isValidUUid(id)).to.be.a('boolean').and.equal(true);
  });

  it('should get one by id', () => {
    const saved = memoz.createOne({ name: 'milad' });
    const oneObject = memoz.getById(saved.id);

    expect(oneObject).to.be.an('object').with.keys(['name', 'id']);
    const { name, id } = oneObject;

    expect(name).to.be.a('string').and.equal('milad');
    expect(id).to.be.a('string').and.equal(saved.id);
    expect(isValidUUid(id)).to.equal(true);
  });

  it('should get one', () => {
    const document = memoz.getOne({ name: 'milad' });

    expect(document).to.be.an('object').and.have.keys(['name', 'id']);
    const { name, id } = document;
    expect(name).to.be.a('string').and.equal('milad');
    expect(isValidUUid(id)).equal(true);
  });

  it('should get many', () => {
    const documents = memoz.getMany({ name: 'milad' });

    expect(documents).to.be.an('array').with.length.greaterThan(0);
    const { name, id } = documents[0];
    expect(name).to.be.a('string').and.equal('milad');
    expect(isValidUUid(id)).equal(true);
  });

  it('should delete by id', () => {
    const saved = memoz.createOne({ name: 'milad' });
    const deletedObject = memoz.deleteById(saved.id);

    expect(deletedObject).to.be.an('object').with.keys(['name', 'id']);
    const { name, id } = deletedObject;

    expect(name).to.be.a('string').and.equal('milad');
    expect(id).to.be.a('string').and.equal(saved.id);
    expect(isValidUUid(id)).to.equal(true);
  });

  it('should delete one', () => {
    memoz.deleteAll();
    const saved = memoz.createOne({ name: 'milad' });
    const deletedObject = memoz.deleteOne({ name: 'milad' });

    expect(deletedObject).to.be.an('object').with.keys(['name', 'id']);
    const { name, id } = deletedObject;

    expect(name).to.be.a('string').and.equal('milad');
    expect(id).to.be.a('string').and.equal(saved.id);
    expect(isValidUUid(id)).to.equal(true);
  });

  it('should update one by id', () => {
    const saved = memoz.createOne({ name: 'milad' });
    const updatedObject = memoz.updateById(saved.id, { name: 'medo' });

    expect(updatedObject).to.be.an('object').and.have.keys(['name', 'id']);
    const { name, id } = updatedObject;
    expect(name).to.be.a('string').and.equal('medo');
    expect(id).to.be.a('string').and.equal(saved.id);
  });

  it('should update one', () => {
    memoz.deleteAll();
    const saved = memoz.createOne({ name: 'milad' });
    const updatedObject = memoz.updateOne({ name: 'milad' }, { name: 'medo' });

    expect(updatedObject).to.be.an('object').with.keys(['name', 'id']);

    const { name, id } = updatedObject;

    expect(name).to.be.a('string').and.equal('medo');
    expect(id).to.be.a('string').equal(saved.id);
  });

  it('should update many', () => {
    memoz.deleteAll();
    memoz.createOne({ name: 'milad' });
    memoz.createOne({ name: 'melo' });
    memoz.createOne({ name: 'melo' });
    memoz.createOne({ name: 'milad' });
    const size = memoz.countDocuments({ name: 'milad' });

    const updatedDocuments = memoz.updateMany({ name: 'milad' }, { name: 'medo' });

    expect(updatedDocuments).to.be.an('object').and.have.keys(['updated', 'n', 'documents']);
    const { updated, n, documents } = updatedDocuments;
    expect(updated).to.be.a('boolean').and.equal(true);
    expect(n).to.be.a('number').and.equal(size);
    expect(documents).to.be.an('array').and.with.length(n);
  });

  it('should delete all', () => {
    const size = memoz.countDocuments();
    const deletedAll = memoz.deleteAll();

    expect(deletedAll).to.be.an('object').and.have.keys(['deleted', 'n']);
    const { deleted, n } = deletedAll;
    expect(deleted).to.be.a('boolean').and.equal(true);
    expect(n).to.be.a('number').and.equal(size);
  });

  it('should delete many', () => {
    memoz.createOne({ name: 'milad' });
    memoz.createOne({ name: 'milad' });
    memoz.createOne({ name: 'milad' });

    const size = memoz.countDocuments({ name: 'milad' });
    const deletedMany = memoz.deleteMany({ name: 'milad' });
    expect(deletedMany).to.be.an('object').with.keys(['deleted', 'n']);
    const { deleted, n } = deletedMany;
    expect(deleted).to.be.a('boolean').and.equal(true);
    expect(n).but.be.a('number').and.equal(size);

    const documents = memoz.getMany({ name: 'milad' });
    expect(documents).to.be.an('array').and.with.lengthOf(0);
  });
});
