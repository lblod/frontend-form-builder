import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';

export function getTtlInStore(forkingStore) {
  if (!(forkingStore instanceof ForkingStore)) {
    throw `Store is not a ForkingStore. Function getTtlInStore()`;
  }

  return forkingStore.serializeDataMergedGraph(GRAPHS.sourceGraph);
}
