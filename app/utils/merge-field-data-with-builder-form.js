import {
  getAllTriples,
  getNodeValidationTriples,
} from './forking-store-helpers';
import { EMBER } from './rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { removeUnassignedNodesFromGraph } from './remove-unassigned-nodes-from-graph';
import { templatePrefixes } from './validation-form-templates/template-prefixes';
import { parseStoreGraphs } from './validation-helpers';

export async function mergeFieldValidationFormWithBuilderForm(
  fieldData,
  builderFormTtl,
  graphs
) {
  const storeWithMergedField = new ForkingStore();
  await parseStoreGraphs(storeWithMergedField, templatePrefixes);
  storeWithMergedField.addAll(fieldData.triples);

  const builderStore = new ForkingStore();
  await parseStoreGraphs(builderStore, builderFormTtl);

  const validationnodesOfField = getNodeValidationTriples(
    fieldData.subject,
    builderStore,
    graphs.sourceGraph
  );

  builderStore.removeStatements(validationnodesOfField);
  removeUnassignedNodesFromGraph(
    EMBER('source-node'),
    builderStore,
    graphs.sourceGraph
  );

  const allTriplesInGraph = getAllTriples(builderStore, graphs.sourceGraph);

  const notFieldTriples = allTriplesInGraph.filter(
    (triple) => triple.subject.value !== fieldData.subject.value
  );
  storeWithMergedField.addAll(notFieldTriples);

  removeUnassignedNodesFromGraph(
    EMBER('source-node'),
    storeWithMergedField,
    graphs.sourceGraph
  );

  return storeWithMergedField;
}
