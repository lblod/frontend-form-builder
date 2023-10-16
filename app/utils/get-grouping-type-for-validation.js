import { isLiteral } from 'rdflib';
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
    return FORM('Bag');
  }

  return getNamedNodeGroupingType(groupingType);
}

function getNamedNodeGroupingType(groupingType) {
  if (isLiteral(groupingType)) {
    return FORM(groupingType.value);
  }

  return groupingType;
}
