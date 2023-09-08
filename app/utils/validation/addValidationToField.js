import { removeAllValidationsFromField } from './removeAllValidationsFromField';

export function addValidationToField(
  fieldUri,
  validationSubjects,
  validationTriples,
  builderStore,
  graph
) {
  removeAllValidationsFromField(fieldUri, builderStore, graph);
}
