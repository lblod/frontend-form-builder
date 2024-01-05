import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { EMBER, FORM, SH } from '../rdflib';

///////////////////////
// I don't like this //
///////////////////////
const POSSIBLE_REFERENCES = [
  FORM('hasField'),
  FORM('hasFieldGroup'),
  FORM('hasConditionalFieldGroup'),
  FORM('scope'),
  FORM('includes'),
  FORM('prototype'),
  SH('group'),
];

const BASE_SUBJECTS = [EMBER('source-node')];

export function getTtlWithUnReferencedSubjectsRemoved(ttlCode) {
  const store = new ForkingStore();
  store.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

  return ttlCode;
}
