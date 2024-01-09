import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { Namespace } from 'rdflib';

const BASE_SUBJECTS = [
  new Namespace('http://ember-submission-form-fields/')('source-node').value,
];

export function getTtlWithUnReferencedSubjectsRemoved(ttlCode, toaster) {
  const store = new ForkingStore();
  store.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

  const unreferenced = [];
  for (const subject of getAllUniqueSubjectsInStore(store)) {
    if (isSubjectReferenced(subject, store)) {
      continue;
    }
    unreferenced.push(subject.value);
    toaster.warning(
      `Subject is not referenced: ${subject.value ?? undefined}`,
      'Error',
      {
        timeOut: 5000,
      }
    );
  }
  if (unreferenced.length !== 0) {
    console.warn(
      `These subjects are unreferenced in the ttlcode`,
      unreferenced
    );
  }

  return ttlCode;
}

export function getAllUniqueSubjectsInStore(store) {
  const allSubjects = store
    .match(undefined, undefined, undefined, GRAPHS.sourceGraph)
    .map((triple) => triple.subject);

  return new Array(...new Set(allSubjects));
}

export function isSubjectReferenced(subject, store) {
  if (BASE_SUBJECTS.includes(subject.value)) {
    return true;
  }

  if (store.any(undefined, undefined, subject)) {
    return true;
  }

  return false;
}
