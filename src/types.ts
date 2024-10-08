export type ComparisonOperator = '$eq' | '$neq' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin' | 'custom';

export interface SimpleCondition<T> {
  field: keyof T;
  operator: ComparisonOperator;
  value: any;
  customCompare?: (a: any, b: any) => boolean;
}

export type ConditionNode<T> =
  | { $and: ConditionNode<T>[] }
  | { $or: ConditionNode<T>[] }
  | SimpleCondition<T>;
