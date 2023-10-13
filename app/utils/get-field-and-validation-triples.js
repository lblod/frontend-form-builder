import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from './forking-store-helpers';

export function getFieldAndValidationTriples(fieldSubject, store, graph) {
  const triples = [];
  const fieldTriples = getTriplesWithNodeAsSubject(fieldSubject, store, graph);

  triples.push(...fieldTriples);
  const fieldValidationSubjects = getValidationSubjectsOnNode(
    fieldSubject,
    store,
    graph
  );
  for (const validationSubject of fieldValidationSubjects) {
    const validationTriples = getTriplesWithNodeAsSubject(
      validationSubject,
      store,
      graph
    );
    triples.push(...validationTriples);
  }

  return triples;
}
