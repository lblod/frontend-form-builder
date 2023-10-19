import { FORM, RDF } from '../rdflib';

export function isExactValueAddedToExactValueConstraint(store, graph) {
  const exactValueConstraint = store.match(
    undefined,
    RDF('type'),
    FORM('ExactValueConstraint'),
    graph
  );
  for (const triple of exactValueConstraint) {
    const exactValueValues = store.match(
      triple.subject,
      FORM('customValue'),
      undefined,
      graph
    );
    if (!exactValueValues.length >= 1) {
      return false;
    }
  }

  return true;
}
