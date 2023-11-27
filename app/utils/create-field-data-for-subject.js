import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from './forking-store-helpers';
import { SH } from './rdflib';

export function createFieldDataForSubject(fieldSubject, { store, graph }) {
  const fieldTriples = getTriplesWithNodeAsSubject(fieldSubject, store, graph);

  const fieldValidationSubjects = getValidationSubjectsOnNode(
    fieldSubject,
    store,
    graph
  );
  for (const subject of fieldValidationSubjects) {
    const validationTriples = getTriplesWithNodeAsSubject(
      subject,
      store,
      graph
    );

    fieldTriples.push(...validationTriples);
  }

  let fieldName = 'Field name';
  const fieldNameTriple = fieldTriples.find(
    (triple) => triple.predicate.value == SH('name').value
  );
  if (fieldNameTriple) {
    fieldName = fieldNameTriple.object.value;
  }

  return {
    subject: fieldSubject,
    name: fieldName,
    triples: fieldTriples,
  };
}
