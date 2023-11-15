import Controller from '@ember/controller';

import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';

export default class FormbuilderEditCreateCodelistController extends Controller {
  @tracked builderStore;
  @tracked builderForm;

  @tracked formTtlCode;

  setup() {
    this.setupBuilderForm.perform();
  }

  setupBuilderForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    const { formTtl, graphs } = this.model;

    const builderStore = new ForkingStore();
    builderStore.parse(formTtl, graphs.formGraph, 'text/turtle');
    builderStore.parse(
      this.getFormTtlCode(),
      graphs.sourceGraph,
      'text/turtle'
    );

    this.builderStore = builderStore;
    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    );

    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      graphs.sourceGraph
    );
    console.log({ sourceTtl });

    this.builderStore.registerObserver(() => {
      this.handleBuilderFormChange.perform();
    });
  });

  handleBuilderFormChange = restartableTask(async () => {
    await timeout(1); // small timeout to group multiple store observer callbacks together

    this.formTtlCode = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );

    console.log(`this.formCodeTtl`, this.formCodeTtl);

    this.setup();
  });

  getFormTtlCode() {
    if (!this.formTtlCode || this.formTtlCode == '') {
      this.formCodeTtl = this.model.template;
    }

    return this.formCodeTtl;
  }
}
