import uuidConstants from '../constants/uuid';

/**
 * Checks if the provided UUID is valid based on its length and format.
 *
 * @param {string} uuid - The UUID string to be validated.
 * @returns {boolean} `true` if the UUID is valid; otherwise, `false`.
 *
 * @example
 * console.log(isValidUUId('123e4567-e89b-12d3-a456-426614174000')); // Output: true
 * console.log(isValidUUId('invalid-uuid')); // Output: false
 */
export const isValidUUId = (uuid: string): boolean => uuid.length === 46
  && uuidConstants.UUID_PATTERN.test(uuid);

export default isValidUUId;
