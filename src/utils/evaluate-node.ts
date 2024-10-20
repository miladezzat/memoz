import { ConditionNode } from '../types';
import { evaluateCondition } from './evaluate-condition';

/**
 * Evaluates a logical condition node against a given datum (data object).
 *
 * This function supports both AND and OR logical operations:
 * - For AND (`$and`), all conditions must evaluate to true.
 * - For OR (`$or`), at least one condition must evaluate to true.
 * If the node is a simple condition, it will be evaluated directly.
 *
 * @template T - The type of the data object being evaluated.
 * @param datum - The data object to evaluate against the condition node.
 * @param node - The condition node containing logical operations and/or conditions.
 * @returns A boolean indicating whether the condition node is satisfied by the datum.
 */
export const evaluateNode = <T>(datum: T, node: ConditionNode<T>): boolean => {
  if ('$and' in node) {
    // AND logic: all conditions must pass
    return node.$and.every((subNode) => evaluateNode(datum, subNode));
  }
  if ('$or' in node) {
    // OR logic: at least one condition must pass
    return node.$or.some((subNode) => evaluateNode(datum, subNode));
  }
  // Handle simple condition
  return evaluateCondition(datum, node);
};

export default evaluateNode;
