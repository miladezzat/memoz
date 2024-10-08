import { MEMOZ_ID_TEMPLATE } from '../constants/memoz-id';
import { isValidMemozId } from './is-valid-memoz-id';

export type MEMOZID = string & { __brand__: 'MEMOZID' }; // You can enhance this with more strict MEMOZID typing if desired

/**
 * Generates a MEMOZID string based on a template and current timestamp.
 *
 * @returns {String}
 */
export function memozId(): MEMOZID {
  const generatedMemozId = MEMOZ_ID_TEMPLATE.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16); // Generate a random number between 0 and 15
    const value = char === 'x' ? random : (random % 4) + 8; // For 'y', ensure the range is [8-11]
    return value.toString(16);
  });

  // Append the current timestamp as a base-32 string
  const timestamp = Date.now().toString(32);

  const id = `${generatedMemozId}-${timestamp}`;

  if (!isValidMemozId(id)) {
    throw new Error('Generated MEMOZID is not valid');
  }

  return id;
}

export default memozId;
