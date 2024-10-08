import { SimpleCondition } from '../types';

export const evaluateCondition = <T>(datum: T, condition: SimpleCondition<T>): boolean => {
  const {
    field, operator, value, customCompare,
  } = condition;

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
    default:
      return false;
  }
};

export default evaluateCondition;
