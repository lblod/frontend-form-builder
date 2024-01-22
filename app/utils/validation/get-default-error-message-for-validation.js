import { SH } from '../rdflib';

export function getDefaultErrorMessageForValidation(
  validationType,
  store,
  graph
) {
  const errorMessage = store.any(
    validationType,
    SH('resultMessage'),
    undefined,
    graph
  );

  return errorMessage;
}
