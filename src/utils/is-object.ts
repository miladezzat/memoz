/**
 * Checks if the provided value is a non-null object with at least one own property (excluding arrays).
 *
 * @param {unknown} value - The value to be checked.
 * @returns {boolean} `true` if the value is a non-null object with at least one property; otherwise, `false`.
 *
 * @example
 * console.log(isObject({})); // Output: false
 * console.log(isObject({ key: 'value' })); // Output: true
 * console.log(isObject(null)); // Output: false
 * console.log(isObject([])); // Output: false
 */
export const isObject = (value: unknown): boolean => typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && Reflect.ownKeys(value).length > 0;

export default isObject;
