import { FORM, RDF, SH } from './rdflib';
import { SKOS } from '@lblod/submission-form-helpers';

export const ForkingStoreHelper = {
  getTriplesWithNodeAsSubject: (node, store, graph) => {
    return store.match(node, undefined, undefined, graph);
  },
  getValidationSubjectsOnNode: (node, store, graph) => {
    return store
      .match(node, FORM('validations'), undefined, graph)
      .map((triple) => triple.object);
  },
  getDisplayTypeOfNode: (node, store, graph) => {
    return store.any(node, FORM('displayType'), undefined, graph);
  },
  getRdfTypeOfNode: (node, store, graph) => {
    return store.any(node, RDF('type'), undefined, graph);
  },
  getGroupingTypeOfNode: (node, store, graph) => {
    return store.any(node, FORM('grouping'), undefined, graph);
  },
  getFirstPathOfNode: (node, store, graph) => {
    return store.any(node, SH('path'), undefined, graph);
  },
  getPrefLabelOfNode: (node, store, graph) => {
    return store.any(node, SKOS('prefLabel'), undefined, graph);
  },
};
