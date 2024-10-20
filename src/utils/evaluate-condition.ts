import { SimpleCondition, RegexCondition } from '../types';

/**
 * Evaluates a condition against a given datum (data object).
 *
 * This function supports various comparison operators including equality,
 * inequality, greater than, less than, inclusion/exclusion in a set,
 * and regular expression matching.
 *
 * @template T - The type of the data object being evaluated.
 * @param datum - The data object to evaluate the condition against.
 * @param condition - The condition to evaluate, which must be of type SimpleCondition<T>.
 * @returns A boolean indicating whether the condition is satisfied for the given datum.
 */
export const evaluateCondition = <T>(datum: T, condition: SimpleCondition<T>): boolean => {
  const {
    field,
    operator,
    value,
    customCompare,
  } = condition;

  // If a custom comparison function is provided, use it.
  if (customCompare) {
    return customCompare(datum[field], value);
  }

  switch (operator) {
    case '$eq':
      return datum[field] === value;
    case '$neq':
      return datum[field] !== value;
    case '$gt':
      return datum[field] > value;
    case '$gte':
      return datum[field] >= value;
    case '$lt':
      return datum[field] < value;
    case '$lte':
      return datum[field] <= value;
    case '$in':
      return Array.isArray(value) && value.includes(datum[field]);
    case '$nin':
      return Array.isArray(value) && !value.includes(datum[field]);

    case '$regex': {
      if (value && typeof value === 'object' && ('$regex' in value)) {
        const regexCondition = value as RegexCondition; // Cast value to RegexCondition
        const regex = regexCondition.$regex instanceof RegExp
          ? regexCondition.$regex
          : new RegExp(regexCondition.$regex, regexCondition.$options || ''); // Apply options if $regex is a string

        // Check if the field is a string before testing
        const fieldValue = datum[field];
        return typeof fieldValue === 'string' ? regex.test(fieldValue) : false;
      }
      return false; // Invalid regex condition
    }

    default:
      return false; // Unsupported operator
  }
};

export default evaluateCondition;
