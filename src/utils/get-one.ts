import { ConditionNode } from '../types';
import { evaluateNode } from './evaluate-node';

/**
 * Precompile conditions to reduce repeated logic checks and handle early exits more effectively.
 *
 * @template T - The type of the objects in the data array.
 * @param {T[]} data - The dataset.
 * @param {ConditionNode<T>} query - The query object containing nested AND/OR logic and conditions.
 * @returns {T | undefined} - Returns the first matching item or undefined.
 */
export const getOne = <T>(data: T[], query: ConditionNode<T>): T | undefined => data.find((datum) => evaluateNode(datum, query));

export default getOne;
