import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { EMBER } from '../rdflib';

const BASE_SUBJECTS = [EMBER('source-node').value];

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

function getAllUniqueSubjectsInStore(store) {
  const allSubjects = store
    .match(undefined, undefined, undefined, GRAPHS.sourceGraph)
    .map((triple) => triple.subject);

  return new Array(...new Set(allSubjects));
}

function isSubjectReferenced(subject, store) {
  if (BASE_SUBJECTS.includes(subject.value)) {
    return true;
  }

  return store.any(undefined, undefined, subject);
}
