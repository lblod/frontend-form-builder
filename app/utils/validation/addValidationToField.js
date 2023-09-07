import { FORM, NODES } from '../rdflib';
import { triple } from 'rdflib';

export function addValidationToField(
  fieldUri,
  validationTriples,
  builderStore,
  graph
) {
  // TODO add validations to check whether the validationode exists and the validation is not already added to this field
  const predicate = FORM('validations');
  const validationTriple = triple(
    fieldUri,
    predicate,
    validationTriples[0].subject,
    graph
  );

  const statementsRelatedToField = builderStore.graph.statements.filter(
    (statement) => {
      return statement.subject.value == fieldUri.value;
    }
  );
  const statementsOtherThanTheField = builderStore.graph.statements.filter(
    (statement) => {
      return statement.subject.value != fieldUri.value;
    }
  );

  builderStore.graph.statements = [];

  builderStore.addAll([
    ...statementsRelatedToField,
    ...statementsOtherThanTheField,
    validationTriple,
    ...validationTriples,
  ]);

  // Returning the builderStore here would make it dangerous because it is updated by reference. How should this be done?
}
