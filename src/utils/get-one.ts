/**
 * Retrieves the first object from an array that matches the query criteria.
 *
 * @template T - The type of the objects in the data array.
 * @param {Partial<Record<keyof T, any>>} query - An object representing the criteria to match against the data.
 * The keys are properties of the objects in the `data` array, and the values are the values to match.
 * @param {T[]} data - An array of objects to be searched. Each object in the array must be of type `T`.
 * @returns {T | undefined} The first object that matches the query criteria, or `undefined` if no match is found.
 *
 * @example
 * interface Document {
 *   id: string;
 *   name: string;
 *   age?: number;
 * }
 *
 * const documents: Document[] = [
 *   { id: '1', name: 'Alice', age: 30 },
 *   { id: '2', name: 'Bob', age: 25 },
 * ];
 *
 * const query: Partial<Document> = { name: 'Alice' };
 *
 * const result = getOne(query, documents);
 * console.log(result); // Output: { id: '1', name: 'Alice', age: 30 }
 */
export const getOne = <T>(query: Partial<Record<keyof T, any>>, data: T[]): T | undefined => Object.keys(query).reduce(
  (results, key) => results.filter((datum: T) => datum[key as keyof T] === query[key as keyof T]),
  data.slice(),
)[0];

export default getOne;
