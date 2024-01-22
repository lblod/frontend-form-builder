import { FORM } from '@lblod/submission-form-helpers';
import { isMaxCharacterValueAddedToMaxLengthValidation } from './shape-validators/is-max-character-value-added';
import { isDefaultCountryCodeAddedToValidPhoneNumber } from './shape-validators/is-country-code-added';
import { isExactValueAddedToExactValueConstraint } from './shape-validators/is-exact-value-added';
import { isRdfTypeInSubjects } from './shape-validators/is-rdf-type-in-subjects';

export function areValidationsInGraphValidated(store, graph) {
  const validationNodes = getAllValidationNodesInGraph(store, graph);

  return ![
    isRdfTypeInSubjects(validationNodes, store, graph),
    isMaxCharacterValueAddedToMaxLengthValidation(store, graph),
    isExactValueAddedToExactValueConstraint(store, graph),
    isDefaultCountryCodeAddedToValidPhoneNumber(store, graph),
  ].includes(false);
}

function getAllValidationNodesInGraph(store, graph) {
  const subjectThatHaveValidations = store.match(
    undefined,
    FORM('validations'),
    undefined,
    graph
  );
  return subjectThatHaveValidations.map((statement) => statement.object);
}
