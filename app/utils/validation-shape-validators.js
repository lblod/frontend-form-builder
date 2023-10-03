import { Statement } from 'rdflib';
import { FORM, RDF } from './rdflib';

export function areValidationsInGraphValidated(store, graph) {
  const validationNodes = getValidationNodesInGraph(store, graph);

  return (
    isRdfTypeInTriplesOfSubjects(validationNodes, store, graph) &&
    isMaxCharacterValueAddedToMaxLengthValidation(store, graph)
  );
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
