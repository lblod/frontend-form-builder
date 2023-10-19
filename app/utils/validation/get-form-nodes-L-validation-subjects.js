import { EXT, FORM } from '../rdflib';

export function getFormNodesLValidationSubjects(store, graph) {
  return store.match(EXT('formNodesL'), FORM('validations'), undefined, graph);
}
