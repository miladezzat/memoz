/**
 * Defines comparison operators for query conditions.
 * Supported operators include equality, inequality,
 * greater than, greater than or equal to, less than,
 * less than or equal to, inclusion in a set,
 * exclusion from a set, custom comparisons, and regex matching.
 */
export type ComparisonOperator =
  | '$eq'
  | '$neq'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$in'
  | '$nin'
  | 'custom'
  | '$regex';

/**
 * Represents a unique identifier for a MEMOZ object.
 * This type can be enhanced with stricter typing rules if desired.
 */
export type MEMOZID = string & { __brand__: 'MEMOZID' };

/**
 * Defines valid regex options for regex operations.
 * Supported options include:
 * - 'i': Case-insensitive matching
 * - 'g': Global search
 * - 'm': Multiline mode
 * - 's': Dot all (dot matches newline)
 * - 'u': Unicode matching
 * - 'y': Sticky matching
 */
export type RegexOptions = 'i' | 'g' | 'm' | 's' | 'u' | 'y';

/**
 * Represents a condition using a regular expression.
 * The condition includes a regex pattern and optional flags.
 */
export type RegexCondition = {
  /**
   * The regex pattern, which can be a string or a RegExp object.
   */
  $regex: string | RegExp;

  /**
   * Optional regex options to modify the regex behavior.
   */
  $options?: RegexOptions;
};

/**
 * Defines the valid types that can be used as values in conditions.
 * This includes primitive types, arrays, objects, and RegexCondition.
 */
export type ValueTypes = string | number | boolean | Date | any[] | object | RegexCondition | Record<string, any>;

/**
 * Represents a simple condition for filtering data.
 * It includes a field, an operator, a value, and an optional custom comparison function.
 */
export interface SimpleCondition<T> {
  /**
   * The field in the object to evaluate.
   */
  field: keyof T;

  /**
   * The operator used for the comparison.
   */
  operator: ComparisonOperator;

  /**
   * The value to compare against the field.
   */
  value: ValueTypes;

  /**
   * An optional custom comparison function for more complex comparisons.
   * Takes two arguments and returns a boolean.
   */
  customCompare?: (a: any, b: any) => boolean;
}

/**
 * Defines a node structure for logical conditions.
 * Nodes can be composed of AND/OR logic or simple conditions.
 */
export type ConditionNode<T> =
  | { $and: ConditionNode<T>[] } // All conditions must be true.
  | { $or: ConditionNode<T>[] } // At least one condition must be true.
  | SimpleCondition<T>; // A simple condition.

/**
 * Represents a document with an associated unique identifier.
 * The document type is extended with an id of type MEMOZID and can include additional properties.
 */
export type DocumentWithId<T> = T & { id: MEMOZID; } & { [key: string]: any; };

/**
 * Represents the result of an update operation affecting multiple documents.
 * It includes a success flag, the number of documents updated, and the documents themselves.
 */
export type UpdateManyResult<T> = {
  updated: boolean; // Indicates if the update was successful.
  n: number; // The number of documents updated.
  documents: DocumentWithId<T>[]; // The updated documents.
};

/**
 * Options for configuring the Memoz storage and behavior.
 */
export interface MemozOptions {
  /**
   * Optional path for storing data on disk.
   */
  storagePath?: string;

  /**
   * Flag indicating if data should persist to disk.
   */
  persistToDisk?: boolean;

  /**
   * Flag indicating if mutex should be used for concurrent access.
   */
  useMutex?: boolean;
}
