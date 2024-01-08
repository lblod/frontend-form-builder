import { ForkingStoreHelper } from './forking-store-helper';

export function getFieldAndValidationTriples(fieldSubject, store, graph) {
  const triples = [];
  const fieldTriples = ForkingStoreHelper.getTriplesWithNodeAsSubject(
    fieldSubject,
    store,
    graph
  );

  triples.push(...fieldTriples);
  const fieldValidationSubjects =
    ForkingStoreHelper.getValidationSubjectsOnNode(fieldSubject, store, graph);
  for (const validationSubject of fieldValidationSubjects) {
    const validationTriples = ForkingStoreHelper.getTriplesWithNodeAsSubject(
      validationSubject,
      store,
      graph
    );
    triples.push(...validationTriples);
  }

  return triples;
}
