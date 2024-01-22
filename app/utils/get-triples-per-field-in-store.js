import { createFieldDataForSubject } from './create-field-data-for-subject';
import { FORM, RDF } from '@lblod/submission-form-helpers';

export function getFieldsInStore(store, graph) {
  const possibleFieldSubjects = store
    .match(undefined, RDF('type'), FORM('Field'), graph)
    .map((triple) => triple.subject);

  if (possibleFieldSubjects.length == 0) {
    const errorMessage = `Geen velden gevonden in het formulier`;

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
