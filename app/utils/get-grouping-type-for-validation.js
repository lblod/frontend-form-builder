import { FORM } from './rdflib';

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
