import { RDF } from '@lblod/submission-form-helpers';

export function isRdfTypeInSubjects(subjects, store, graph) {
  for (const subject of subjects) {
    const typeMatches = store.match(subject, RDF('type'), undefined, graph);
    if (!typeMatches.length >= 1) {
      return false;
    }
  }

  return true;
}
