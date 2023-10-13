import { FORM } from './rdflib';

export function getTriplesOfSubject(subject, store, graph) {
  return store.match(subject, undefined, undefined, graph);
}

export function getAllTriples(store, graph) {
  return store.match(undefined, undefined, undefined, graph);
}

export function getValidationSubjectsOnNode(node, store, graph) {
  return store
    .match(node, FORM('validations'), undefined, graph)
    .map((triple) => triple.object);
}
