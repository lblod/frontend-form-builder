import { FORM, RDF, SH } from './rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';

export function isForkingStore(store) {
  return store instanceof ForkingStore;
}

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

export function getGroupingTypeOfNode(node, store, graph) {
  return store.any(node, FORM('grouping'), undefined, graph);
}

export function getFirstPathOfNode(node, store, graph) {
  return store.any(node, SH('path'), undefined, graph);
}
