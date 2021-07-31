/**
 *
 * @param doc this is an javascript object
 * @returns {Boolean}
 *
 * @description this check if doc is an object or not
 */
const isObject = (doc:any):boolean => typeof doc === 'object' && doc !== null && Object.keys(doc).length > 0;

export default isObject;
