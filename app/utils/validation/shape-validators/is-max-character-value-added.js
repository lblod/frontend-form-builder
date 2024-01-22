import { FORM, RDF } from '@lblod/submission-form-helpers';

export function isMaxCharacterValueAddedToMaxLengthValidation(store, graph) {
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
