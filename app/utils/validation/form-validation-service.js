import { ForkingStore } from '@lblod/ember-submission-form-fields';

export default class FormValidationService {
  constructor(forkingStore, graphs) {
    this.forkingStore = forkingStore;
    this.graphs = graphs;
  }

  static init(formTurtleCode, formTtl, metaTtl, graphs) {
    const store = new ForkingStore();
    store.parse(formTtl, graphs.formGraph.value, 'text/turtle');
    store.parse(metaTtl, graphs.metaGraph.value, 'text/turtle');
    store.parse(formTurtleCode, graphs.sourceGraph.value, 'text/turtle');

    return new this(store, graphs);
  }

  getFormTtlCode() {
    return this.forkingStore.serializeDataMergedGraph(this.graphs.sourceGraph);
  }
}
