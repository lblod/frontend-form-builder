import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from './forking-store-helpers';
import { SHACL } from '@lblod/submission-form-helpers';

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

  let fieldName = 'Veldnaam';
  const fieldNameTriple = fieldTriples.find(
    (triple) => triple.predicate.value == SHACL('name').value
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
