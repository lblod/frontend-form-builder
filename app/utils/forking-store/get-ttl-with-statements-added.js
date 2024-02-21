import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { getTtlInStore } from './get-ttl-in-store';
import { isStatement } from 'rdflib';

export function getTtlWithAddedStatements(currentTtl, statementsToAdd) {
  if (!statementsToAdd.every((st) => isStatement(st))) {
    throw 'Given statements are not instance of Statement. use new Statement() from rdflib';
  }

  const store = new ForkingStore();
  store.parse(currentTtl, GRAPHS.sourceGraph, 'text/turtle');

  store.addAll(statementsToAdd);

  return getTtlInStore(store);
}
