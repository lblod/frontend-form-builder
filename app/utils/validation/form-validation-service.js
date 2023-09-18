import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../get-local-file-content-as-text';

export default class FormValidationService {
  constructor(forkingStore, graphs) {
    this.forkingStore = forkingStore;
    this.graphs = graphs;
  }

  static async init(formTurtleCode, formTtl, metaTtl, graphs) {
    const validationTtlAsText = await getLocalFileContentAsText(
      '/forms/validation.ttl'
    );

    const store = new ForkingStore();
    store.parse(formTtl, graphs.formGraph.value, 'text/turtle');
    store.parse(metaTtl, graphs.metaGraph.value, 'text/turtle');
    store.parse(
      validationTtlAsText,
      graphs.validationGraph.value,
      'text/turtle'
    );
    store.parse(formTurtleCode, graphs.sourceGraph.value, 'text/turtle');

    return new this(store, graphs);
  }

  getFormTtlCode() {
    return this.forkingStore.serializeDataMergedGraph(this.graphs.sourceGraph);
  }
}
