import { ConditionNode } from '../types';
import { evaluateNode } from './evaluate-node';

/**
 * Precompile conditions to reduce repeated logic checks and handle early exits more effectively.
 *
 * @template T - The type of the objects in the data array.
 * @param {T[]} data - The dataset.
 * @param {ConditionNode<T>} query - The query object containing nested AND/OR logic and conditions.
 * @returns {T[]} - Returns an array of matching items.
 */
export const getMany = <T>(data: T[], query: ConditionNode<T>): T[] => data.filter((datum) => evaluateNode(datum, query));

export default getMany;
