import { SKOS, FORM, RDF, SHACL } from '@lblod/submission-form-helpers';

export function getTriplesWithNodeAsSubject(node, store, graph) {
  return store.match(node, undefined, undefined, graph);
}

export function getValidationSubjectsOnNode(node, store, graph) {
  const nodeValidationTriples = store.match(
    node,
    FORM('validations'),
    undefined,
    graph
  );
  return nodeValidationTriples.map((triple) => triple.object);
}

export function getRdfTypeOfNode(node, store, graph) {
  const type = store.any(node, RDF('type'), undefined, graph);

  if (!type) {
    console.error(`Could not find RDF type for node`, node);
  }

  return type;
}

export function getPrefLabelOfNode(node, store, graph) {
  return store.any(node, SKOS('prefLabel'), undefined, graph);
}

export function getMinimalNodeInfo(node, store, graph) {
  const nodeDisplayType = store.any(
    node,
    FORM('displayType'),
    undefined,
    graph
  );

  const nodeName = store.any(node, SHACL('name'), undefined, graph);
  let nodeOrder = store.any(node, SHACL('order'), undefined, graph);

  if (!nodeOrder) {
    nodeOrder = 0;
  }

  return {
    subject: node,
    name: nodeName,
    order: Number(nodeOrder),
    displayType: nodeDisplayType,
  };
}
