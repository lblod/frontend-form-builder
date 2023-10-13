import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from './forking-store-helpers';
import { EMBER, FORM, SH } from './rdflib';
import { showErrorToasterMessage } from './toaster-message-helper';

export function getFieldsInStore(store, graph) {
  const possibleFieldSubjects = store
    .match(EMBER('source-node'), FORM('includes'), undefined, graph)
    .map((triple) => triple.object);

  if (possibleFieldSubjects.length == 0) {
    const errorMessage = `No fields found in form.`;
    showErrorToasterMessage(this.toaster, errorMessage);

    throw errorMessage;
  }

  const triplesPerField = [];

  for (const fieldSubject of possibleFieldSubjects) {
    const fieldTriples = getTriplesWithNodeAsSubject(
      fieldSubject,
      store,
      graph
    );

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

    let fieldName = 'Text field';
    const fieldNameTriple = fieldTriples.find(
      (triple) => triple.predicate.value == SH('name').value
    );
    if (fieldNameTriple) {
      fieldName = fieldNameTriple.object.value;
    }

    const tripleIsField = fieldTriples.find(
      (triple) => triple.object.value == FORM('Field').value
    );
    if (tripleIsField) {
      triplesPerField.push({
        subject: fieldSubject,
        name: fieldName,
        triples: fieldTriples,
      });
    }
  }

  return triplesPerField;
}
