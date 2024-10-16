export type ComparisonOperator = '$eq' | '$neq' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin' | 'custom';
export type MEMOZID = string & { __brand__: 'MEMOZID' }; // You can enhance this with more strict MEMOZID typing if desired

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

export type DocumentWithId<T> = T & { id: MEMOZID; } & { [key: string]: any; };
export type UpdateManyResult<T> = { updated: boolean; n: number; documents: DocumentWithId<T>[] };

export interface MemozOptions {
    storagePath?: string;
    persistToDisk?: boolean;
}
