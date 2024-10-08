import { ConditionNode } from '../types';
import { evaluateCondition } from './evaluate-condition';

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
