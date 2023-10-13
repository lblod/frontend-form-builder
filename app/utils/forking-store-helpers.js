import { FORM, RDF } from './rdflib';

export function getTriplesWithNodeAsSubject(node, store, graph) {
  return store.match(node, undefined, undefined, graph);
}

export function getTriplesWithNodeAsObject(node, store, graph) {
  return store.match(undefined, undefined, node, graph);
}

export function getAllTriples(store, graph) {
  return store.match(undefined, undefined, undefined, graph);
}

export function getNodeValidationTriples(node, store, graph) {
  return store.match(node, FORM('validations'), undefined, graph);
}

export function getValidationSubjectsOnNode(node, store, graph) {
  return getNodeValidationTriples(node, store, graph).map(
    (triple) => triple.object
  );
}

export function getDisplayTypeOfNode(node, store, graph) {
  return store.any(node, FORM('displayType'), undefined, graph);
}

export function getRdfTypeOfNode(node, store, graph) {
  return store.any(node, RDF('type'), undefined, graph);
}
