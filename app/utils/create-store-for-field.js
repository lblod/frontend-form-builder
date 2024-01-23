import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { parseStoreGraphs } from './validation/helpers';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { fieldValidationFormTemplate } from './ttl-templates/field-validation-template';

export async function createStoreForFieldData(fieldData, graphs) {
  const fieldStore = new ForkingStore();
  fieldStore.addAll(fieldData.triples);
  fieldStore.parse(
    fieldValidationFormTemplate,
    graphs.sourceGraph,
    'text/turtle'
  );

  const ttl = fieldStore.serializeDataMergedGraph(graphs.sourceGraph);

  const builderStore = new ForkingStore();
  await parseStoreGraphs(builderStore, ttl);

  return {
    name: fieldData.name,
    subject: fieldData.subject,
    store: builderStore,
    form: builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    ),
  };
}
