import uuidConstants from '../constants/uuid';

/**
 *
 * @param uuid
 * @returns {Boolean}
 */
const isValidUUId = (uuid:string):boolean => uuid.length === 46 && uuidConstants.UUID_PATTERN.test(uuid);

export default isValidUUId;
