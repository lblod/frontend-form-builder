import { FORM, RDF, NODES, SH } from '../rdflib';
import { triple } from 'rdflib';

export async function addIsRequiredValidationToForm(
  validationNodeId,
  builderStore,
  graphs
) {
  // TODO add validation of the properties before executing the code below

  console.log('addIsRequiredValidationTo FORM');

  const subject = NODES(validationNodeId);
  // const subject = NODES(uuidv4());
  const requiredConstraint = triple(
    subject,
    RDF('type'),
    FORM('RequiredConstraint'),
    graphs.sourceGraph
  );
  const bagGrouping = triple(
    subject,
    FORM('grouping'),
    FORM('Bag'),
    graphs.sourceGraph
  );
  const resultMessage = triple(
    subject,
    SH('resultMessage'),
    'Dit veld is verplicht',
    graphs.sourceGraph
  );

  builderStore.addAll([requiredConstraint, bagGrouping, resultMessage]);

  // its not clear that this builderStore is being serialized here builder store wiulol be updated without knowing
  const updatedTtlCode = builderStore.serializeDataMergedGraph(
    graphs.sourceGraph
  );

  console.log({ updatedTtlCode });

  return updatedTtlCode;
}
