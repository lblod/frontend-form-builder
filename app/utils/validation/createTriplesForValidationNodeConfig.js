import { BlankNode, triple } from 'rdflib';
import { ValidationNodeConfig } from './validationNodeConfig';

export function createTriplesForValidationNodeConfig(
  validationNodeConfig,
  graph
) {
  if (!validationNodeConfig instanceof ValidationNodeConfig) {
    throw `The node config is not instance of 'ValidationNodeConfig'`;
  }

  const triples = [];
  const subject = new BlankNode();
  for (const predicateWithValue of validationNodeConfig.getPredicateValueArray()) {
    const newTriple = triple(
      subject,
      predicateWithValue.predicate,
      predicateWithValue.value,
      graph
    );

    triples.push(newTriple);
  }

  return triples;
}
