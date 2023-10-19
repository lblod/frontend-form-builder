import { Statement } from 'rdflib';
import { FORM } from './rdflib';
import { defaultCountryCode } from '../components/rdf-form-fields/country-code-concept-scheme-selector';
import { isMaxCharacterValueAddedToMaxLengthValidation } from './validation-shape-validators/is-max-character-value-added';
import { isDefaultCountryCodeAddedToValidPhoneNumber } from './validation-shape-validators/is-country-code-added';
import { isExactValueAddedToExactValueConstraint } from './validation-shape-validators/is-exact-value-added';
import { isRdfTypeInSubjects } from './validation-shape-validators/is-rdf-type-in-subjects';

export function areValidationsInGraphValidated(store, graph) {
  const validationNodes = getAllValidationNodesInGraph(store, graph);
  const defaultCountryCodesAdded = isDefaultCountryCodeAddedToValidPhoneNumber(
    store,
    graph
  );
  if (!defaultCountryCodesAdded.isAdded) {
    const defaultCountryCodeStatements =
      defaultCountryCodesAdded.subjectsToAddDefaultTo.map((subject) => {
        return createDefaultCountryCodeStatement(subject, graph);
      });
    store.addAll(defaultCountryCodeStatements);
  }

  return ![
    isRdfTypeInSubjects(validationNodes, store, graph),
    isMaxCharacterValueAddedToMaxLengthValidation(store, graph),
    isExactValueAddedToExactValueConstraint(store, graph),
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

function createDefaultCountryCodeStatement(subject, graph) {
  return new Statement(
    subject,
    FORM('defaultCountry'),
    defaultCountryCode.label,
    graph
  );
}
