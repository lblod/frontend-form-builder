import { triple } from 'rdflib';
import { FORM, RDF } from '../rdflib';
import { removeAllValidationsFromField } from './removeAllValidationsFromField';

export function addValidationsToField(
  fieldUri,
  validationSubjects,
  validationTriples,
  builderStore,
  graph
) {
  // TODO add validations to check whether the validationode exists and the validation is not already added to this field

  removeAllValidationsFromField(fieldUri, builderStore, graph);

  const predicate = FORM('validations');
  const validationBlankNodes = [];

  for (const validationSubject of validationSubjects) {
    const validationTriple = triple(
      fieldUri,
      predicate,
      validationSubject,
      graph
    );
    validationBlankNodes.push(validationTriple);
  }

  const statementsRelatedToField = getAllStatementsForSubject(fieldUri, {
    store: builderStore,
  });

  builderStore.addAll([
    ...statementsRelatedToField,
    ...validationBlankNodes,
    ...validationTriples,
  ]);
}

function getAllStatementsForSubject(subject, options) {
  return options.store.graph.statements.filter((statement) => {
    return statement.subject.value == subject.value;
  });
}
