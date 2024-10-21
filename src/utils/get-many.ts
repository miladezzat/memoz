import { ConditionNode } from '../types';
import { evaluateNode } from './evaluate-node';

/**
 * Filters the dataset to find all items that match the provided condition node.
 *
 * This function uses `evaluateNode` to efficiently evaluate each datum against
 * the condition node, leveraging memoization to avoid redundant computations.
 *
 * @template T - The type of the objects in the dataset.
 * @param {T[]} data - The dataset to filter.
 * @param {ConditionNode<T>} query - The query object containing nested AND/OR logic and conditions.
 * @returns {T[]} - Returns an array of matching items.
 */
export const getMany = <T extends object>(data: T[], query: ConditionNode<T>): T[] => data.filter((datum) => evaluateNode(datum, query));

export default getMany;
