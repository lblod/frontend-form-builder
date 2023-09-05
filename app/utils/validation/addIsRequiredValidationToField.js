import { FORM, NODES } from '../rdflib';
import { triple } from 'rdflib';

export function addIsRequiredValidationToField(
  fieldUri,
  validatioNodeIds,
  builderStore,
  graph
) {
  // TODO add validations to check whether the validationode exists and the validation is not already added to this field
  const validationTriples = [];
  const predicate = FORM('validations');

  for (const validationNodeId of validatioNodeIds) {
    const validationTriple = triple(
      fieldUri,
      predicate,
      NODES(validationNodeId),
      graph
    );

    validationTriples.push(validationTriple);
  }

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
