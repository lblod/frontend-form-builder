import { Literal } from 'rdflib';
import { FORM } from './rdflib';

export function getGroupingTypeLiteralForValidation(
  validationType,
  store,
  graph
) {
  const groupingType = store.any(
    validationType,
    FORM('grouping'),
    undefined,
    graph
  );

  if (!groupingType) {
    return new Literal('Bag', 'en');
  }

  return groupingType;
}
