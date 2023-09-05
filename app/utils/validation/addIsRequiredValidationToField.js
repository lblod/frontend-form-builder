import { FORM, NODES } from '../rdflib';
import { triple } from 'rdflib';

export function addIsRequiredValidationToField(
  fieldUri,
  validatioNodeId,
  builderStore,
  graph
) {
  // TODO add validations to check whether the validationode exists and the validation is not already added to this field
  const predicate = FORM('validations');
  const value = NODES(validatioNodeId);

  const validationTriple = triple(fieldUri, predicate, value, graph);

  const filtered = builderStore.graph.statements.filter((statement) => {
    return statement.subject.value == fieldUri.value;
  });

  builderStore.addAll([...filtered, validationTriple]);

  // Returning the builderStore here would make it dangerous because it is updated by reference. How should this be done?
}
