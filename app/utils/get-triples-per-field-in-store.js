import { createFieldDataForSubject } from './create-field-data-for-subject';
import { EMBER, FORM } from './rdflib';
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
    const fieldData = createFieldDataForSubject(fieldSubject, {
      store: store,
      graph: graph,
    });

    if (fieldData) {
      triplesPerField.push(fieldData);
    }
  }

  return triplesPerField;
}
