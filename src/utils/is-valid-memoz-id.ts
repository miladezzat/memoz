import { MEMOZ_ID_PATTERN } from '../constants/memoz-id';
import { MEMOZID } from './memoz-id';

/**
 *
 * @param {string} memozId - The MEMOZID string to be validated.
 * @returns {boolean} `true` if the MEMOZID is valid; otherwise, `false`.
 *
 * @example
 * console.log(isValidMemozId('123e4567-e89b-12d3-a456-426614174000')); // Output: true
 * console.log(isValidMemozId('invalid-memozId')); // Output: false
 */
export const isValidMemozId = (memozId: string): memozId is MEMOZID => memozId.length >= 36 && MEMOZ_ID_PATTERN.test(memozId);

export default isValidMemozId;
