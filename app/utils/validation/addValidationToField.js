import { FORM, NODES } from '../rdflib';
import { triple } from 'rdflib';

export function addValidationToField(
  fieldUri,
  validationBlankNodes,
  builderStore,
  graph
) {
  // TODO add validations to check whether the validationode exists and the validation is not already added to this field
  const validationTriples = [];
  const predicate = FORM('validations');

  const validationTriple = triple(
    fieldUri,
    predicate,
    validationBlankNodes[0].subject,
    graph
  );
  validationTriples.push(...validationBlankNodes);
  validationTriples.push(validationTriple);

  const statementsRelatedToField = builderStore.graph.statements.filter(
    (statement) => {
      return statement.subject.value == fieldUri.value;
    }
  );
  const statementsOtherThantheField = builderStore.graph.statements.filter(
    (statement) => {
      return statement.subject.value != fieldUri.value;
    }
  );

  builderStore.graph.statements = [];

  builderStore.addAll([
    ...statementsRelatedToField,
    ...statementsOtherThantheField,
    ...validationTriples,
  ]);

  // Returning the builderStore here would make it dangerous because it is updated by reference. How should this be done?
}
