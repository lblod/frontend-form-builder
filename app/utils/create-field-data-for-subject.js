import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from './forking-store-helpers';
import { FORM, SH } from './rdflib';

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

  const tripleIsField = fieldTriples.find(
    (triple) => triple.object.value == FORM('Field').value
  );

  if (!tripleIsField) {
    return null;
  }

  return {
    subject: fieldSubject,
    name: fieldName,
    triples: fieldTriples,
  };
}
