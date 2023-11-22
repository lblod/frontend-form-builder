import { Statement } from 'rdflib';
import { getValidationSubjectsOnNode } from '../forking-store-helpers';
import { EXT, FORM } from '../rdflib';
import { createBlankNodeForValidation } from './create-blankNode-for-validation';

export function addValidationTriplesToFormNodesL(fieldSubject, store, graphs) {
  const validationSubjects = getValidationSubjectsOnNode(
    fieldSubject,
    store,
    graphs.sourceGraph
  );

  for (const subject of validationSubjects) {
    const validation = createBlankNodeForValidation(
      subject,
      store,
      graphs.sourceGraph
    );
    const formNodesLWithValidation = new Statement(
      EXT('formNodesL'),
      FORM('validations'),
      validation.node,
      graphs.sourceGraph
    );
    store.addAll([formNodesLWithValidation, ...validation.statements]);
  }
}
