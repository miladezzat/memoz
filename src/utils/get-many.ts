/**
 * Filters an array of objects based on a query.
 *
 * @template T - The type of the objects in the data array.
 * @param {Partial<Record<keyof T, any>>} query - An object representing the criteria to filter the data.
 * The keys are properties of the objects in the `data` array, and the values are the values to match.
 * @param {T[]} data - An array of objects to be filtered. Each object in the array must be of type `T`.
 * @returns {T[]} An array of objects that match the query criteria.
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
 * const result = getMany(query, documents);
 * console.log(result); // Output: [{ id: '1', name: 'Alice', age: 30 }]
 */
export const getMany = <T>(query: Partial<Record<keyof T, any>>, data: T[]): T[] => Object.keys(query).reduce(
  (results, key) => results.filter((datum: T) => datum[key as keyof T] === query[key as keyof T]),
  data.slice(),
);

export default getMany;
