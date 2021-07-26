// import { expect } from 'chai';
import Memoz from '../src/index';

describe.only('Functionality', () => {
  const memoz = new Memoz();

  it.only('should write in array', () => {
    let saved = memoz.write('name', 'milad');
    saved = memoz.write('name', 'milad');
    saved = memoz.write('name', 'milad');
    saved = memoz.write('name', 'milad');
    saved = memoz.write('name', 'milad');

    console.log(saved);
  });

  it.only('should update one from array', () => {
    const one = memoz.updateOne({ name: 'milad' }, { name: 'memo' });
    console.log(one);
  });
});
