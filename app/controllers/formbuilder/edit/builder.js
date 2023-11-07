import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';

export default class FormbuilderEditBuilderController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked builderStore;
  @tracked builderForm;

  @tracked formCode;

  setupBuilderForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    this.deregisterFromObservable();

    const { formTtl, metaTtl, graphs } = this.model;

    this.builderStore = new ForkingStore();
    this.builderStore.parse(formTtl, graphs.formGraph.value, 'text/turtle');
    this.builderStore.parse(metaTtl, graphs.metaGraph.value, 'text/turtle');
    this.builderStore.parse(
      this.formCode,
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    );

    this.builderStore.registerObserver(() => {
      this.handleBuilderFormChange.perform();
    });
  });

  handleBuilderFormChange = restartableTask(async () => {
    await timeout(1); // small timeout to group multiple store observer callbacks together

    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );
    this.formCode = sourceTtl;
    this.formCodeManager.addFormCode(this.formCode);
  });

  setup() {
    console.log(`setup builder controller`);
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.setupBuilderForm.perform();
  }

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.clearObservers();
    }
  }
}
