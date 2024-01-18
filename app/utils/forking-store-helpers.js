import { FORM, RDF, SH } from './rdflib';
import { SKOS } from '@lblod/submission-form-helpers';
import { ForkingStore } from '@lblod/ember-submission-form-fields';

export function isForkingStore(store) {
  return store instanceof ForkingStore;
}

export function getTriplesWithNodeAsSubject(node, store, graph) {
  return store.match(node, undefined, undefined, graph);
}

function getNodeValidationTriples(node, store, graph) {
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
  const type = store.any(node, RDF('type'), undefined, graph);

  if (!type) {
    console.error(`Could not find RDF type for node`, node);
  }

  return type;
}

export function getGroupingTypeOfNode(node, store, graph) {
  return store.any(node, FORM('grouping'), undefined, graph);
}

export function getFirstPathOfNode(node, store, graph) {
  return store.any(node, SH('path'), undefined, graph);
}

export function getPrefLabelOfNode(node, store, graph) {
  return store.any(node, SKOS('prefLabel'), undefined, graph);
}

export function getNameOfNode(node, store, graph) {
  const name = store.any(node, SH('name'), undefined, graph);
  if (!name) {
    console.error(`Could not get 'name' of node ${node.value}`);
    return null;
  }

  return name;
}

export function getOrderOfNode(node, store, graph) {
  const order = store.any(node, SH('order'), undefined, graph);
  if (!order) {
    console.error(`Could not get 'order' of node ${node.value}`);
  }

  return Number(order);
}

export function getConceptSchemeUriFromNodeOption(node, store, graph) {
  const option = store.any(node, FORM('options'), undefined, graph);

  if (!option) {
    console.error(`Could not get form:options of node ${node.value ?? ''}`);
    return option;
  }

  return JSON.parse(option.value).conceptScheme ?? null;
}

export function getMinimalNodeInfo(node, store, graph) {
  return {
    subject: node,
    name: getNameOfNode(node, store, graph),
    order: getOrderOfNode(node, store, graph),
    displayType: getDisplayTypeOfNode(node, store, graph),
  };
}
