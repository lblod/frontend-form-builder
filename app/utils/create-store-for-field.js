import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { parseStoreGraphs } from './validation/helpers';
import { FORM, RDF } from './rdflib';
import { fieldValidationFormTemplate } from './validation/form-templates/template';

export async function createStoreForFieldData(fieldData, graphs) {
  const fieldStore = new ForkingStore();
  fieldStore.addAll(fieldData.triples);
  fieldStore.parse(
    fieldValidationFormTemplate,
    graphs.sourceGraph,
    'text/turtle'
  );

  const ttl = fieldStore.serializeDataMergedGraph(graphs.sourceGraph);
  await parseStoreGraphs(fieldStore, ttl);

  return {
    name: fieldData.name,
    subject: fieldData.subject,
    store: fieldStore,
    form: fieldStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    ),
  };
}
