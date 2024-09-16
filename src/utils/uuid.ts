/* eslint-disable no-mixed-operators */
/**
 * Generates a UUID string based on a template and current timestamp.
 *
 * @returns {string} A UUID string.
 *
 * @example
 * console.log(uuid()); // Output: A UUID string like "b4d4b7c9-4b2c-4d43-b7f8-3d9f1bba8e14-5r4t7q"
 */
export function uuid(): string {
  return `${'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  }-${Date.now().toString(32)}`;
}

export default uuid;
