import { SHACL } from '@lblod/submission-form-helpers';

export function getDefaultErrorMessageForValidation(
  validationType,
  store,
  graph
) {
  const errorMessage = store.any(
    validationType,
    SHACL('resultMessage'),
    undefined,
    graph
  );

  return errorMessage;
}
