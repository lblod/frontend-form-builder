import { FORM } from '@lblod/submission-form-helpers';

export function getGroupingTypeForValidation(validationType, store, graph) {
  const groupingType = store.any(
    validationType,
    FORM('grouping'),
    undefined,
    graph
  );

  if (!groupingType) {
    return FORM('Bag');
  }

  return groupingType;
}
