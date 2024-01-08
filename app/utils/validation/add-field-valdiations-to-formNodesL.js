import { Statement } from 'rdflib';
import { EXT, FORM } from '../rdflib';
import { createBlankNodeForValidation } from './create-blankNode-for-validation';
import { ForkingStoreHelper } from '../forking-store-helper';

export function addValidationTriplesToFormNodesL(fieldSubject, store, graphs) {
  const validationSubjects = ForkingStoreHelper.getValidationSubjectsOnNode(
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
