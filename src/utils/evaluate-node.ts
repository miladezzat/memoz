import { ConditionNode } from '../types';
import { evaluateCondition } from './evaluate-condition';

/**
 * A cache that maps a datum to a Map of condition nodes and their evaluation results.
 * The `WeakMap` ensures that the cache is memory-safe and automatically cleans up
 * when the datum is no longer in use.
 */
const memoCache = new WeakMap<object, Map<ConditionNode<any>, boolean>>();

/**
 * Evaluates a logical condition node against a given datum (data object) with memoization.
 *
 * This function supports both AND and OR logical operations:
 * - For AND (`$and`), all conditions must evaluate to true.
 * - For OR (`$or`), at least one condition must evaluate to true.
 * If the node is a simple condition, it will be evaluated directly.
 *
 * Memoization is applied to avoid redundant computations of the same condition for the same datum.
 *
 * @template T - The type of the data object being evaluated.
 * @param datum - The data object to evaluate against the condition node.
 * @param node - The condition node containing logical operations and/or conditions.
 * @returns A boolean indicating whether the condition node is satisfied by the datum.
 */
export const evaluateNode = <T extends object>(datum: T, node: ConditionNode<T>): boolean => {
  // Retrieve or initialize the cache for the current datum, ensuring type safety
  let datumCache: Map<ConditionNode<T>, boolean> | undefined = memoCache.get(datum);
  if (!datumCache) {
    datumCache = new Map<ConditionNode<T>, boolean>();
    memoCache.set(datum, datumCache);
  }

  // Check if the result is already cached for this condition node
  if (datumCache.has(node)) {
    return datumCache.get(node)!; // Use the cached result, safely asserting it exists
  }

  let result: boolean;

  // Evaluate the condition
  if ('$and' in node) {
    // AND logic: all conditions must pass
    result = node.$and.every((subNode) => evaluateNode(datum, subNode));
  } else if ('$or' in node) {
    // OR logic: at least one condition must pass
    result = node.$or.some((subNode) => evaluateNode(datum, subNode));
  } else {
    // Handle simple condition
    result = evaluateCondition(datum, node);
  }

  // Cache the result for the current node and datum
  datumCache.set(node, result);

  return result;
};

export default evaluateNode;
