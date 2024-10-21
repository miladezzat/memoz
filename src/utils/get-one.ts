import { ConditionNode } from '../types';
import { evaluateNode } from './evaluate-node';

/**
 * Finds the first item in the dataset that matches the provided condition node.
 *
 * This function uses `evaluateNode` to efficiently evaluate each datum against
 * the condition node, stopping as soon as a match is found to improve performance.
 *
 * @template T - The type of the objects in the dataset.
 * @param {T[]} data - The dataset to search through.
 * @param {ConditionNode<T>} query - The query object containing nested AND/OR logic and conditions.
 * @returns {T | undefined} - Returns the first matching item, or undefined if no match is found.
 */
export const getOne = <T extends object>(data: T[], query: ConditionNode<T>): T | undefined => data.find((datum) => evaluateNode(datum, query));

export default getOne;
