import { Statement } from 'rdflib';
import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from '../forking-store-helpers';
import { EXT, FORM } from '../rdflib';

export function addValidationTriplesToFormNodesL(fieldSubject, store, graphs) {
  const validationSubjects = getValidationSubjectsOnNode(
    fieldSubject,
    store,
    graphs.sourceGraph
  );
  for (const subject of validationSubjects) {
    const validationTriples = getTriplesWithNodeAsSubject(
      subject,
      store,
      graphs.sourceBuilderGraph
    );

    if (validationTriples.length >= 1) {
      const formNodesLWithValidation = new Statement(
        EXT('formNodesL'),
        FORM('validations'),
        subject,
        graphs.sourceGraph
      );
      store.addAll([
        formNodesLWithValidation,
        ...validationTriples.map((triple) => {
          triple.graph = graphs.sourceGraph;
          return triple;
        }),
      ]);
    }
  }
}
