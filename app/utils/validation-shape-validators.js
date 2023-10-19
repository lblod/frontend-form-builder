import { Statement } from 'rdflib';
import { FORM, RDF } from './rdflib';
import { defaultCountryCode } from '../components/rdf-form-fields/country-code-concept-scheme-selector';

export function areValidationsInGraphValidated(store, graph) {
  const validationNodes = getValidationNodesInGraph(store, graph);

  return ![
    isRdfTypeInTriplesOfSubjects(validationNodes, store, graph),
    isMaxCharacterValueAddedToMaxLengthValidation(store, graph),
    isExactValueAddedToExactValueConstraint(store, graph),
    isCountryCodeAddedToValidPhoneNumber(store, graph),
  ].includes(false);
}

function getValidationNodesInGraph(store, graph) {
  const subjectThatHaveValidations = store.match(
    undefined,
    FORM('validations'),
    undefined,
    graph
  );
  return subjectThatHaveValidations.map((statement) => statement.object);
}

function isRdfTypeInTriplesOfSubjects(subjects, store, graph) {
  for (const subject of subjects) {
    const typeMatches = store.match(subject, RDF('type'), undefined, graph);
    if (!typeMatches.length >= 1) {
      return false;
    }
  }

  return true;
}

function isMaxCharacterValueAddedToMaxLengthValidation(store, graph) {
  const maxLengthValidationSubjects = store.match(
    undefined,
    RDF('type'),
    FORM('MaxLength'),
    graph
  );
  for (const triple of maxLengthValidationSubjects) {
    const maxCharactersValues = store.match(
      triple.subject,
      FORM('max'),
      undefined,
      graph
    );
    if (!maxCharactersValues.length >= 1) {
      return false;
    }
  }

  return true;
}

function isExactValueAddedToExactValueConstraint(store, graph) {
  const exactValueConstraint = store.match(
    undefined,
    RDF('type'),
    FORM('ExactValueConstraint'),
    graph
  );
  for (const triple of exactValueConstraint) {
    const exactValueValues = store.match(
      triple.subject,
      FORM('customValue'),
      undefined,
      graph
    );
    if (!exactValueValues.length >= 1) {
      return false;
    }
  }

  return true;
}

function isCountryCodeAddedToValidPhoneNumber(store, graph) {
  const validPhoneNumber = store.match(
    undefined,
    RDF('type'),
    FORM('ValidPhoneNumber'),
    graph
  );
  for (const triple of validPhoneNumber) {
    const countryCodeValues = store.match(
      triple.subject,
      FORM('defaultCountry'),
      undefined,
      graph
    );

    if (!countryCodeValues.length >= 1) {
      insertDefaultCountryCode(triple.subject, store, graph);
    }
  }

  return true;
}

function insertDefaultCountryCode(subject, store, graph) {
  store.addAll([
    new Statement(
      subject,
      FORM('defaultCountry'),
      defaultCountryCode.label,
      graph
    ),
  ]);
}
