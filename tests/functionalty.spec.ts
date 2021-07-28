import { expect } from 'chai';
import Memoz from '../src/index';

describe('Functionality', () => {
  const memoz = new Memoz();

  it('should write in array', () => {
    const saved = memoz.create({ name: 'milad' });
    expect(saved).to.be.an('object').with.keys(['id', 'name']);
    const { id, name } = saved;
    expect(id).to.be.a('string').and.length(46);
    expect(name).to.be.a('string').and.equal('milad');
  });

  it('should fail write in array, because object is empty', () => {
    expect(memoz.create.bind(memoz, {})).to.throw('the document must be a valid object');
  });

  it('should get one from array', () => {
    const data = memoz.getOne({ name: 'milad' });
    expect(data).to.be.an('object').with.keys(['name', 'id']);
    expect(data.name).to.be.a('string').and.equal('milad');
  });

  it('should get all from array', () => {
    const data = memoz.get();
    expect(data).to.be.an('array').with.length.greaterThan(0);
  });

  it('should get from array', () => {
    const data = memoz.get({ name: 'milad' });
    expect(data).to.be.an('array').with.length.greaterThan(0);
  });

  it('should update one from array', () => {
    const { updated, data } = memoz.updateOne({ name: 'milad' }, { name: 'memo' });
    expect(data).to.be.an('object').with.keys(['name', 'id']);
    expect(updated).to.be.a('boolean').and.equal(true);
  });

  it.skip('should update one from array', () => {
    memoz.create({ name: 'name' });
    memoz.create({ name: 'name' });
    memoz.create({ name: 'name' });
    memoz.create({ name: 'name' });

    const { updated } = memoz.updateMany({ name: 'milad' }, { name: 'memo' });
    expect(updated).to.be.a('boolean').and.equal(true);

    const oneData = memoz.getOne({ name: 'memo' });
    expect(oneData).to.be.an('object').with.keys(['id', 'name']);
    expect(oneData.name).to.be.a('string').and.equal('memo');
  });
});
