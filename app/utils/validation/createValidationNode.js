import { BlankNode, triple } from 'rdflib';
import { FORM, RDF, SH } from '../rdflib';

export function createValidationNode(validationName, options) {
  const subject = new BlankNode();
  console.log({ subject });
  const aRequiredConstraintType = triple(
    subject,
    RDF('type'),
    FORM(validationName),
    options.graph
  );
  const grouping = triple(
    subject,
    FORM('grouping'),
    FORM('Bag'),
    options.graph
  );
  const resultMessage = triple(
    subject,
    SH('resultMessage'),
    options.resultMessage,
    options.graph
  );
  return [aRequiredConstraintType, grouping, resultMessage];
}
